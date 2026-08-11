"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../common/prisma"));
const response_1 = require("../../common/response");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// ===== 公开页面查看（无需认证，必须在authMiddleware之前）=====
router.get('/pages/:slug/public', async (req, res) => {
    try {
        const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
        const page = await prisma_1.default.page.findFirst({
            where: { slug, status: 'published' },
            include: { site: { select: { name: true, seoTitle: true, seoDesc: true } } },
        });
        if (!page)
            return (0, response_1.notFound)(res, '页面不存在');
        (0, response_1.success)(res, page);
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 所有其他 CMS 路由需要认证
router.use(auth_1.authMiddleware);
// ===== 站点管理 =====
// 获取站点列表
router.get('/sites', async (req, res) => {
    try {
        const { page = '1', pageSize = '20', status, type } = req.query;
        const skip = (Number(page) - 1) * Number(pageSize);
        const where = { tenantId: req.user.tenantId };
        if (status)
            where.status = status;
        if (type)
            where.type = type;
        const [sites, total] = await Promise.all([
            prisma_1.default.site.findMany({ where, skip, take: Number(pageSize), orderBy: { updatedAt: 'desc' } }),
            prisma_1.default.site.count({ where }),
        ]);
        (0, response_1.successWithPagination)(res, sites, { page: Number(page), pageSize: Number(pageSize), total });
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 创建站点
router.post('/sites', async (req, res) => {
    try {
        const { name, type, domain, seoTitle, seoDesc, seoKeywords, config } = req.body;
        const site = await prisma_1.default.site.create({
            data: { tenantId: req.user.tenantId, name, type, domain, seoTitle, seoDesc, seoKeywords, config },
        });
        (0, response_1.success)(res, site, '站点创建成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 获取站点详情
router.get('/sites/:id', async (req, res) => {
    try {
        const site = await prisma_1.default.site.findFirst({
            where: { id: req.params.id, tenantId: req.user.tenantId },
            include: { pages: true, forms: true },
        });
        if (!site)
            return (0, response_1.notFound)(res, '站点不存在');
        (0, response_1.success)(res, site);
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 更新站点
router.put('/sites/:id', async (req, res) => {
    try {
        const { name, domain, seoTitle, seoDesc, seoKeywords, config, status } = req.body;
        const site = await prisma_1.default.site.update({
            where: { id: req.params.id },
            data: { name, domain, seoTitle, seoDesc, seoKeywords, config, status, publishedAt: status === 'published' ? new Date() : undefined },
        });
        (0, response_1.success)(res, site, '站点更新成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 删除站点
router.delete('/sites/:id', async (req, res) => {
    try {
        await prisma_1.default.site.delete({ where: { id: req.params.id } });
        (0, response_1.success)(res, null, '站点删除成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 页面管理（独立页面，不依赖站点） =====
// 获取所有页面列表（独立，不按站点过滤）
router.get('/pages', async (req, res) => {
    try {
        const pages = await prisma_1.default.page.findMany({
            where: { tenantId: req.user.tenantId },
            orderBy: { updatedAt: 'desc' },
        });
        (0, response_1.success)(res, pages);
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 获取站点下的页面列表（兼容旧接口）
router.get('/sites/:siteId/pages', async (req, res) => {
    try {
        const pages = await prisma_1.default.page.findMany({
            where: { siteId: req.params.siteId },
            orderBy: { updatedAt: 'desc' },
        });
        (0, response_1.success)(res, pages);
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 创建页面（独立，siteId 可选）
router.post('/pages', async (req, res) => {
    try {
        const { title, slug, content, seoTitle, seoDesc, seoKeywords, siteId } = req.body;
        const page = await prisma_1.default.page.create({
            data: {
                tenantId: req.user.tenantId,
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
        (0, response_1.success)(res, page, '页面创建成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 创建页面（兼容旧接口 /sites/:siteId/pages）
router.post('/sites/:siteId/pages', async (req, res) => {
    try {
        const siteId = Array.isArray(req.params.siteId) ? req.params.siteId[0] : req.params.siteId;
        const { title, slug, content, seoTitle, seoDesc, seoKeywords } = req.body;
        const page = await prisma_1.default.page.create({
            data: {
                tenantId: req.user.tenantId,
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
        (0, response_1.success)(res, page, '页面创建成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 更新页面
router.put('/pages/:id', async (req, res) => {
    try {
        const { title, slug, content, seoTitle, seoDesc, seoKeywords, status } = req.body;
        const page = await prisma_1.default.page.update({
            where: { id: req.params.id },
            data: { title, slug, content, seoTitle, seoDesc, seoKeywords, status, version: { increment: 1 }, publishedAt: status === 'published' ? new Date() : undefined },
        });
        (0, response_1.success)(res, page, '页面更新成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 删除页面
router.delete('/pages/:id', async (req, res) => {
    try {
        await prisma_1.default.page.delete({ where: { id: req.params.id } });
        (0, response_1.success)(res, null, '页面删除成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 为页面生成推广链接（创建 TrackingLink）
router.post('/pages/:id/generate-link', async (req, res) => {
    try {
        const pageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const page = await prisma_1.default.page.findUnique({ where: { id: pageId }, include: { site: true } });
        if (!page)
            return (0, response_1.notFound)(res, '页面不存在');
        const shortCode = Math.random().toString(36).substring(2, 10);
        const baseUrl = process.env.BASE_URL || req.protocol + '://' + req.get('host');
        const targetUrl = `${baseUrl}/p/${page.slug}`;
        const link = await prisma_1.default.trackingLink.create({
            data: {
                shortCode,
                targetUrl,
                utmSource: req.body.utmSource || 'page-builder',
                utmMedium: req.body.utmMedium || 'promotion',
                utmCampaign: req.body.utmCampaign || page.title,
            },
        });
        const shortUrl = `${baseUrl}/t/${shortCode}`;
        (0, response_1.success)(res, { id: link.id, shortCode, shortUrl, targetUrl, clickCount: 0 }, '推广链接生成成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 页面 SEO 分析
router.get('/pages/:id/seo-analysis', async (req, res) => {
    try {
        const pageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const page = await prisma_1.default.page.findFirst({
            where: { id: pageId, tenantId: req.user.tenantId },
            include: { site: true },
        });
        if (!page)
            return (0, response_1.notFound)(res, '页面不存在');
        const checks = [];
        let score = 100;
        const addCheck = (category, passed, issue, fix, impact, currentValue) => {
            const displayFix = passed && currentValue ? `当前值: ${currentValue}` : fix;
            checks.push({ category, passed, issue, fix: displayFix, impact });
            if (!passed)
                score -= impact === 'high' ? 20 : impact === 'medium' ? 10 : 5;
        };
        // 基础 SEO 检查
        addCheck('基础', !!page.seoTitle, '缺少 SEO 标题', '为页面设置 SEO 标题（30-60字符）', 'high', page.seoTitle || undefined);
        addCheck('基础', !!page.seoDesc, '缺少 SEO 描述', '为页面设置 SEO 描述（120-160字符）', 'high', page.seoDesc || undefined);
        addCheck('基础', !!page.seoKeywords, '缺少关键词', '设置 3-5 个核心关键词', 'medium', page.seoKeywords || undefined);
        addCheck('基础', page.status === 'published', '页面未发布', '将页面设置为发布状态', 'high');
        // 长度检查
        if (page.seoTitle) {
            addCheck('优化', page.seoTitle.length <= 60, `SEO 标题过长（${page.seoTitle.length}字符）`, '缩短至 60 字符以内', 'medium', page.seoTitle);
            addCheck('优化', page.seoTitle.length >= 10, 'SEO 标题过短', '标题至少 10 个字符', 'low', page.seoTitle);
        }
        if (page.seoDesc) {
            addCheck('优化', page.seoDesc.length <= 160, `SEO 描述过长（${page.seoDesc.length}字符）`, '缩短至 160 字符以内', 'medium', page.seoDesc);
            addCheck('优化', page.seoDesc.length >= 50, 'SEO 描述过短', '描述至少 50 个字符', 'low', page.seoDesc);
        }
        // 内容检查
        const contentLength = page.content ? page.content.length : 0;
        addCheck('内容', contentLength > 300, '页面内容过少', '建议页面内容不少于 300 字符', 'medium');
        score = Math.max(0, Math.min(100, score));
        (0, response_1.success)(res, {
            pageId: page.id,
            pageTitle: page.title,
            path: `/p/${page.slug}`,
            score,
            checks,
            issues: checks.filter(c => !c.passed),
            passed: checks.filter(c => c.passed),
            status: page.status,
            seoTitle: page.seoTitle,
            seoDesc: page.seoDesc,
            seoKeywords: page.seoKeywords,
        });
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 一键修复页面 SEO 问题
router.post('/pages/:id/seo-fix', async (req, res) => {
    try {
        const pageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const page = await prisma_1.default.page.findFirst({
            where: { id: pageId, tenantId: req.user.tenantId },
            include: { site: true },
        });
        if (!page)
            return (0, response_1.notFound)(res, '页面不存在');
        let fixed = 0;
        const details = [];
        const updateData = {};
        // 1. 修复 SEO 标题
        if (!page.seoTitle || page.seoTitle.length < 10) {
            const title = page.seoTitle && page.seoTitle.length >= 10 ? page.seoTitle : `${page.title} - ${page.site?.name || '页面'}`;
            updateData.seoTitle = title;
            fixed++;
            details.push('SEO标题');
        }
        // 2. 修复 SEO 描述
        if (!page.seoDesc || page.seoDesc.length < 50) {
            const desc = page.seoDesc && page.seoDesc.length >= 50 ? page.seoDesc : `${page.title}页面，了解详细信息。`;
            updateData.seoDesc = desc;
            fixed++;
            details.push('SEO描述');
        }
        // 3. 修复关键词
        if (!page.seoKeywords) {
            updateData.seoKeywords = `${page.title},${page.site?.name || '页面'},详情`;
            fixed++;
            details.push('关键词');
        }
        // 4. 发布页面
        if (page.status === 'draft') {
            updateData.status = 'published';
            updateData.publishedAt = new Date();
            fixed++;
            details.push('发布页面');
        }
        if (Object.keys(updateData).length > 0) {
            await prisma_1.default.page.update({
                where: { id: pageId },
                data: updateData,
            });
        }
        const msg = fixed > 0
            ? `已修复 ${fixed} 项：${details.join('、')}`
            : '所有可自动修复的问题已处理完毕';
        (0, response_1.success)(res, { fixed, details }, msg);
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// AI 分析页面 SEO
router.post('/pages/:id/ai-seo', async (req, res) => {
    try {
        const pageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const page = await prisma_1.default.page.findFirst({
            where: { id: pageId, tenantId: req.user.tenantId },
            include: { site: true },
        });
        if (!page)
            return (0, response_1.notFound)(res, '页面不存在');
        // 模拟 AI 分析（在实际实现中这里会调用 AI API）
        const suggestion = `
## ${page.title} 页面 SEO 优化建议

### 问题诊断
- ${!page.seoTitle ? '• 缺少 SEO 标题，影响搜索引擎识别' : ''}
- ${!page.seoDesc ? '• 缺少 SEO 描述，降低点击率' : ''}
- ${page.status === 'draft' ? '• 页面未发布，无法被搜索引擎抓取' : ''}

### 优化建议
- ${page.seoTitle ? '• SEO 标题已设置，继续保持' : '• 设置吸引人的 SEO 标题，控制在 30-60 字符'}
- ${page.seoDesc ? '• SEO 描述已设置，继续保持' : '• 撰写有吸引力的 SEO 描述，突出页面价值'}
- ${page.seoKeywords ? '• 关键词已设置，继续保持' : '• 添加 3-5 个核心关键词，提升搜索匹配度'}
- ${page.status === 'published' ? '• 页面已发布，状态良好' : '• 将页面设为发布状态，使其可被访问'}

### 提升策略
- 增加页面内容丰富度，建议不少于 300 字符
- 优化页面加载速度
- 添加内部链接提高页面权重
- 定期更新内容保持活跃度
    `;
        (0, response_1.success)(res, { suggestion, score: page.seoTitle && page.seoDesc ? 75 : 45 });
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 获取页面的推广链接列表
router.get('/pages/:id/links', async (req, res) => {
    try {
        const pageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const page = await prisma_1.default.page.findUnique({ where: { id: pageId } });
        if (!page)
            return (0, response_1.notFound)(res, '页面不存在');
        const links = await prisma_1.default.trackingLink.findMany({
            where: { targetUrl: { contains: page.slug } },
            orderBy: { createdAt: 'desc' },
        });
        (0, response_1.success)(res, links);
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 表单管理 =====
// 获取表单列表
router.get('/sites/:siteId/forms', async (req, res) => {
    try {
        const forms = await prisma_1.default.form.findMany({
            where: { siteId: req.params.siteId },
            include: { _count: { select: { submissions: true } } },
            orderBy: { createdAt: 'desc' },
        });
        (0, response_1.success)(res, forms);
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 创建表单
router.post('/sites/:siteId/forms', async (req, res) => {
    try {
        const { name, description, fields, settings } = req.body;
        const form = await prisma_1.default.form.create({
            data: { siteId: req.params.siteId, name, description, fields: fields || [], settings },
        });
        (0, response_1.success)(res, form, '表单创建成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 获取表单提交
router.get('/forms/:id/submissions', async (req, res) => {
    try {
        const { page = '1', pageSize = '20' } = req.query;
        const skip = (Number(page) - 1) * Number(pageSize);
        const [submissions, total] = await Promise.all([
            prisma_1.default.formSubmission.findMany({ where: { formId: req.params.id }, skip, take: Number(pageSize), orderBy: { createdAt: 'desc' } }),
            prisma_1.default.formSubmission.count({ where: { formId: req.params.id } }),
        ]);
        (0, response_1.successWithPagination)(res, submissions, { page: Number(page), pageSize: Number(pageSize), total });
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 媒体资源 =====
router.get('/sites/:siteId/media', async (req, res) => {
    try {
        const { type } = req.query;
        const where = { siteId: req.params.siteId };
        if (type)
            where.type = type;
        const media = await prisma_1.default.mediaAsset.findMany({ where, orderBy: { createdAt: 'desc' } });
        (0, response_1.success)(res, media);
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
exports.default = router;
//# sourceMappingURL=cms.routes.js.map