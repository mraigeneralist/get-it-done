/**
 * Environment access, validated once at import.
 *
 * Only EXPO_PUBLIC_* variables exist at runtime — Expo inlines them into the
 * bundle at build time and strips everything else. That is why the Supabase
 * URL and anon key carry the prefix and the service-role key never does: the
 * anon key is meant to be public and is useless without a session, because
 * row-level security decides what any given user can actually see.
 *
 * Note these are inlined literally, so `process.env[someVariable]` does not
 * work — the names must be written out in full.
 */

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Failing loudly here beats a confusing network error five screens later.
  throw new Error(
    'Missing Supabase config. Copy .env.example to .env, fill in ' +
      'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, then restart ' +
      'the dev server with `npx expo start -c` — env values are baked in at ' +
      'bundle time, so a running server will not pick up changes.',
  );
}

export const env = {
  supabaseUrl,
  supabaseAnonKey,
  isDev: process.env.APP_ENV !== 'production',
} as const;
