type AuthListener = (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED', session: AuthSession | null) => void;

interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

interface AuthSession {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user: AuthUser;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const authStorageKey = 'iraq-compass.supabase.session';
const listeners = new Set<AuthListener>();

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

function readStoredSession(): AuthSession | null {
  const raw = localStorage.getItem(authStorageKey);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    localStorage.removeItem(authStorageKey);
    return null;
  }
}

function writeStoredSession(session: AuthSession | null) {
  if (!session) {
    localStorage.removeItem(authStorageKey);
    return;
  }

  localStorage.setItem(authStorageKey, JSON.stringify(session));
}

function emit(event: Parameters<AuthListener>[0], session: AuthSession | null) {
  listeners.forEach((listener) => listener(event, session));
}

async function fetchUser(accessToken: string): Promise<AuthUser | null> {
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) return null;
  return response.json() as Promise<AuthUser>;
}

async function consumeAuthCallbackHash(): Promise<AuthSession | null> {
  if (typeof window === 'undefined') return null;
  if (!window.location.hash.includes('access_token=')) return null;

  const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const access_token = fragment.get('access_token');

  if (!access_token) return null;

  const refresh_token = fragment.get('refresh_token') || undefined;
  const expires_in = Number(fragment.get('expires_in') || 0);
  const expires_at = expires_in > 0 ? Math.floor(Date.now() / 1000) + expires_in : undefined;
  const user = await fetchUser(access_token);

  if (!user) return null;

  const session: AuthSession = {
    access_token,
    refresh_token,
    expires_at,
    user,
  };

  const cleaned = `${window.location.origin}${window.location.pathname}${window.location.search}`;
  window.history.replaceState({}, '', cleaned);
  writeStoredSession(session);
  emit('SIGNED_IN', session);
  return session;
}

export const supabase = {
  auth: {
    async getSession() {
      const fromHash = await consumeAuthCallbackHash();
      return { data: { session: fromHash || readStoredSession() } };
    },

    async getUser() {
      const session = (await this.getSession()).data.session;
      return { data: { user: session?.user || null } };
    },

    onAuthStateChange(callback: AuthListener) {
      listeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => listeners.delete(callback),
          },
        },
      };
    },

    async signOut() {
      writeStoredSession(null);
      emit('SIGNED_OUT', null);
      return { error: null };
    },

    async signInWithOAuth({ provider, options }: { provider: 'google'; options?: { redirectTo?: string; queryParams?: Record<string, string> } }) {
      if (!supabaseUrl || !supabaseAnonKey) {
        return { error: new Error('Missing Supabase environment variables.') };
      }

      const authorizeUrl = new URL(`${supabaseUrl}/auth/v1/authorize`);
      authorizeUrl.searchParams.set('provider', provider);
      authorizeUrl.searchParams.set('apikey', supabaseAnonKey);
      if (options?.redirectTo) {
        authorizeUrl.searchParams.set('redirect_to', options.redirectTo);
      }
      Object.entries(options?.queryParams || {}).forEach(([key, value]) => authorizeUrl.searchParams.set(key, value));

      window.location.assign(authorizeUrl.toString());
      return { error: null };
    },

    async signInAnonymously({ options }: { options?: { data?: Record<string, any> } } = {}) {
      const anonymousId = crypto.randomUUID();
      const session: AuthSession = {
        access_token: `anon-${anonymousId}`,
        user: {
          id: anonymousId,
          email: 'guest@iraq-compass.local',
          user_metadata: options?.data || {},
        },
      };

      writeStoredSession(session);
      emit('SIGNED_IN', session);
      return { data: { session }, error: null };
    },

    async updateUser({ data }: { data: Record<string, any> }) {
      const current = readStoredSession();
      if (!current) {
        return { error: new Error('No active session.') };
      }

      const updated: AuthSession = {
        ...current,
        user: {
          ...current.user,
          user_metadata: {
            ...(current.user.user_metadata || {}),
            ...data,
          },
        },
      };

      writeStoredSession(updated);
      emit('USER_UPDATED', updated);
      return { data: { user: updated.user }, error: null };
    },
  },
};

const headers = {
  apikey: supabaseAnonKey || '',
  Authorization: `Bearer ${supabaseAnonKey || ''}`,
  'Content-Type': 'application/json',
};

export interface FetchOptions {
  signal?: AbortSignal;
}

export async function supabaseRest<T>(path: string, options: RequestInit & FetchOptions = {}): Promise<T> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables.');
  }

  const accessToken = (await supabase.auth.getSession()).data.session?.access_token;

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
      ...options,
      headers: {
        ...headers,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase REST request failed', {
        path,
        status: response.status,
        statusText: response.statusText,
        errorText,
      });
      throw new Error(`Supabase request failed (${response.status}). Please try again.`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  } catch (error) {
    console.error('Supabase REST request encountered a network/runtime error', { path, error });
    if (error instanceof Error) {
      throw new Error(`Unable to reach Supabase for "${path}": ${error.message}`);
    }
    throw new Error(`Unable to reach Supabase for "${path}".`);
  }
}

export function buildRealtimeSocket(): WebSocket {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables.');
  }

  const wsUrl = supabaseUrl
    .replace(/^https:\/\//, 'wss://')
    .replace(/^http:\/\//, 'ws://')
    .replace(/\/$/, '');

  return new WebSocket(`${wsUrl}/realtime/v1/websocket?apikey=${supabaseAnonKey}&vsn=1.0.0`);
}
