interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  ALLOWED_ORIGINS?: string;
  CACHE_TTL_SECONDS?: string;
  BUSINESSES_TABLE?: string;
}

const DEFAULT_TABLE = 'businesses';
const DEFAULT_CACHE_TTL_SECONDS = 60;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function normalizePath(pathname: string): string {
  if (pathname.length > 1) {
    return pathname.replace(/\/+$/, '');
  }
  return pathname;
}

function getAllowedOrigins(env: Env): string[] {
  return (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function getCorsHeaders(request: Request, env: Env): Headers {
  const origin = request.headers.get('Origin');
  const allowlist = getAllowedOrigins(env);

  const allowOrigin =
    allowlist.length === 0
      ? '*'
      : origin && allowlist.includes(origin)
        ? origin
        : allowlist[0];

  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', allowOrigin);
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');
  headers.set('Vary', 'Origin');

  return headers;
}

function jsonResponse(request: Request, env: Env, body: unknown, init: ResponseInit = {}): Response {
  const response = new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(init.headers || {}),
    },
  });

  const corsHeaders = getCorsHeaders(request, env);
  corsHeaders.forEach((value, key) => response.headers.set(key, value));

  return response;
}

function parsePositiveInt(value: string | null, fallback: number, max = Number.MAX_SAFE_INTEGER): number {
  const parsed = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, max);
}

function parseTotalFromContentRange(header: string | null): number | undefined {
  if (!header) {
    return undefined;
  }

  const slashIndex = header.lastIndexOf('/');
  if (slashIndex === -1) {
    return undefined;
  }

  const totalRaw = header.slice(slashIndex + 1);
  if (totalRaw === '*') {
    return undefined;
  }

  const total = Number.parseInt(totalRaw, 10);
  return Number.isFinite(total) ? total : undefined;
}

function getCacheTtl(env: Env): number {
  const ttl = parsePositiveInt(env.CACHE_TTL_SECONDS || null, DEFAULT_CACHE_TTL_SECONDS);
  return ttl > 0 ? ttl : DEFAULT_CACHE_TTL_SECONDS;
}

function buildSupabaseHeaders(env: Env): Headers {
  return new Headers({
    apikey: env.SUPABASE_ANON_KEY,
    Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
    Accept: 'application/json',
  });
}

function withCors(request: Request, env: Env, response: Response): Response {
  const mutable = new Response(response.body, response);
  const corsHeaders = getCorsHeaders(request, env);
  corsHeaders.forEach((value, key) => mutable.headers.set(key, value));
  return mutable;
}

async function proxyBusinessesList(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const table = env.BUSINESSES_TABLE || DEFAULT_TABLE;
  const page = parsePositiveInt(url.searchParams.get('page'), 1);
  const limit = parsePositiveInt(url.searchParams.get('limit'), DEFAULT_LIMIT, MAX_LIMIT);
  const from = (page - 1) * limit;

  const supabaseUrl = new URL(`${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}`);
  supabaseUrl.searchParams.set('select', '*');
  supabaseUrl.searchParams.set('order', 'name.asc');
  supabaseUrl.searchParams.set('offset', String(from));
  supabaseUrl.searchParams.set('limit', String(limit));

  const q = url.searchParams.get('q')?.trim();
  const governorate = url.searchParams.get('governorate')?.trim();
  const category = url.searchParams.get('category')?.trim();

  if (q) {
    supabaseUrl.searchParams.set('or', `name.ilike.*${q}*,city.ilike.*${q}*,description.ilike.*${q}*`);
  }

  if (governorate && governorate !== 'all') {
    supabaseUrl.searchParams.set('governorate', `eq.${governorate}`);
  }

  if (category && category !== 'all') {
    supabaseUrl.searchParams.set('category', `eq.${category}`);
  }

  const upstream = await fetch(supabaseUrl.toString(), {
    method: 'GET',
    headers: {
      ...Object.fromEntries(buildSupabaseHeaders(env).entries()),
      Prefer: 'count=exact',
    },
  });

  if (!upstream.ok) {
    return jsonResponse(request, env, { error: 'Upstream database request failed' }, { status: 502 });
  }

  const rows = (await upstream.json()) as unknown[];
  const total = parseTotalFromContentRange(upstream.headers.get('Content-Range'));
  const payload: { data: unknown[]; meta: { page: number; limit: number; total?: number } } = {
    data: rows,
    meta: { page, limit },
  };

  if (typeof total === 'number') {
    payload.meta.total = total;
  }

  return jsonResponse(request, env, payload, { status: 200 });
}

async function proxyBusinessDetail(request: Request, env: Env, id: string): Promise<Response> {
  const table = env.BUSINESSES_TABLE || DEFAULT_TABLE;
  const supabaseUrl = new URL(`${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}`);
  supabaseUrl.searchParams.set('id', `eq.${id}`);
  supabaseUrl.searchParams.set('select', '*');
  supabaseUrl.searchParams.set('limit', '1');

  const upstream = await fetch(supabaseUrl.toString(), {
    method: 'GET',
    headers: buildSupabaseHeaders(env),
  });

  if (!upstream.ok) {
    return jsonResponse(request, env, { error: 'Upstream database request failed' }, { status: 502 });
  }

  const rows = (await upstream.json()) as unknown[];
  if (!Array.isArray(rows) || rows.length === 0) {
    return jsonResponse(request, env, { error: 'Business not found' }, { status: 404 });
  }

  return jsonResponse(request, env, { data: rows[0] }, { status: 200 });
}

async function handleGet(request: Request, env: Env): Promise<Response> {
  const normalizedPath = normalizePath(new URL(request.url).pathname);

  if (normalizedPath === '/api/businesses') {
    return proxyBusinessesList(request, env);
  }

  if (normalizedPath.startsWith('/api/businesses/')) {
    const id = normalizedPath.slice('/api/businesses/'.length).trim();
    if (!id || id.includes('/')) {
      return jsonResponse(request, env, { error: 'Not found' }, { status: 404 });
    }
    return proxyBusinessDetail(request, env, id);
  }

  return jsonResponse(request, env, { error: 'Not found' }, { status: 404 });
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return jsonResponse(request, env, { error: 'Missing required server configuration' }, { status: 500 });
  }

  if (request.method === 'OPTIONS') {
    return jsonResponse(request, env, null, { status: 204 });
  }

  if (request.method !== 'GET') {
    return jsonResponse(request, env, { error: 'Method not allowed' }, { status: 405 });
  }

  const cache = caches.default;
  const cacheKey = new Request(request.url, request);

  const cached = await cache.match(cacheKey);
  if (cached) {
    const cachedWithCors = withCors(request, env, cached);
    cachedWithCors.headers.set('X-Cache', 'HIT');
    return cachedWithCors;
  }

  const response = await handleGet(request, env);
  response.headers.set('X-Cache', 'MISS');

  if (response.status === 200) {
    const ttl = getCacheTtl(env);
    const cachable = new Response(response.body, response);
    cachable.headers.set('Cache-Control', `public, max-age=${ttl}`);
    await cache.put(cacheKey, cachable.clone());
    return withCors(request, env, cachable);
  }

  return withCors(request, env, response);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await handleRequest(request, env);
    } catch {
      return jsonResponse(request, env, { error: 'Internal server error' }, { status: 500 });
    }
  },
};
