const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

export const SUPABASE_ENV_ERROR =
  'Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY';

type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
};

type AuthSession = {
  access_token: string;
  refresh_token?: string;
  user: AuthUser;
};

type SupabaseError = {
  message: string;
  [key: string]: unknown;
};
export interface SupabaseQueryOptions {
  select: string;
  orderBy?: string;
  ascending?: boolean;
  offset?: number;
  limit?: number;
  filters?: string[];
}

const SESSION_KEY = 'supabase_auth_session';
const listeners = new Set<(event: string, session: AuthSession | null) => void>();

const missingEnvError = (): SupabaseError => ({
  message: 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable auth.',
});

const safeJsonParse = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const getConfig = () => {
  if (!hasSupabaseEnv || !supabaseUrl || !supabaseAnonKey) return null;
  return { supabaseUrl, supabaseAnonKey };
};

const createMissingEnvError = () => ({ message: SUPABASE_ENV_ERROR });

const getStoredSession = () => {
  if (typeof window === 'undefined') return null;
  return safeJsonParse<AuthSession>(localStorage.getItem(SESSION_KEY));
};

const setStoredSession = (session: AuthSession | null) => {
  if (typeof window === 'undefined') return;

  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
};

const emitAuthChange = (event: string, session: AuthSession | null) => {
  listeners.forEach((listener) => listener(event, session));
};

const buildAuthHeaders = (withAuth = true) => {
  const config = getConfig();
  const session = getStoredSession();

  if (!config) {
    return {
      apikey: '',
      Authorization: 'Bearer ',
      'Content-Type': 'application/json',
    };
  }

  return {
    apikey: config.supabaseAnonKey,
    Authorization: withAuth
      ? `Bearer ${session?.access_token || config.supabaseAnonKey}`
      : `Bearer ${config.supabaseAnonKey}`,
    'Content-Type': 'application/json',
  };
};

const buildRestQuery = (options: SupabaseQueryOptions): string => {
  const params = new URLSearchParams();
  params.set('select', options.select);

  if (options.orderBy) {
    params.set('order', `${options.orderBy}.${options.ascending === false ? 'desc' : 'asc'}`);
  }

  for (const filter of options.filters || []) {
    const [key, ...valueParts] = filter.split('=');
    const value = valueParts.join('=');
    if (key && value) {
      params.set(key, value);
    }
  }

  if (typeof options.offset === 'number') {
    params.set('offset', String(options.offset));
  }

  if (typeof options.limit === 'number') {
    params.set('limit', String(options.limit));
  }

  return params.toString();
};

const parseOAuthHashSession = async () => {
  if (!hasSupabaseEnv || !supabaseUrl || !supabaseAnonKey) return;
  const config = getConfig();
  if (!config || typeof window === 'undefined') return;

  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  if (!hash.includes('access_token=')) return;

  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token') || undefined;

  if (!accessToken) return;

  const userResponse = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResponse.ok) return;

  const user = (await userResponse.json()) as AuthUser;
  const session: AuthSession = {
    access_token: accessToken,
    refresh_token: refreshToken,
    user,
  };

  setStoredSession(session);
  emitAuthChange('SIGNED_IN', session);

  const cleanUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
  window.history.replaceState({}, document.title, cleanUrl);
};

const ensureOAuthSessionParsed = () => {
  if (!hasSupabaseEnv) return;
  void parseOAuthHashSession();
};

const authHeaders = (withAuth = true) => {
  const session = getStoredSession();

  return {
    apikey: supabaseAnonKey || '',
    Authorization: withAuth ? `Bearer ${session?.access_token || supabaseAnonKey || ''}` : `Bearer ${supabaseAnonKey || ''}`,
    'Content-Type': 'application/json',
  };
};

const buildFilter = (key: string, op: string, value: string | number | boolean) =>
  `${encodeURIComponent(key)}=${encodeURIComponent(`${op}.${value}`)}`;

export async function querySupabase<T = Record<string, unknown>>(
  table: string,
  options: SupabaseQueryOptions,
): Promise<{ data: T[]; count?: number; error?: string }> {
  const config = getConfig();
  if (!config) {
    return { data: [], error: SUPABASE_ENV_ERROR };
  }

  const query = buildRestQuery(options);
  const url = `${config.supabaseUrl}/rest/v1/${table}?${query}`;

  const response = await fetch(url, {
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      Prefer: 'count=exact',
    },
  });

  const countHeader = response.headers.get('content-range');
  const count = countHeader?.includes('/') ? Number(countHeader.split('/')[1]) : undefined;

  if (!response.ok) {
    const msg = await response.text();
    return { data: [], error: msg || `Supabase returned ${response.status}` };
  }

  const data = (await response.json()) as T[];
  return { data, count };
}

