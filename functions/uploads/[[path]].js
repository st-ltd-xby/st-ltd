export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const backendUrl = 'https://st-ltd-api-production.up.railway.app' + url.pathname + url.search;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('origin');
  headers.delete('referer');

  try {
    const response = await fetch(backendUrl, {
      method: request.method,
      headers: headers,
      redirect: 'follow',
      cf: { cacheTtl: 86400, cacheEverything: true },
    });
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
