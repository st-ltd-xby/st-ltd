export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 只处理 /api/* 请求
    if (!url.pathname.startsWith('/api/')) {
      return new Response('Not Found', { status: 404 });
    }

    const backendUrl = 'https://st-ltd-api-production.up.railway.app' + url.pathname + url.search;

    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('origin');
    headers.delete('referer');

    const backendRequest = new Request(backendUrl, {
      method: request.method,
      headers: headers,
      body: request.body,
      redirect: 'follow',
    });

    try {
      const response = await fetch(backendRequest, { cf: { cacheTtl: 0, cacheEverything: false } });
      const responseHeaders = new Headers(response.headers);
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders,
      });
    } catch (error) {
      return new Response(JSON.stringify({ code: -1, message: 'Backend unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  },
};
