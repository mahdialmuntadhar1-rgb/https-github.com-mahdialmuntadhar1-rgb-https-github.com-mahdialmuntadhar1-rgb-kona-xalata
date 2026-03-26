/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_CLOUDFLARE_ACCOUNT_ID?: string;
  readonly VITE_CLOUDFLARE_PROJECT_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
