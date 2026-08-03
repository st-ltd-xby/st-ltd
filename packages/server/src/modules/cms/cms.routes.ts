import { Router, Request, Response } from 'express';
import prisma from '../../common/prisma';
import { success, successWithPagination, fail, notFound } from '../../common/response';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

// ===== 公开页面查看（无需认证，必须在authMiddleware之前）=====
router.get('/pages/:slug/public', async (req: Request, res: Response) => {
  try {
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const page = await prisma.page.findFirst({
      where: { slug, status: 'published' },
      include: { site: { select: { name: true, seoTitle: true, seoDesc: true } } },
    });
    if (!page) return notFound(res, '页面不存在');
    success(res, page);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 所有其他 CMS 路由需要认证
router.use(authMiddleware);

// ===== 站点管理 =====

// 获取站点列表
router.get('/sites', async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '20', status, type } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const where: any = { tenantId: req.user!.tenantId };
    if (status) where.status = status;
    if (type) where.type = type;

    const [sites, total] = await Promise.all([
      prisma.site.findMany({ where, skip, take: Number(pageSize), orderBy: { updatedAt: 'desc' } }),
      prisma.site.count({ where }),
    ]);

    successWithPagination(res, sites, { page: Number(page), pageSize: Number(pageSize), total });
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 创建站点
router.post('/sites', async (req: Request, res: Response) => {
  try {
    const { name, type, domain, seoTitle, seoDesc, seoKeywords, config } = req.body;
    const site = await prisma.site.create({
      data: { tenantId: req.user!.tenantId, name, type, domain, seoTitle, seoDesc, seoKeywords, config },
    });
    success(res, site, '站点创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 获取站点详情
router.get('/sites/:id', async (req: Request, res: Response) => {
  try {
    const site = await prisma.site.findFirst({
      where: { id: req.params.id, tenantId: req.user!.tenantId },
      include: { pages: true, forms: true },
    });
    if (!site) return notFound(res, '站点不存在');
    success(res, site);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 更新站点
router.put('/sites/:id', async (req: Request, res: Response) => {
  try {
    const { name, domain, seoTitle, seoDesc, seoKeywords, config, status } = req.body;
    const site = await prisma.site.update({
      where: { id: req.params.id },
      data: { name, domain, seoTitle, seoDesc, seoKeywords, config, status, publishedAt: status === 'published' ? new Date() : undefined },
    });
    success(res, site, '站点更新成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 删除站点
router.delete('/sites/:id', async (req: Request, res: Response) => {
  try {
    await prisma.site.delete({ where: { id: req.params.id } });
    success(res, null, '站点删除成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ===== 页面管理（独立页面，不依赖站点） =====

// 获取所有页面列表（独立，不按站点过滤）
router.get('/pages', async (req: Request, res: Response) => {
  try {
    const pages = await prisma.page.findMany({
      where: { tenantId: req.user!.tenantId },
      orderBy: { updatedAt: 'desc' },
    });
    success(res, pages);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 获取站点下的页面列表（兼容旧接口）
router.get('/sites/:siteId/pages', async (req: Request, res: Response) => {
  try {
    const pages = await prisma.page.findMany({
      where: { siteId: req.params.siteId },
      orderBy: { updatedAt: 'desc' },
    });
    success(res, pages);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 创建页面（独立，siteId 可选）
router.post('/pages', async (req: Request, res: Response) => {
  try {
    const { title, slug, content, seoTitle, seoDesc, seoKeywords, siteId } = req.body;
    const page = await prisma.page.create({
      data: {
        tenantId: req.user!.tenantId,
        siteId: siteId || null,
        title,
        slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
        content: content || '{}',
        seoTitle,
        seoDesc,
        seoKeywords,
        status: 'published',
        publishedAt: new Date(),
      },
    });
    success(res, page, '页面创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 创建页面（兼容旧接口 /sites/:siteId/pages）
router.post('/sites/:siteId/pages', async (req: Request, res: Response) => {
  try {
    const siteId = Array.isArray(req.params.siteId) ? req.params.siteId[0] : req.params.siteId;
    const { title, slug, content, seoTitle, seoDesc, seoKeywords } = req.body;
    const page = await prisma.page.create({
      data: {
        tenantId: req.user!.tenantId,
        siteId,
        title,
        slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
        content: content || '{}',
        seoTitle,
        seoDesc,
        seoKeywords,
        status: 'published',
        publishedAt: new Date(),
      },
    });
    success(res, page, '页面创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 更新页面
router.put('/pages/:id', async (req: Request, res: Response) => {
  try {
    const { title, slug, content, seoTitle, seoDesc, seoKeywords, status } = req.body;
    const page = await prisma.page.update({
      where: { id: req.params.id },
      data: { title, slug, content, seoTitle, seoDesc, seoKeywords, status, version: { increment: 1 }, publishedAt: status === 'published' ? new Date() : undefined },
    });
    success(res, page, '页面更新成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 删除页面
router.delete('/pages/:id', async (req: Request, res: Response) => {
  try {
    await prisma.page.delete({ where: { id: req.params.id } });
    success(res, null, '页面删除成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 为页面生成推广链接（创建 TrackingLink）
router.post('/pages/:id/generate-link', async (req: Request, res: Response) => {
  try {
    const pageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const page = await prisma.page.findUnique({ where: { id: pageId }, include: { site: true } });
    if (!page) return notFound(res, '页面不存在');

    const shortCode = Math.random().toString(36).substring(2, 10);
    const baseUrl = process.env.BASE_URL || req.protocol + '://' + req.get('host');
    const targetUrl = `${baseUrl}/p/${page.slug}`;

    const link = await prisma.trackingLink.create({
      data: {
        shortCode,
        targetUrl,
        utmSource: req.body.utmSource || 'page-builder',
        utmMedium: req.body.utmMedium || 'promotion',
        utmCampaign: req.body.utmCampaign || page.title,
      },
    });

    const shortUrl = `${baseUrl}/t/${shortCode}`;
    success(res, { id: link.id, shortCode, shortUrl, targetUrl, clickCount: 0 }, '推广链接生成成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 获取页面的推广链接列表
router.get('/pages/:id/links', async (req: Request, res: Response) => {
  try {
    const pageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const page = await prisma.page.findUnique({ where: { id: pageId } });
    if (!page) return notFound(res, '页面不存在');

    const links = await prisma.trackingLink.findMany({
      where: { targetUrl: { contains: page.slug } },
      orderBy: { createdAt: 'desc' },
    });
    success(res, links);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ===== 表单管理 =====

// 获取表单列表
router.get('/sites/:siteId/forms', async (req: Request, res: Response) => {
  try {
    const forms = await prisma.form.findMany({
      where: { siteId: req.params.siteId },
      include: { _count: { select: { submissions: true } } },
      orderBy: { createdAt: 'desc' },
    });
    success(res, forms);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 创建表单
router.post('/sites/:siteId/forms', async (req: Request, res: Response) => {
  try {
    const { name, description, fields, settings } = req.body;
    const form = await prisma.form.create({
      data: { siteId: req.params.siteId, name, description, fields: fields || [], settings },
    });
    success(res, form, '表单创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 获取表单提交
router.get('/forms/:id/submissions', async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const [submissions, total] = await Promise.all([
      prisma.formSubmission.findMany({ where: { formId: req.params.id }, skip, take: Number(pageSize), orderBy: { createdAt: 'desc' } }),
      prisma.formSubmission.count({ where: { formId: req.params.id } }),
    ]);
    successWithPagination(res, submissions, { page: Number(page), pageSize: Number(pageSize), total });
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ===== 媒体资源 =====

router.get('/sites/:siteId/media', async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const where: any = { siteId: req.params.siteId };
    if (type) where.type = type;
    const media = await prisma.mediaAsset.findMany({ where, orderBy: { createdAt: 'desc' } });
    success(res, media);
  } catch (error: any) {
    fail(res, error.message);
  }
});

export default router;
