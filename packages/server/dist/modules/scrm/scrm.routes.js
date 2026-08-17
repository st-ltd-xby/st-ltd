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
// ===== 拜访记录（公开路由，移动端无需登录）=====
router.post('/visits', async (req, res) => {
    try {
        const { customerId, customerName, location, address, latitude, longitude, photos, content } = req.body;
        console.log('📸 收到拜访记录:', {
            customerId,
            customerName,
            photoCount: photos?.length || 0,
            totalSize: `${(JSON.stringify(photos).length / 1024 / 1024).toFixed(2)}MB`,
        });
        const visit = await prisma_1.default.visitRecord.create({
            data: {
                customerId,
                customerName,
                location,
                address,
                latitude: latitude ? Number(latitude) : undefined,
                longitude: longitude ? Number(longitude) : undefined,
                photos: JSON.stringify(photos || []),
                content,
            },
        });
        console.log('✅ 拜访记录保存成功:', visit.id);
        (0, response_1.success)(res, visit, '拜访记录保存成功');
    }
    catch (error) {
        console.error('❌ 保存拜访记录失败:', error.message);
        (0, response_1.fail)(res, error.message);
    }
});
router.get('/visits', async (req, res) => {
    try {
        const { customerId } = req.query;
        const where = {};
        if (customerId)
            where.customerId = customerId;
        const visits = await prisma_1.default.visitRecord.findMany({
            where,
            orderBy: { visitTime: 'desc' },
        });
        (0, response_1.success)(res, visits);
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 公开客户列表（移动端拜访选择客户用）
router.get('/customers/public', async (req, res) => {
    try {
        const customers = await prisma_1.default.customer.findMany({
            select: { id: true, name: true, contactName: true, contactPhone: true, level: true },
            orderBy: { updatedAt: 'desc' },
        });
        (0, response_1.success)(res, customers);
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 以下路由需要认证 =====
router.use(auth_1.authMiddleware);
// ===== 线索管理 =====
router.get('/leads', async (req, res) => {
    try {
        const { page = '1', pageSize = '20', status, source, keyword } = req.query;
        const skip = (Number(page) - 1) * Number(pageSize);
        const where = { tenantId: req.user.tenantId };
        if (status)
            where.status = status;
        if (source)
            where.source = source;
        if (keyword) {
            where.OR = [
                { name: { contains: String(keyword), mode: 'insensitive' } },
                { company: { contains: String(keyword), mode: 'insensitive' } },
            ];
        }
        const [leads, total] = await Promise.all([
            prisma_1.default.lead.findMany({
                where, skip, take: Number(pageSize),
                include: { assignee: { select: { id: true, name: true } } },
                orderBy: { createdAt: 'desc' },
            }),
            prisma_1.default.lead.count({ where }),
        ]);
        (0, response_1.successWithPagination)(res, leads, { page: Number(page), pageSize: Number(pageSize), total });
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
router.post('/leads', async (req, res) => {
    try {
        const { name, phone, email, company, position, source, priority, tags, note } = req.body;
        const lead = await prisma_1.default.lead.create({
            data: { tenantId: req.user.tenantId, name, phone, email, company, position, source: source || 'manual', priority, tags: tags || '', note },
        });
        (0, response_1.success)(res, lead, '线索创建成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
router.get('/leads/:id', async (req, res) => {
    try {
        const lead = await prisma_1.default.lead.findFirst({
            where: { id: req.params.id, tenantId: req.user.tenantId },
            include: { assignee: { select: { id: true, name: true } }, followUps: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } } },
        });
        if (!lead)
            return (0, response_1.notFound)(res, '线索不存在');
        (0, response_1.success)(res, lead);
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
router.put('/leads/:id', async (req, res) => {
    try {
        const { name, phone, email, company, position, status, priority, tags, note, assigneeId } = req.body;
        const lead = await prisma_1.default.lead.update({
            where: { id: req.params.id },
            data: { name, phone, email, company, position, status, priority, tags, note, assigneeId, convertedAt: status === 'won' ? new Date() : undefined },
        });
        (0, response_1.success)(res, lead, '线索更新成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
router.delete('/leads/:id', async (req, res) => {
    try {
        await prisma_1.default.lead.delete({ where: { id: req.params.id } });
        (0, response_1.success)(res, null, '线索删除成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 分配线索
router.post('/leads/:id/assign', async (req, res) => {
    try {
        const { assigneeId } = req.body;
        const lead = await prisma_1.default.lead.update({
            where: { id: req.params.id },
            data: { assigneeId, status: 'following' },
        });
        (0, response_1.success)(res, lead, '线索分配成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 客户管理 =====
router.get('/customers', async (req, res) => {
    try {
        const { page = '1', pageSize = '20', level, stage, keyword } = req.query;
        const skip = (Number(page) - 1) * Number(pageSize);
        const where = { tenantId: req.user.tenantId };
        if (level)
            where.level = level;
        if (stage)
            where.stage = stage;
        if (keyword) {
            where.OR = [
                { name: { contains: String(keyword), mode: 'insensitive' } },
                { contactName: { contains: String(keyword), mode: 'insensitive' } },
            ];
        }
        const [customers, total] = await Promise.all([
            prisma_1.default.customer.findMany({
                where,
                skip,
                take: Number(pageSize),
                include: {
                    _count: { select: { contacts: true, opportunities: true } },
                    assignee: { select: { id: true, name: true, email: true } },
                    visitRecords: { select: { id: true, visitTime: true, photos: true, content: true, location: true, address: true, latitude: true, longitude: true }, orderBy: { visitTime: 'desc' } }
                },
                orderBy: { updatedAt: 'desc' }
            }),
            prisma_1.default.customer.count({ where }),
        ]);
        // 映射 assignee.name 为 assigneeName
        const customersWithAssignee = customers.map((c) => ({
            ...c,
            assigneeName: c.assignee?.name || null,
        }));
        (0, response_1.successWithPagination)(res, customersWithAssignee, { page: Number(page), pageSize: Number(pageSize), total });
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
router.post('/customers', async (req, res) => {
    try {
        const { name, industry, level, contactName, contactPhone, contactEmail, address, tags, note } = req.body;
        const customer = await prisma_1.default.customer.create({
            data: { tenantId: req.user.tenantId, name, industry, level, contactName, contactPhone, contactEmail, address, tags, note },
        });
        (0, response_1.success)(res, customer, '客户创建成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
router.get('/customers/:id', async (req, res) => {
    try {
        const customer = await prisma_1.default.customer.findFirst({
            where: { id: req.params.id, tenantId: req.user.tenantId },
            include: { contacts: true, opportunities: { orderBy: { createdAt: 'desc' } }, visitRecords: { select: { id: true, visitTime: true, photos: true, content: true, location: true, address: true, latitude: true, longitude: true }, orderBy: { visitTime: 'desc' } } },
        });
        if (!customer)
            return (0, response_1.notFound)(res, '客户不存在');
        (0, response_1.success)(res, customer);
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
router.put('/customers/:id', async (req, res) => {
    try {
        const { name, industry, level, stage, contactName, contactPhone, contactEmail, address, tags, note } = req.body;
        const customer = await prisma_1.default.customer.update({
            where: { id: req.params.id },
            data: { name, industry, level, stage, contactName, contactPhone, contactEmail, address, tags, note },
        });
        (0, response_1.success)(res, customer, '客户更新成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 跟进记录 =====
router.post('/leads/:leadId/follow-ups', async (req, res) => {
    try {
        const { type, content, nextAction, nextTime } = req.body;
        const followUp = await prisma_1.default.followUp.create({
            data: { leadId: req.params.leadId, userId: req.user.userId, type, content, nextAction, nextTime },
        });
        (0, response_1.success)(res, followUp, '跟进记录创建成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 商机管理 =====
router.get('/opportunities', async (req, res) => {
    try {
        const { stage } = req.query;
        const where = { tenantId: req.user.tenantId };
        if (stage)
            where.stage = stage;
        const opportunities = await prisma_1.default.opportunity.findMany({
            where,
            include: { customer: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
        });
        (0, response_1.success)(res, opportunities);
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
router.post('/opportunities', async (req, res) => {
    try {
        const { customerId, title, amount, stage, expectedCloseDate, note } = req.body;
        const opportunity = await prisma_1.default.opportunity.create({
            data: { customerId, tenantId: req.user.tenantId, title, amount, stage, expectedCloseDate, note },
        });
        (0, response_1.success)(res, opportunity, '商机创建成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
router.put('/opportunities/:id', async (req, res) => {
    try {
        const { title, amount, stage, probability, note, lostReason, expectedCloseDate } = req.body;
        const data = { title, amount, stage, probability, note };
        if (expectedCloseDate)
            data.expectedCloseDate = new Date(expectedCloseDate);
        if (stage === 'won')
            data.wonAt = new Date();
        if (stage === 'lost') {
            data.lostAt = new Date();
            data.lostReason = lostReason;
        }
        const opportunity = await prisma_1.default.opportunity.update({ where: { id: req.params.id }, data: data });
        (0, response_1.success)(res, opportunity, '商机更新成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 标签管理 =====
router.get('/tags', async (req, res) => {
    try {
        const tags = await prisma_1.default.tag.findMany({ where: { tenantId: req.user.tenantId } });
        (0, response_1.success)(res, tags);
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
router.post('/tags', async (req, res) => {
    try {
        const { name, color, category } = req.body;
        const tag = await prisma_1.default.tag.create({
            data: { tenantId: req.user.tenantId, name, color, category },
        });
        (0, response_1.success)(res, tag, '标签创建成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
exports.default = router;
//# sourceMappingURL=scrm.routes.js.map