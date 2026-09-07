/**
 * @file client.ts
 * @description Cliente Supabase para uso no navegador / componentes React ("use client").
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl: string | null = null;
let lastUsedKey: string | null = null;

export function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "[Supabase Config Error] As variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias."
    );
  }

  if (!cachedClient || lastUsedUrl !== url || lastUsedKey !== anonKey) {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    lastUsedUrl = url;
    lastUsedKey = anonKey;
  }

  return cachedClient;
}

/**
 * Cliente Supabase com chave anônima para interações autenticadas no frontend.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop: string | symbol) {
    const client = getSupabaseClient() as any;
    const val = client[prop];
    if (typeof val === "function") {
      return val.bind(client);
    }
    return val;
  },
});

