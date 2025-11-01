import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function hasSupabaseEnv(): boolean {
  return Boolean(import.meta.env.VITE_SB_URL && import.meta.env.VITE_SB_ANON_KEY);
}

export function getSupabase(): SupabaseClient | null {
  if (!hasSupabaseEnv()) return null;
  if (client) return client;
  client = createClient(
    import.meta.env.VITE_SB_URL as string,
    import.meta.env.VITE_SB_ANON_KEY as string
  );
  return client;
}

export function assertSupabase(): SupabaseClient {
  const c = getSupabase();
  if (!c) {
    throw new Error('Missing Supabase env (VITE_SB_URL / VITE_SB_ANON_KEY).');
  }
  return c;
}

export async function getCurrentUserId(): Promise<string | 'anon'> {
  const c = getSupabase();
  if (!c) return 'anon';
  const { data, error } = await c.auth.getUser();
  if (error || !data?.user?.id) return 'anon';
  return data.user.id;
}

export function getUserIdSync(): string | 'anon' {
  const uid = (globalThis as unknown as { __uid?: unknown }).__uid;
  return typeof uid === 'string' && uid.length > 0 ? uid : 'anon';
}

export const getUserId = getCurrentUserId;
