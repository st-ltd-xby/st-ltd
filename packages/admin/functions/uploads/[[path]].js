const BACKEND = 'https://st-ltd-api-production.up.railway.app';

export async function onRequest({ request }) {
  const url = new URL(request.url);
  const target = BACKEND + url.pathname + url.search;

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
    resHeaders.set('Cache-Control', 'public, max-age=31536000');
    return new Response(res.body, { status: res.status, headers: resHeaders });
  } catch {
    return new Response('Backend unavailable', { status: 503 });
  }
}
