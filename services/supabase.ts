// Legacy service entrypoint kept for compatibility.
// Source of truth lives in src/lib/supabase.ts.
export {
  hasSupabaseEnv,
  SUPABASE_ENV_ERROR,
  querySupabase,
  supabase,
  type SupabaseQueryOptions,
} from '../src/lib/supabase';
