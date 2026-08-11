"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.welcomeHtml = void 0;
exports.welcomeHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ST-LTD 运营管理平台</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { background: white; border-radius: 16px; padding: 48px; max-width: 600px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .logo { text-align: center; margin-bottom: 32px; }
    .logo-icon { font-size: 48px; margin-bottom: 8px; }
    .logo h1 { font-size: 28px; color: #1a1a2e; margin-bottom: 8px; }
    .logo p { color: #666; font-size: 14px; }
    .status { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; margin-bottom: 24px; }
    .status-dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .status-text { color: #166534; font-size: 14px; font-weight: 500; }
    .links { display: grid; gap: 12px; margin-bottom: 32px; }
    .link-card { display: flex; align-items: center; gap: 16px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; text-decoration: none; color: inherit; transition: all 0.2s; }
    .link-card:hover { border-color: #667eea; box-shadow: 0 4px 12px rgba(102,126,234,0.15); transform: translateY(-2px); }
    .link-icon { font-size: 24px; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: #f3f4f6; border-radius: 12px; }
    .link-info h3 { font-size: 15px; color: #1a1a2e; margin-bottom: 4px; }
    .link-info p { font-size: 13px; color: #666; }
    .accounts { background: #f8fafc; border-radius: 12px; padding: 20px; }
    .accounts h3 { font-size: 14px; color: #475569; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .account-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
    .account-item:last-child { border-bottom: none; }
    .account-role { font-weight: 600; color: #1a1a2e; font-size: 14px; }
    .account-creds { font-family: 'SF Mono', Monaco, monospace; font-size: 13px; color: #667eea; background: #eef2ff; padding: 4px 8px; border-radius: 4px; }
    .footer { text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <div class="logo-icon">&#9670;</div>
      <h1>ST-LTD</h1>
      <p>世贸搜途跨境产业云平台 · Lead to Deal · 从引导到交易</p>
    </div>

    <div class="status">
      <div class="status-dot"></div>
      <span class="status-text">系统运行正常 - API 服务已就绪</span>
    </div>

    <div class="links">
      <a href="/api-docs" class="link-card">
        <div class="link-icon">&#128218;</div>
        <div class="link-info">
          <h3>API 接口文档</h3>
          <p>在线查看和测试所有 API 接口（Swagger UI）</p>
        </div>
      </a>
      <a href="/api/v1/admin" class="link-card">
        <div class="link-icon">&#128100;</div>
        <div class="link-info">
          <h3>后端管理系统</h3>
          <p>进入后端管理界面，管理用户、内容、客户等数据</p>
        </div>
      </a>
    </div>

    <div class="accounts">
      <h3>测试账号</h3>
      <div class="account-item">
        <span class="account-role">管理员</span>
        <span class="account-creds">admin@ltd.com / admin123</span>
      </div>
      <div class="account-item">
        <span class="account-role">员工</span>
        <span class="account-creds">zhangsan@ltd.com / employee123</span>
      </div>
    </div>

    <div class="footer">
      ST-LTD 运营管理平台 v1.0.0 &middot; 本地开发环境
    </div>
  </div>
</body>
</html>`;
//# sourceMappingURL=welcome.js.map