// Source of truth Supabase adapter for auth + direct REST operations.
export const supabase = {
  auth: {
    onAuthStateChange(callback: (event: string, session: AuthSession | null) => void) {
      ensureOAuthSessionParsed();
      listeners.add(callback);

      return {
        data: {
          subscription: {
            unsubscribe: () => listeners.delete(callback),
          },
        },
      };
    },

    async getSession() {
      ensureOAuthSessionParsed();
      return { data: { session: getStoredSession() } };
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      if (!hasSupabaseEnv || !supabaseUrl || !supabaseAnonKey) {
        return { error: missingEnvError() };
      }

      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      const config = getConfig();
      if (!config) return { data: null, error: createMissingEnvError() };

      const response = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: buildAuthHeaders(false),
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json();
      if (!response.ok) return { data: null, error: payload };

      const session: AuthSession = {
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
        user: payload.user,
      };
      setStoredSession(session);
      emitAuthChange('SIGNED_IN', session);

      return { data: payload, error: null };
    },

    async signUp({ email, password }: { email: string; password: string }) {
      if (!hasSupabaseEnv || !supabaseUrl || !supabaseAnonKey) {
        return { error: missingEnvError() };
      }

      const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      const config = getConfig();
      if (!config) return { data: null, error: createMissingEnvError() };

      const response = await fetch(`${config.supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: buildAuthHeaders(false),
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json();
      if (!response.ok) return { data: null, error: payload };

      if (payload.access_token && payload.user) {
        const session: AuthSession = {
          access_token: payload.access_token,
          refresh_token: payload.refresh_token,
          user: payload.user,
        };
        setStoredSession(session);
        emitAuthChange('SIGNED_IN', session);
      }

      return { data: payload, error: null };
    },

    async signInWithOAuth({ provider, options }: { provider: 'google'; options?: { redirectTo?: string } }) {
      if (!hasSupabaseEnv || !supabaseUrl) {
        return { error: missingEnvError() };
      const config = getConfig();
      if (!config || typeof window === 'undefined') {
        return { error: createMissingEnvError() };
      }

      const redirectTo = options?.redirectTo || window.location.origin;
      const authUrl = `${config.supabaseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectTo)}`;
      window.location.href = authUrl;
      return { error: null };
    },

    async signOut() {
      if (!hasSupabaseEnv || !supabaseUrl || !supabaseAnonKey) {
        setStoredSession(null);
        emitAuthChange('SIGNED_OUT', null);
        return { error: null };
      }

      const config = getConfig();
      const session = getStoredSession();

      if (config && session?.access_token) {
        await fetch(`${config.supabaseUrl}/auth/v1/logout`, {
          method: 'POST',
          headers: buildAuthHeaders(true),
        });
      }

      setStoredSession(null);
      emitAuthChange('SIGNED_OUT', null);
      return { error: null };
    },
  },

  async select(
    table: string,
    options: {
      filters?: Array<{ key: string; op: 'eq' | 'ilike' | 'gt'; value: string | number | boolean }>;
      order?: { column: string; ascending?: boolean };
      limit?: number;
      single?: boolean;
    } = {},
  ) {
    if (!hasSupabaseEnv || !supabaseUrl || !supabaseAnonKey) {
      return { data: null, error: missingEnvError() };
    }
    const config = getConfig();
    if (!config) return { data: null, error: createMissingEnvError() };

    const params: string[] = ['select=*'];

    for (const filter of options.filters || []) {
      params.push(buildFilter(filter.key, filter.op, filter.value));
    }

    if (options.order) {
      params.push(
        `order=${encodeURIComponent(
          `${options.order.column}.${options.order.ascending === false ? 'desc' : 'asc'}`,
        )}`,
      );
    }

    if (typeof options.limit === 'number') {
      params.push(`limit=${options.limit}`);
    }

    const response = await fetch(`${config.supabaseUrl}/rest/v1/${table}?${params.join('&')}`, {
      headers: buildAuthHeaders(true),
    });

    const payload = await response.json();
    if (!response.ok) return { data: null, error: payload };

    if (options.single) {
      return { data: Array.isArray(payload) ? payload[0] || null : payload, error: null };
    }

    return { data: payload, error: null };
  },

  async insert(table: string, value: Record<string, any>, single = false) {
    if (!hasSupabaseEnv || !supabaseUrl || !supabaseAnonKey) {
      return { data: null, error: missingEnvError() };
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    const config = getConfig();
    if (!config) return { data: null, error: createMissingEnvError() };

    const response = await fetch(`${config.supabaseUrl}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        ...buildAuthHeaders(true),
        Prefer: single ? 'return=representation' : 'return=minimal',
      },
      body: JSON.stringify(value),
    });

    if (response.status === 204) return { data: null, error: null };

    const payload = await response.json();
    if (!response.ok) return { data: null, error: payload };

    return { data: single ? payload[0] || null : payload, error: null };
  },

  async update(table: string, value: Record<string, any>, filters: Array<{ key: string; value: string | number }>) {
    if (!hasSupabaseEnv || !supabaseUrl || !supabaseAnonKey) {
      return { error: missingEnvError() };
    }
    const config = getConfig();
    if (!config) return { error: createMissingEnvError() };

    const params = filters.map((f) => buildFilter(f.key, 'eq', f.value)).join('&');

    const response = await fetch(`${config.supabaseUrl}/rest/v1/${table}?${params}`, {
      method: 'PATCH',
      headers: buildAuthHeaders(true),
      body: JSON.stringify(value),
    });

    if (response.status === 204) return { error: null };

    const payload = await response.json();
    return response.ok ? { error: null } : { error: payload };
  },

  async upsert(table: string, value: Record<string, any>, onConflict: string) {
    if (!hasSupabaseEnv || !supabaseUrl || !supabaseAnonKey) {
      return { error: missingEnvError() };
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
      method: 'POST',
      headers: {
        ...authHeaders(true),
        Prefer: 'resolution=merge-duplicates',
    const config = getConfig();
    if (!config) return { error: createMissingEnvError() };

    const response = await fetch(
      `${config.supabaseUrl}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`,
      {
        method: 'POST',
        headers: {
          ...buildAuthHeaders(true),
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(value),
      },
    );

    if (response.status === 204) return { error: null };

    const payload = await response.json();
    return response.ok ? { error: null } : { error: payload };
  },
};
