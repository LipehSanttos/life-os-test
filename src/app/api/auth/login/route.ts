import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createToken, AUTH_COOKIE_NAME, isValidUsernameOrEmail, hashPassword } from "@/lib/auth";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/admin";

// Estrutura de Rate Limiting em memória (janela deslizante)
interface RateLimitRecord {
  attempts: number;
  firstAttempt: number;
  blockedUntil?: number;
}

const loginAttempts = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000; // 1 minuto
const BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutos de bloqueio temporário após estourar

function getClientIdentifier(req: NextRequest, login: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
  return `${ip}:${login.toLowerCase().trim()}`;
}

function checkRateLimit(identifier: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record) return { allowed: true };

  if (record.blockedUntil && now < record.blockedUntil) {
    const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, waitSeconds: remainingSeconds };
  }

  // Reseta janela se expirou
  if (now - record.firstAttempt > WINDOW_MS && (!record.blockedUntil || now >= record.blockedUntil)) {
    loginAttempts.delete(identifier);
    return { allowed: true };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    const remainingSeconds = Math.ceil(BLOCK_DURATION_MS / 1000);
    return { allowed: false, waitSeconds: remainingSeconds };
  }

  return { allowed: true };
}

function recordFailedAttempt(identifier: string) {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record || now - record.firstAttempt > WINDOW_MS) {
    loginAttempts.set(identifier, { attempts: 1, firstAttempt: now });
  } else {
    record.attempts += 1;
    if (record.attempts >= MAX_ATTEMPTS) {
      record.blockedUntil = now + BLOCK_DURATION_MS;
    }
  }
}

function resetAttempts(identifier: string) {
  loginAttempts.delete(identifier);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { login, password } = body;

    if (!login || !password) {
      return NextResponse.json(
        { error: "Por favor, informe seu usuário/e-mail e a senha." },
        { status: 400 }
      );
    }

    const identifier = getClientIdentifier(req, login);
    const rateLimit = checkRateLimit(identifier);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Muitas tentativas incorretas. Por segurança, tente novamente em ${rateLimit.waitSeconds} segundos.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.waitSeconds || 60) },
        }
      );
    }

    const validation = isValidUsernameOrEmail(login);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const cleanLogin = login.trim().toLowerCase();

    // Busca o usuário na tabela User para resolver e-mail e dados locais
    let existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanLogin },
          { name: { equals: cleanLogin } },
        ],
      },
    }).catch(() => null);

    const targetEmail = cleanLogin.includes("@") ? cleanLogin : existingUser?.email;

    let supabaseErrorMessage: string | null = null;

    // 1. Tentativa de autenticação via Supabase Auth
    if (isSupabaseConfigured()) {
      if (!targetEmail) {
        return NextResponse.json(
          {
            error:
              "Não foi possível identificar o e-mail correspondente. Por favor, faça login utilizando o seu endereço de e-mail completo.",
          },
          { status: 400 }
        );
      }

      try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data: sbData, error: sbError } = await supabaseAdmin.auth.signInWithPassword({
          email: targetEmail,
          password,
        });

        if (sbData?.user && !sbError) {
          let user = existingUser;

          if (!user) {
            user = await prisma.user.findFirst({ where: { email: targetEmail } });
          }

          if (!user) {
            // Auto-provisionar registro na tabela User caso exista apenas no Auth
            user = await prisma.user.create({
              data: {
                id: sbData.user.id,
                email: targetEmail,
                name: (sbData.user.user_metadata?.name as string) || targetEmail.split("@")[0],
                role: (sbData.user.user_metadata?.role as string) || "USER",
                passwordHash: hashPassword(password),
              },
            });
          } else if (user.passwordHash === "managed_by_supabase_auth") {
            // Sincroniza o hash local para permitir login offline / fallback
            await prisma.user.update({
              where: { id: user.id },
              data: { passwordHash: hashPassword(password) },
            }).catch(() => null);
          }

          const token = createToken({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          });

          const response = NextResponse.json({
            success: true,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
          });

          response.cookies.set({
            name: AUTH_COOKIE_NAME,
            value: token,
            httpOnly: true,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 dias
          });

          resetAttempts(identifier);
          return response;
        } else if (sbError) {
          console.warn("[auth/login] Supabase Auth erro:", sbError.message);
          supabaseErrorMessage = sbError.message;
        }
      } catch (sbErr: any) {
        console.warn("[auth/login] Falha ao conectar no Supabase Auth:", sbErr.message);
        supabaseErrorMessage = sbErr.message;
      }
    } else {
      supabaseErrorMessage = "Supabase não está configurado no servidor (verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY).";
    }

    // 2. Autenticação de contingência via hash PBKDF2 na tabela User
    if (existingUser) {
      const isValid = verifyPassword(password, existingUser.passwordHash);
      if (isValid) {
        resetAttempts(identifier);
        const token = createToken({
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
        });

        const response = NextResponse.json({
          success: true,
          user: { id: existingUser.id, name: existingUser.name, email: existingUser.email, role: existingUser.role },
        });

        response.cookies.set({
          name: AUTH_COOKIE_NAME,
          value: token,
          httpOnly: true,
          path: "/",
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
        });

        return response;
      }
    }

    recordFailedAttempt(identifier);

    // Formata mensagem de erro específica do Supabase em português
    let detailedError = "Credenciais inválidas. Verifique seu e-mail e senha.";
    if (supabaseErrorMessage) {
      const lowerErr = supabaseErrorMessage.toLowerCase();
      if (lowerErr.includes("invalid login credentials")) {
        detailedError = "E-mail ou senha incorretos no Supabase.";
      } else if (lowerErr.includes("email not confirmed")) {
        detailedError = "Seu e-mail ainda não foi confirmado no Supabase. Confirme o e-mail ou habilite auto-confirmação no painel.";
      } else {
        detailedError = `Supabase Auth: ${supabaseErrorMessage}`;
      }
    }

    return NextResponse.json(
      { error: detailedError },
      { status: 401 }
    );
  } catch (error: any) {
    console.error("[auth/login] Erro interno:", error.message);
    return NextResponse.json(
      { error: error.message || "Erro ao processar autenticação. Tente novamente." },
      { status: 500 }
    );
  }
}
