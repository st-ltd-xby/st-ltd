const fs = require('fs');
const path = require('path');

// 读取前端构建产物
const distPath = path.join(__dirname, 'packages', 'web', 'dist');
const indexHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');

module.exports.handler = async (req, res, context) => {
  const url = req.url;
  
  // 处理 /scan 和 /mobile-visits 路由
  if (url === '/scan' || url === '/mobile-visits') {
    res.setStatusCode(200);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(indexHtml);
    return;
  }
  
  // 处理静态资源（JS/CSS等）
  const assetPath = path.join(distPath, url.substring(1));
  if (fs.existsSync(assetPath)) {
    const ext = path.extname(assetPath);
    let contentType = 'application/octet-stream';
    
    if (ext === '.js') contentType = 'application/javascript';
    else if (ext === '.css') contentType = 'text/css';
    else if (ext === '.svg') contentType = 'image/svg+xml';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    
    res.setStatusCode(200);
    res.setHeader('Content-Type', contentType);
    res.send(fs.readFileSync(assetPath));
    return;
  }
  
  // 默认返回 index.html（SPA fallback）
  res.setStatusCode(200);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(indexHtml);
};
