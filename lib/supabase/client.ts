import { createBrowserClient } from '@supabase/ssr';

// Placeholder URL and key for build time (will be replaced at runtime)
const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY = 'placeholder-key-for-build-time';

/**
 * Supabase client for use in Client Components
 * During static page generation, uses placeholder values that will be
 * replaced with real values when the page hydrates on the client
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || PLACEHOLDER_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || PLACEHOLDER_KEY;

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
