const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// 读取前端构建产物
const distPath = path.join(__dirname, 'packages', 'web', 'dist');

// 检查 dist 目录是否存在
if (!fs.existsSync(distPath)) {
  console.error('Error: dist directory not found at', distPath);
  process.exit(1);
}

// 静态文件服务
app.use(express.static(distPath));

// 路由处理 - SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Mobile pages server running on port ${PORT}`);
  console.log(`Access: http://localhost:${PORT}/scan`);
  console.log(`Access: http://localhost:${PORT}/mobile-visits`);
});
