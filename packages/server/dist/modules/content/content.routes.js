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
router.use(auth_1.authMiddleware);
// ===== 内容管理 =====
router.get('/articles', async (req, res) => {
    try {
        const { page = '1', pageSize = '20', type, status, keyword } = req.query;
        const skip = (Number(page) - 1) * Number(pageSize);
        const where = { tenantId: req.user.tenantId };
        if (type)
            where.type = type;
        if (status)
            where.status = status;
        if (keyword)
            where.title = { contains: String(keyword), mode: 'insensitive' };
        const [articles, total] = await Promise.all([
            prisma_1.default.article.findMany({ where, skip, take: Number(pageSize), orderBy: { createdAt: 'desc' } }),
            prisma_1.default.article.count({ where }),
        ]);
        (0, response_1.successWithPagination)(res, articles, { page: Number(page), pageSize: Number(pageSize), total });
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
router.post('/articles', async (req, res) => {
    try {
        const { title, summary, content, coverImage, type, videoUrl, documentUrl, tags } = req.body;
        const article = await prisma_1.default.article.create({
            data: { tenantId: req.user.tenantId, title, summary, content, coverImage, type, videoUrl, documentUrl, tags, authorId: req.user.userId },
        });
        (0, response_1.success)(res, article, '内容创建成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
router.get('/articles/:id', async (req, res) => {
    try {
        const article = await prisma_1.default.article.findFirst({
            where: { id: req.params.id, tenantId: req.user.tenantId },
            include: { distributions: true, trackingLinks: true },
        });
        if (!article)
            return (0, response_1.notFound)(res, '内容不存在');
        (0, response_1.success)(res, article);
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
router.put('/articles/:id', async (req, res) => {
    try {
        const { title, summary, content, coverImage, type, status, tags } = req.body;
        const article = await prisma_1.default.article.update({
            where: { id: req.params.id },
            data: { title, summary, content, coverImage, type, status, tags, publishedAt: status === 'published' ? new Date() : undefined },
        });
        (0, response_1.success)(res, article, '内容更新成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
router.delete('/articles/:id', async (req, res) => {
    try {
        await prisma_1.default.article.delete({ where: { id: req.params.id } });
        (0, response_1.success)(res, null, '内容删除成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 追踪链接 =====
router.post('/tracking-links', async (req, res) => {
    try {
        const { articleId, targetUrl, utmSource, utmMedium, utmCampaign } = req.body;
        const shortCode = Math.random().toString(36).substring(2, 8);
        const link = await prisma_1.default.trackingLink.create({
            data: { articleId, shortCode, targetUrl, utmSource, utmMedium, utmCampaign },
        });
        (0, response_1.success)(res, link, '追踪链接创建成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 全员营销 - 电子名片 =====
router.get('/employee-cards', async (req, res) => {
    try {
        const cards = await prisma_1.default.employeeCard.findMany({
            where: { tenantId: req.user.tenantId },
            include: { user: { select: { id: true, name: true } } },
        });
        (0, response_1.success)(res, cards);
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
router.post('/employee-cards', async (req, res) => {
    try {
        const { userId, name, title, department, phone, email, avatar } = req.body;
        const card = await prisma_1.default.employeeCard.create({
            data: { tenantId: req.user.tenantId, userId, name, title, department, phone, email, avatar },
        });
        (0, response_1.success)(res, card, '名片创建成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 物料管理 =====
router.get('/materials', async (req, res) => {
    try {
        const { type } = req.query;
        const where = { tenantId: req.user.tenantId };
        if (type)
            where.type = type;
        const materials = await prisma_1.default.material.findMany({ where, orderBy: { createdAt: 'desc' } });
        (0, response_1.success)(res, materials);
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
router.post('/materials', async (req, res) => {
    try {
        const { title, type, url, thumbnail, tags } = req.body;
        const material = await prisma_1.default.material.create({
            data: { tenantId: req.user.tenantId, title, type, url, thumbnail, tags },
        });
        (0, response_1.success)(res, material, '物料上传成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 分享记录 =====
router.post('/share-records', async (req, res) => {
    try {
        const { materialId, articleId, shareType, shareUrl } = req.body;
        const shortCode = Math.random().toString(36).substring(2, 8);
        const record = await prisma_1.default.shareRecord.create({
            data: { userId: req.user.userId, materialId, articleId, shareType, shareUrl, shortCode },
        });
        (0, response_1.success)(res, record, '分享记录创建成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
router.get('/share-records/stats', async (req, res) => {
    try {
        const stats = await prisma_1.default.shareRecord.groupBy({
            by: ['userId'],
            where: { user: { tenantId: req.user.tenantId } },
            _sum: { viewCount: true, leadCount: true },
            _count: true,
            orderBy: { _sum: { viewCount: 'desc' } },
        });
        (0, response_1.success)(res, stats);
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
exports.default = router;
//# sourceMappingURL=content.routes.js.map