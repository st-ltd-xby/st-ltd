export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // Debug: 返回请求信息确认函数被触发
  if (url.pathname.includes('/debug-test')) {
    return new Response(JSON.stringify({
      triggered: true,
      pathname: url.pathname,
      backend: 'https://st-ltd-api-production.up.railway.app' + url.pathname + url.search,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const backendUrl = 'https://st-ltd-api-production.up.railway.app' + url.pathname + url.search;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

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
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      redirect: 'follow',
      cf: { cacheTtl: 0, cacheEverything: false },
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('X-Proxy', 'cf-pages-function');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Proxy error: ' + err.message, url: backendUrl }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'X-Proxy': 'cf-pages-function' },
    });
  }
}
