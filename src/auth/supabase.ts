import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function hasSupabaseEnv() {
  return Boolean(import.meta.env.VITE_SB_URL && import.meta.env.VITE_SB_ANON_KEY)
}

export function getSupabase(): SupabaseClient | null {
  if (!hasSupabaseEnv()) return null
  if (_client) return _client
  _client = createClient(
    import.meta.env.VITE_SB_URL as string,
    import.meta.env.VITE_SB_ANON_KEY as string
  )
  // @ts-expect-error - expose client for debugging in the browser console
  if (typeof window !== 'undefined') (window as any).supabase = _client
  return _client
}

export function assertSupabase(): SupabaseClient {
  const c = getSupabase()
  if (!c) {
    throw new Error('Missing Supabase env (VITE_SB_URL/VITE_SB_ANON_KEY). Configure in Vercel → Project → Environment Variables.')
  }
  return c
}
