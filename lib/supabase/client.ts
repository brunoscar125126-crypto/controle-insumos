import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase pra uso em Client Components ("use client").
 * Usa a anon key — RLS garante que cada usuário só vê seus próprios dados.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
