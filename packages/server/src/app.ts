import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import express, { Application } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, notFoundHandler } from './middleware/error';
import swaggerDocument from './common/swagger';
import { welcomeHtml } from './common/welcome';
import { autoSeed } from './common/seed';

import authRoutes from './modules/auth/auth.routes';
import cmsRoutes from './modules/cms/cms.routes';
import scrmRoutes from './modules/scrm/scrm.routes';
import contentRoutes from './modules/content/content.routes';
import mallRoutes from './modules/mall/mall.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import promotionRoutes from './modules/promotion/promotion.routes';
import { adminRouter } from './modules/admin/admin.routes';
import adminAuthRoutes from './modules/admin/admin.auth.routes';
import uploadRoutes from './modules/upload/upload.routes';
import agentRoutes from './modules/agent/agent.routes';
import aiToolsRoutes from './modules/ai-tools/ai-tools.routes';
import visitorRoutes from './modules/visitor/visitor.routes';

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康检查（必须在最前面）
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0', aiTools: 'registered' });
});

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(welcomeHtml);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'ST-LTD',
  customCss: '.swagger-ui .topbar { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }',
}));

app.use('/api/v1/auth', authRoutes);
// 管理员认证路由（必须在dashboardRoutes之前）
app.use('/api/v1/auth', adminAuthRoutes);
app.use('/api/v1/cms', cmsRoutes);
app.use('/api/v1/scrm', scrmRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/mall', mallRoutes);
app.use('/api/v1', visitorRoutes);
app.use('/api/v1', dashboardRoutes);
app.use('/api/v1/promotion', promotionRoutes);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1', uploadRoutes);
app.use('/api/v1/agent', agentRoutes);
app.use('/api/v1/ai', aiToolsRoutes);

// 静态文件服务 - 上传目录
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// 短链跳转（公开接口）- 支持 JSON 解析和直接跳转
app.get('/t/:shortCode', async (req, res) => {
  try {
    const prisma = (await import('./common/prisma')).default;
    const link = await prisma.trackingLink.findUnique({ where: { shortCode: req.params.shortCode } });
    if (link) {
      await prisma.trackingLink.update({ where: { id: link.id }, data: { clickCount: { increment: 1 } } });
      // 在目标URL上追加 promo 追踪参数
      const separator = link.targetUrl.includes('?') ? '&' : '?';
      const redirectUrl = `${link.targetUrl}${separator}promo=${link.shortCode}`;
      if (req.headers.accept?.includes('application/json') || req.query.resolve === 'true') {
        res.json({ code: 0, data: { targetUrl: redirectUrl, shortCode: link.shortCode } });
      } else {
        res.redirect(redirectUrl);
      }
    } else {
      res.status(404).send('链接不存在');
    }
  } catch {
    res.status(500).send('服务器错误');
  }
});

// 临时调试端点 - 确认AI路由是否注册
app.get('/api/v1/ai/test', (req, res) => {
  res.json({ code: 0, message: 'AI routes are working!', timestamp: new Date().toISOString() });
});

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  // 先启动服务器，让健康检查立即可用
  app.listen(PORT, () => {
    console.log('LTD API Server started on port ' + PORT);
  });
  // 后台执行数据初始化（不阻塞启动）
  autoSeed().catch(e => console.error('autoSeed error:', e));
}

// 仅在本地开发环境自动启动（Vercel / 阿里云 FC 等 Serverless 环境不启动）
if (!process.env.VERCEL && !process.env.FC_FUNCTION_NAME) {
  start();
}

export default app;
