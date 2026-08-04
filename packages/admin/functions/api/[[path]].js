const BACKEND = 'https://st-ltd-api-production.up.railway.app';

export async function onRequest({ request }) {
  const url = new URL(request.url);
  const target = BACKEND + url.pathname + url.search;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('origin');
  headers.delete('referer');

  try {
    const res = await fetch(target, {
      method: request.method,
      headers,
      body: request.body,
      redirect: 'follow',
    });
    const resHeaders = new Headers(res.headers);
    resHeaders.set('Access-Control-Allow-Origin', '*');
    resHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    resHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return new Response(res.body, { status: res.status, headers: resHeaders });
  } catch {
    return new Response(JSON.stringify({ code: -1, message: 'Backend unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
