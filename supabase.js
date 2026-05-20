/**
 * supabase.js — CodiceFacile Supabase client
 * -------------------------------------------
 * Single source of truth for the Supabase connection.
 * All pages load this before auth.js.
 *
 * The anon key is intentionally public — it is safe to commit.
 * Row-Level Security policies (set in Supabase dashboard) enforce
 * what each role can actually read or write.
 */

const SUPABASE_URL  = 'https://lqpqxlvyxlhqbtdqoqgd.supabase.co';
const SUPABASE_ANON = 'sb_publishable_NZDfsrHUHxebDFMbGGCWLA_kA1ffcyp';

// supabase-js is loaded via CDN <script> tag before this file.
// window.supabase is the UMD bundle export.
const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    // Persist session in localStorage so page reloads keep the user logged in
    persistSession: true,
    autoRefreshToken: true,
    // Use the current page URL as the redirect base for magic links / OAuth
    detectSessionInUrl: true,
  }
});

/**
 * Exported client — use this everywhere instead of calling createClient again.
 * Example:
 *   const { data, error } = await SupabaseClient.from('merchants').select('*');
 */
const SupabaseClient = _sb;
