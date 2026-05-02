import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

export const supabase = (typeof window === 'undefined')
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  : null;

export function createClientComponent() {
  if (typeof window === 'undefined') return supabase;

  if (!globalThis.__supabase_browser_client) {
    globalThis.__supabase_browser_client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }

  return globalThis.__supabase_browser_client;
}