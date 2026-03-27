const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

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

const SESSION_KEY = 'supabase_auth_session';
const listeners = new Set<(event: string, session: AuthSession | null) => void>();

const safeJsonParse = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const getStoredSession = () => safeJsonParse<AuthSession>(localStorage.getItem(SESSION_KEY));

const setStoredSession = (session: AuthSession | null) => {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
};

const emitAuthChange = (event: string, session: AuthSession | null) => {
  listeners.forEach((listener) => listener(event, session));
};

const parseOAuthHashSession = async () => {
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  if (!hash.includes('access_token=')) return;

  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token') || undefined;

  if (!accessToken) return;

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
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
  void parseOAuthHashSession();
};

const authHeaders = (withAuth = true) => {
  const session = getStoredSession();

  return {
    apikey: supabaseAnonKey,
    Authorization: withAuth ? `Bearer ${session?.access_token || supabaseAnonKey}` : `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
  };
};

const buildFilter = (key: string, op: string, value: string | number | boolean) =>
  `${encodeURIComponent(key)}=${encodeURIComponent(`${op}.${value}`)}`;

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
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: authHeaders(false),
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json();
      if (!response.ok) return { error: payload };

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
      const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: authHeaders(false),
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json();
      if (!response.ok) return { error: payload };

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
      const redirectTo = options?.redirectTo || window.location.origin;
      const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectTo)}`;
      window.location.href = authUrl;
      return { error: null };
    },

    async signOut() {
      const session = getStoredSession();
      if (session?.access_token) {
        await fetch(`${supabaseUrl}/auth/v1/logout`, {
          method: 'POST',
          headers: authHeaders(true),
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
    const params: string[] = ['select=*'];

    for (const filter of options.filters || []) {
      params.push(buildFilter(filter.key, filter.op, filter.value));
    }

    if (options.order) {
      params.push(`order=${encodeURIComponent(`${options.order.column}.${options.order.ascending === false ? 'desc' : 'asc'}`)}`);
    }

    if (typeof options.limit === 'number') {
      params.push(`limit=${options.limit}`);
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${params.join('&')}`, {
      headers: authHeaders(true),
    });

    const payload = await response.json();
    if (!response.ok) return { data: null, error: payload };

    if (options.single) {
      return { data: Array.isArray(payload) ? payload[0] || null : payload, error: null };
    }

    return { data: payload, error: null };
  },

  async insert(table: string, value: Record<string, any>, single = false) {
    const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        ...authHeaders(true),
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
    const params = filters.map((f) => buildFilter(f.key, 'eq', f.value)).join('&');

    const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${params}`, {
      method: 'PATCH',
      headers: authHeaders(true),
      body: JSON.stringify(value),
    });

    if (response.status === 204) return { error: null };

    const payload = await response.json();
    return response.ok ? { error: null } : { error: payload };
  },

  async upsert(table: string, value: Record<string, any>, onConflict: string) {
    const response = await fetch(`${supabaseUrl}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
      method: 'POST',
      headers: {
        ...authHeaders(true),
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(value),
    });

    if (response.status === 204) return { error: null };

    const payload = await response.json();
    return response.ok ? { error: null } : { error: payload };
  },
};
