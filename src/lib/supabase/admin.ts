/**
 * @file admin.ts
 * @description Cliente Administrativo do Supabase com privilégios de Service Role.
 * Utilizado no servidor para autenticação, provisionamento, exclusão e gestão de usuários.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cachedAdminClient: SupabaseClient | null = null;
let lastUsedUrl: string | null = null;
let lastUsedKey: string | null = null;

/**
 * Retorna se o Supabase está configurado com URL e Chave válidas.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && url.startsWith("http"));
}

/**
 * Retorna o diagnóstico detalhado das variáveis de ambiente disponíveis.
 */
export function getSupabaseConfigStatus(): string {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
  const hasAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasService = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const hasAuth = Boolean(process.env.AUTH_SECRET);

  const missing: string[] = [];
  if (!hasUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!hasAnon) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!hasService) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!hasAuth) missing.push("AUTH_SECRET");

  if (missing.length > 0) {
    return `Variáveis ausentes no ambiente (.env / Cloudflare): ${missing.join(", ")}`;
  }
  return "Todas as variáveis foram detectadas.";
}

/**
 * Obtém ou inicializa a instância administrativa do Supabase com verificação dinâmica de ambiente.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "[Configuração Ausente] As variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configuradas no ambiente."
    );
  }

  if (!cachedAdminClient || lastUsedUrl !== url || lastUsedKey !== key) {
    cachedAdminClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    lastUsedUrl = url;
    lastUsedKey = key;
  }

  return cachedAdminClient;
}

/**
 * Proxy dinâmico que sempre despacha chamadas para o cliente Supabase com credenciais ativas.
 */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop: string | symbol) {
    const client = getSupabaseAdmin() as any;
    const val = client[prop];
    if (typeof val === "function") {
      return val.bind(client);
    }
    return val;
  },
});
