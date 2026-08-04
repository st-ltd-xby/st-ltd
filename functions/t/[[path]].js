export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const backendUrl = 'https://st-ltd-api-production.up.railway.app' + url.pathname + url.search;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('origin');
  headers.delete('referer');
  headers.delete('cf-connecting-ip');
  headers.delete('cf-ray');
  headers.delete('cf-visitor');

  try {
    const response = await fetch(backendUrl, {
      method: request.method,
      headers: headers,
      redirect: 'manual',
      cf: { cacheTtl: 0, cacheEverything: false },
    });

    // 如果后端返回 301/302/303/307/308，直接转发重定向
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      return new Response(null, {
        status: response.status,
        headers: { location: location || '' },
      });
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (err) {
    return new Response('Redirect error', { status: 502 });
  }
}
