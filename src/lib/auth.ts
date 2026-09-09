/**
 * @file auth.ts
 * @description Módulo central de autenticação — tokens, sessões e permissões.
 * SEGURANÇA: Sem senhas hardcoded, sem plaintext comparison, PBKDF2 seguro.
 */

import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

/** Retorna o segredo HMAC — obtido exclusivamente das variáveis de ambiente */
function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "[Configuração Ausente] A variável de ambiente AUTH_SECRET deve estar configurada no servidor com no mínimo 16 caracteres."
    );
  }
  return secret;
}

export const AUTH_COOKIE_NAME = "iteam_auth_token";

/**
 * Valida o formato de login (e-mail ou nome de usuário).
 */
export function isValidUsernameOrEmail(login: string): { valid: boolean; error?: string } {
  if (!login || login.trim() === "") {
    return { valid: false, error: "O nome de usuário ou e-mail é obrigatório." };
  }

  const trimmed = login.trim();

  if (trimmed.includes("@")) {
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      return { valid: false, error: "Formato de e-mail inválido." };
    }
    return { valid: true };
  }

  if (trimmed.length < 2) {
    return { valid: false, error: "O nome de usuário deve ter pelo menos 2 caracteres." };
  }

  return { valid: true };
}

/**
 * Gera hash criptográfico seguro PBKDF2 com sal de 16 bytes.
 * Iterações: 100.000 (compatível com NIST 2024 para SHA-512).
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Compara senha em texto puro contra o hash PBKDF2 armazenado.
 * Usa comparação em tempo constante para prevenir timing attacks.
 */
export function verifyPassword(password: string, storedHash?: string | null): boolean {
  try {
    if (!storedHash || !password) return false;

    // Senhas gerenciadas pelo Supabase Auth — verificação delegada ao Supabase
    if (storedHash === "managed_by_supabase_auth") return false;

    // Hash PBKDF2 padrão: salt:hash
    if (!storedHash.includes(":")) return false;

    const [salt, originalHash] = storedHash.split(":");
    if (!salt || !originalHash) return false;

    const hash = crypto.pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");

    // Comparação em tempo constante para prevenir timing attacks
    const a = Buffer.from(hash, "hex");
    const b = Buffer.from(originalHash, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Deriva uma chave de 256 bits (32 bytes) a partir do AUTH_SECRET para criptografia AES-256-GCM.
 */
function getEncryptionKey(): Buffer {
  return crypto.createHash("sha256").update(getAuthSecret()).digest();
}

/**
 * Cria um token de sessão completamente criptografado com AES-256-GCM (7 dias).
 * NENHUM dado (e-mail, nome, id) fica visível em texto puro no cookie.
 * Formato gerado: iv.authTag.ciphertext (todos em Base64URL)
 */
export function createToken(payload: { id: string; email: string; name: string; role?: string }): string {
  const data = JSON.stringify({
    ...payload,
    role: payload.role || "USER",
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 dias de validade
    iat: Date.now(),
  });

  // Gera vetor de inicialização (IV) de 12 bytes aleatório para cada token
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);

  let encrypted = cipher.update(data, "utf8", "base64url");
  encrypted += cipher.final("base64url");

  // Tag de autenticação de 16 bytes que garante integridade contra adulterações
  const authTag = cipher.getAuthTag().toString("base64url");
  const ivEncoded = iv.toString("base64url");

  return `${ivEncoded}.${authTag}.${encrypted}`;
}

/**
 * Decifra e valida a integridade do token usando AES-256-GCM.
 * Rejeita imediatamente tokens adulterados, expirados ou corrompidos.
 */
export function verifyToken(token: string): { id: string; email: string; name: string; role: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [ivEncoded, authTagEncoded, ciphertext] = parts;
    if (!ivEncoded || !authTagEncoded || !ciphertext) return null;

    const iv = Buffer.from(ivEncoded, "base64url");
    const authTag = Buffer.from(authTagEncoded, "base64url");

    if (iv.length !== 12 || authTag.length !== 16) return null;

    const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, "base64url", "utf8");
    decrypted += decipher.final("utf8");

    const payload = JSON.parse(decrypted);

    // Valida tempo de expiração do token
    if (payload.exp && Date.now() > payload.exp) return null;

    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role || "USER",
    };
  } catch {
    // Falha na decifragem ou adulteração de dados
    return null;
  }
}

/**
 * Obtém o usuário autenticado a partir dos cookies da requisição.
 * SEGURANÇA: Sempre busca do banco para garantir que o usuário ainda existe e tem a role atual.
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    // SEMPRE busca no banco — nunca retorna dados apenas do token
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    const resolvedName =
      user.name?.trim() ||
      decoded.name?.trim() ||
      user.email?.split("@")[0] ||
      "";

    return {
      id: user.id,
      email: user.email,
      name: resolvedName,
      role: user.role,
      avatarUrl: user.avatarUrl ?? null,
      createdAt: user.createdAt,
    };
  } catch {
    return null;
  }
}

/**
 * Verifica se o usuário é Administrador.
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}
