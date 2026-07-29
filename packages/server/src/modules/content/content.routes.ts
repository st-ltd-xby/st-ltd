import { Router, Request, Response } from 'express';
import prisma from '../../common/prisma';
import { success, successWithPagination, fail, notFound } from '../../common/response';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
router.use(authMiddleware);

// ===== 内容管理 =====

router.get('/articles', async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '20', type, status, keyword } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const where: any = { tenantId: req.user!.tenantId };
    if (type) where.type = type;
    if (status) where.status = status;
    if (keyword) where.title = { contains: String(keyword), mode: 'insensitive' };

    const [articles, total] = await Promise.all([
      prisma.article.findMany({ where, skip, take: Number(pageSize), orderBy: { createdAt: 'desc' } }),
      prisma.article.count({ where }),
    ]);

    successWithPagination(res, articles, { page: Number(page), pageSize: Number(pageSize), total });
  } catch (error: any) {
    fail(res, error.message);
  }
});

router.post('/articles', async (req: Request, res: Response) => {
  try {
    const { title, summary, content, coverImage, type, videoUrl, documentUrl, tags } = req.body;
    const article = await prisma.article.create({
      data: { tenantId: req.user!.tenantId, title, summary, content, coverImage, type, videoUrl, documentUrl, tags, authorId: req.user!.userId },
    });
    success(res, article, '内容创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

router.get('/articles/:id', async (req: Request, res: Response) => {
  try {
    const article = await prisma.article.findFirst({
      where: { id: req.params.id, tenantId: req.user!.tenantId },
      include: { distributions: true, trackingLinks: true },
    });
    if (!article) return notFound(res, '内容不存在');
    success(res, article);
  } catch (error: any) {
    fail(res, error.message);
  }
});

router.put('/articles/:id', async (req: Request, res: Response) => {
  try {
    const { title, summary, content, coverImage, type, status, tags } = req.body;
    const article = await prisma.article.update({
      where: { id: req.params.id },
      data: { title, summary, content, coverImage, type, status, tags, publishedAt: status === 'published' ? new Date() : undefined },
    });
    success(res, article, '内容更新成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

router.delete('/articles/:id', async (req: Request, res: Response) => {
  try {
    await prisma.article.delete({ where: { id: req.params.id } });
    success(res, null, '内容删除成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ===== 追踪链接 =====

router.post('/tracking-links', async (req: Request, res: Response) => {
  try {
    const { articleId, targetUrl, utmSource, utmMedium, utmCampaign } = req.body;
    const shortCode = Math.random().toString(36).substring(2, 8);
    const link = await prisma.trackingLink.create({
      data: { articleId, shortCode, targetUrl, utmSource, utmMedium, utmCampaign },
    });
    success(res, link, '追踪链接创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ===== 全员营销 - 电子名片 =====

router.get('/employee-cards', async (req: Request, res: Response) => {
  try {
    const cards = await prisma.employeeCard.findMany({
      where: { tenantId: req.user!.tenantId },
      include: { user: { select: { id: true, name: true } } },
    });
    success(res, cards);
  } catch (error: any) {
    fail(res, error.message);
  }
});

router.post('/employee-cards', async (req: Request, res: Response) => {
  try {
    const { userId, name, title, department, phone, email, avatar } = req.body;
    const card = await prisma.employeeCard.create({
      data: { tenantId: req.user!.tenantId, userId, name, title, department, phone, email, avatar },
    });
    success(res, card, '名片创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ===== 物料管理 =====

router.get('/materials', async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const where: any = { tenantId: req.user!.tenantId };
    if (type) where.type = type;
    const materials = await prisma.material.findMany({ where, orderBy: { createdAt: 'desc' } });
    success(res, materials);
  } catch (error: any) {
    fail(res, error.message);
  }
});

router.post('/materials', async (req: Request, res: Response) => {
  try {
    const { title, type, url, thumbnail, tags } = req.body;
    const material = await prisma.material.create({
      data: { tenantId: req.user!.tenantId, title, type, url, thumbnail, tags },
    });
    success(res, material, '物料上传成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ===== 分享记录 =====

router.post('/share-records', async (req: Request, res: Response) => {
  try {
    const { materialId, articleId, shareType, shareUrl } = req.body;
    const shortCode = Math.random().toString(36).substring(2, 8);
    const record = await prisma.shareRecord.create({
      data: { userId: req.user!.userId, materialId, articleId, shareType, shareUrl, shortCode },
    });
    success(res, record, '分享记录创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

router.get('/share-records/stats', async (req: Request, res: Response) => {
  try {
    const stats = await prisma.shareRecord.groupBy({
      by: ['userId'],
      where: { user: { tenantId: req.user!.tenantId } },
      _sum: { viewCount: true, leadCount: true },
      _count: true,
      orderBy: { _sum: { viewCount: 'desc' } },
    });
    success(res, stats);
  } catch (error: any) {
    fail(res, error.message);
  }
});

export default router;
