export type SupaErr = { code?: string; message?: string } | any;

export function supaErrorToMessage(e: SupaErr): string {
  const msg = String(e?.message ?? e ?? '').toLowerCase();

  if (!msg || msg === 'null') return 'Unexpected error. Please try again.';

  // Common supabase/RLS/auth patterns
  if (msg.includes('row-level security') || msg.includes('rls')) {
    return 'Permission denied by security policy (RLS). Are you signed in with the correct account?';
  }
  if (msg.includes('permission denied')) {
    return 'Permission denied. Please sign in again.';
  }
  if (msg.includes('invalid input')) {
    return 'Invalid input sent to the server.';
  }
  if (msg.includes('duplicate key')) {
    return 'A product with this name already exists.';
  }
  if (msg.includes('jwt') || msg.includes('auth') || msg.includes('unauthorized') || msg.includes('401')) {
    return 'You are not signed in or your session expired. Please sign in again.';
  }
  if (msg.includes('404') || msg.includes('not exist') || msg.includes('does not exist')) {
    return 'Backend table not found. Please run the Supabase SQL migration for projects.';
  }
  return e?.message ?? 'Unexpected error. Please try again.';
}

export function normalizeName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, 80);
}
