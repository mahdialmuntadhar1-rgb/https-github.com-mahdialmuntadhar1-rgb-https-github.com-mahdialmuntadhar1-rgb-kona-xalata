const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

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

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
      ...options,
      headers: {
        ...headers,
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
