interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,apikey,Prefer',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      return new Response('Missing Supabase bindings in Worker environment.', { status: 500 });
    }

    const requestUrl = new URL(request.url);
    const upstreamUrl = new URL(`${env.SUPABASE_URL.replace(/\/$/, '')}${requestUrl.pathname}${requestUrl.search}`);
    const upstreamHeaders = new Headers(request.headers);
    upstreamHeaders.set('apikey', env.SUPABASE_ANON_KEY);
    upstreamHeaders.set('Authorization', `Bearer ${env.SUPABASE_ANON_KEY}`);

    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: request.method,
      headers: upstreamHeaders,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    });

    const responseHeaders = new Headers(upstreamResponse.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => responseHeaders.set(key, value));

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  },
};
