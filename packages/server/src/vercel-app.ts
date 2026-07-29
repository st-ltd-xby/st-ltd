// Vercel Serverless Entry Point
import express from 'express';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFoundHandler } from './middleware/error';
import { welcomeHtml } from './common/welcome';

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

const app: any = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { code: 429, message: '请求过于频繁，请稍后再试', data: null },
}));

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(welcomeHtml);
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/auth', adminAuthRoutes);
app.use('/api/v1/cms', cmsRoutes);
app.use('/api/v1/scrm', scrmRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/mall', mallRoutes);
app.use('/api/v1', dashboardRoutes);
app.use('/api/v1/promotion', promotionRoutes);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1', uploadRoutes);

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// 短链跳转
app.get('/t/:shortCode', async (req, res) => {
  try {
    const prisma = (await import('./common/prisma')).default;
    const link = await prisma.trackingLink.findUnique({ where: { shortCode: req.params.shortCode } });
    if (link) {
      await prisma.trackingLink.update({ where: { id: link.id }, data: { clickCount: { increment: 1 } } });
      res.redirect(link.targetUrl);
    } else {
      res.status(404).send('链接不存在');
    }
  } catch {
    res.status(500).send('服务器错误');
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

app.use(notFoundHandler);
app.use(errorHandler);

// Vercel serverless export
export default app;
