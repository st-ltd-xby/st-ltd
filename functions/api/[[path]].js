export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const apiPath = url.pathname.replace('/api', '');
  const backendUrl = `${env.VITE_API_URL || 'https://st-ltd-api-production.up.railway.app'}${apiPath}${url.search}`;
  const backendRequest = new Request(backendUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  try {
    return await fetch(backendRequest);
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Backend unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
