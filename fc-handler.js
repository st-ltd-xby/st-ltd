// 阿里云函数计算 FC 入口
const path = require('path');
const http = require('http');

const appPath = path.join(__dirname, 'packages', 'server', 'dist', 'app.js');

console.log('[FC] loading app from:', appPath);

let app;
try {
  app = require(appPath).default;
  console.log('[FC] Express app loaded');
} catch (e) {
  console.error('[FC] Failed to load app:', e.message);
  throw e;
}

// 启动内部 HTTP 服务器
let server = null;
let port = 0;

function startServer() {
  if (server) return Promise.resolve();
  return new Promise((resolve, reject) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      console.log('[FC] server on port', port);
      resolve();
    });
    server.on('error', reject);
  });
}

module.exports.handler = async (req, res) => {
  try {
    // 健康检查快速路径 - 不经过 Express
    const url = req.url || req.rawPath || '/';
    if (url === '/api/health' || url === '/api/health/') {
      const body = JSON.stringify({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
      res.statusCode = 200;
      if (typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'application/json');
      }
      if (typeof res.end === 'function') {
        res.end(body);
      } else if (typeof res.send === 'function') {
        res.send(body);
      }
      return;
    }

    // 其他请求：启动内部服务器并代理
    await startServer();

    const method = (req.method || req.httpMethod || 'GET').toUpperCase();
    const headers = Object.assign({}, req.headers || {});

    let body = null;
    if (req.body) {
      if (typeof req.body === 'string') body = req.body;
      else if (Buffer.isBuffer(req.body)) body = req.body;
      else { body = JSON.stringify(req.body); headers['content-type'] = 'application/json'; }
    }

    const proxyReq = http.request({
      hostname: '127.0.0.1',
      port: port,
      path: url,
      method: method,
      headers: headers,
    }, (proxyRes) => {
      res.statusCode = proxyRes.statusCode || 200;
      if (proxyRes.headers) {
        for (const [k, v] of Object.entries(proxyRes.headers)) {
          if (v !== undefined) { try { res.setHeader(k, v); } catch(e) {} }
        }
      }
      const chunks = [];
      proxyRes.on('data', (c) => chunks.push(c));
      proxyRes.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (typeof res.end === 'function') res.end(buf);
        else if (typeof res.send === 'function') res.send(buf);
      });
    });

    proxyReq.on('error', (e) => {
      console.error('[FC] proxy error:', e.message);
      res.statusCode = 502;
      if (typeof res.end === 'function') res.end(JSON.stringify({ error: 'proxy error' }));
    });

    if (body) proxyReq.write(body);
    proxyReq.end();

  } catch (e) {
    console.error('[FC] handler error:', e.message);
    res.statusCode = 500;
    if (typeof res.end === 'function') res.end(JSON.stringify({ error: e.message }));
  }
};
