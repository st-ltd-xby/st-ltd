"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../../common/prisma"));
const response_1 = require("../../common/response");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
exports.adminRouter = router;
// 验证token中间件
router.use(auth_1.authMiddleware);
// ===== 用户管理 =====
// 获取用户列表
router.get('/users', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { page = '1', pageSize = '20', search, role } = req.query;
        const skip = (Number(page) - 1) * Number(pageSize);
        // 构建查询条件
        const whereConditions = {
            tenantId: req.user.tenantId
        };
        if (search) {
            whereConditions.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
                { phone: { contains: search } }
            ];
        }
        if (role) {
            whereConditions.role = role;
        }
        const [users, total] = await Promise.all([
            prisma_1.default.user.findMany({
                where: whereConditions,
                skip,
                take: Number(pageSize),
                orderBy: { createdAt: 'desc' }
            }),
            prisma_1.default.user.count({ where: whereConditions })
        ]);
        (0, response_1.success)(res, { list: users, total, page: Number(page), pageSize: Number(pageSize) }, '用户列表获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 获取用户详情
router.get('/users/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const user = await prisma_1.default.user.findUnique({
            where: { id }
        });
        if (!user || user.tenantId !== req.user.tenantId) {
            return (0, response_1.notFound)(res, '用户不存在或不属于当前租户');
        }
        (0, response_1.success)(res, user, '用户详情获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 创建用户
router.post('/users', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { name, email, phone, password, role, status } = req.body;
        // 检查邮箱是否已存在于当前租户
        const existingUser = await prisma_1.default.user.findFirst({
            where: {
                email,
                tenantId: req.user.tenantId
            }
        });
        if (existingUser) {
            return (0, response_1.fail)(res, '邮箱已存在');
        }
        const newUser = await prisma_1.default.user.create({
            data: {
                name,
                email,
                phone,
                password: await bcryptjs_1.default.hash(password, 10),
                role: role || 'staff',
                status: status || 'active',
                tenantId: req.user.tenantId
            }
        });
        (0, response_1.success)(res, newUser, '用户创建成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 更新用户
router.put('/users/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { name, email, phone, role, status } = req.body;
        const user = await prisma_1.default.user.findUnique({
            where: { id }
        });
        if (!user || user.tenantId !== req.user.tenantId) {
            return (0, response_1.notFound)(res, '用户不存在或不属于当前租户');
        }
        const updatedUser = await prisma_1.default.user.update({
            where: { id },
            data: {
                name,
                email,
                phone,
                role,
                status,
                updatedAt: new Date()
            }
        });
        (0, response_1.success)(res, updatedUser, '用户更新成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 删除用户
router.delete('/users/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const user = await prisma_1.default.user.findUnique({
            where: { id }
        });
        if (!user || user.tenantId !== req.user.tenantId) {
            return (0, response_1.notFound)(res, '用户不存在或不属于当前租户');
        }
        // 不能删除自己
        if (user.id === req.user.userId) {
            return (0, response_1.fail)(res, '不能删除自己的账户');
        }
        await prisma_1.default.user.delete({
            where: { id }
        });
        (0, response_1.success)(res, null, '用户删除成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 注册审核 =====
// 获取待审核注册列表（超级管理员）
router.get('/registrations', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { page = '1', pageSize = '20', status } = req.query;
        const skip = (Number(page) - 1) * Number(pageSize);
        const whereConditions = { status: status || 'pending' };
        const [users, total] = await Promise.all([
            prisma_1.default.user.findMany({
                where: whereConditions,
                skip,
                take: Number(pageSize),
                orderBy: { createdAt: 'desc' },
                include: { tenant: true }
            }),
            prisma_1.default.user.count({ where: whereConditions })
        ]);
        (0, response_1.success)(res, { list: users, total, page: Number(page), pageSize: Number(pageSize) }, '注册列表获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 审核通过
router.put('/registrations/:id/approve', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const user = await prisma_1.default.user.findUnique({ where: { id } });
        if (!user)
            return (0, response_1.notFound)(res, '用户不存在');
        await prisma_1.default.user.update({
            where: { id },
            data: { status: 'active' }
        });
        (0, response_1.success)(res, null, '审核通过，用户已激活');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 审核拒绝
router.put('/registrations/:id/reject', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { reason } = req.body;
        const user = await prisma_1.default.user.findUnique({ where: { id } });
        if (!user)
            return (0, response_1.notFound)(res, '用户不存在');
        await prisma_1.default.user.update({
            where: { id },
            data: { status: 'rejected' }
        });
        (0, response_1.success)(res, null, '已拒绝该注册申请');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 更改用户密码
router.put('/users/:id/password', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { password } = req.body;
        const user = await prisma_1.default.user.findUnique({
            where: { id }
        });
        if (!user || user.tenantId !== req.user.tenantId) {
            return (0, response_1.notFound)(res, '用户不存在或不属于当前租户');
        }
        await prisma_1.default.user.update({
            where: { id },
            data: { password: await bcryptjs_1.default.hash(password, 10) }
        });
        (0, response_1.success)(res, null, '密码更改成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 租户管理 =====
// 获取租户列表
router.get('/tenants', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { page = '1', pageSize = '20', search } = req.query;
        const skip = (Number(page) - 1) * Number(pageSize);
        // 构建查询条件
        const whereConditions = {};
        if (search) {
            whereConditions.name = { contains: search };
        }
        const [tenants, total] = await Promise.all([
            prisma_1.default.tenant.findMany({
                where: whereConditions,
                skip,
                take: Number(pageSize),
                orderBy: { createdAt: 'desc' }
            }),
            prisma_1.default.tenant.count({ where: whereConditions })
        ]);
        (0, response_1.success)(res, { list: tenants, total, page: Number(page), pageSize: Number(pageSize) }, '租户列表获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 获取租户详情
router.get('/tenants/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const tenant = await prisma_1.default.tenant.findUnique({
            where: { id }
        });
        if (!tenant) {
            return (0, response_1.notFound)(res, '租户不存在');
        }
        (0, response_1.success)(res, tenant, '租户详情获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 创建租户
router.post('/tenants', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { name, status } = req.body;
        // 检查租户名是否已存在
        const existingTenant = await prisma_1.default.tenant.findFirst({
            where: { name: { equals: name } }
        });
        if (existingTenant) {
            return (0, response_1.fail)(res, '租户名已存在');
        }
        const newTenant = await prisma_1.default.tenant.create({
            data: {
                name,
                status: status || 'active',
                config: '{}',
                plan: 'free',
                logo: '',
                phone: '',
                address: '',
                domain: ''
            }
        });
        (0, response_1.success)(res, newTenant, '租户创建成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 更新租户
router.put('/tenants/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { name, status, config, plan, logo, phone, address, domain } = req.body;
        const tenant = await prisma_1.default.tenant.findUnique({
            where: { id }
        });
        if (!tenant) {
            return (0, response_1.notFound)(res, '租户不存在');
        }
        const updatedTenant = await prisma_1.default.tenant.update({
            where: { id },
            data: {
                name,
                status,
                config: config || tenant.config,
                plan: plan || tenant.plan,
                logo: logo || tenant.logo,
                phone: phone || tenant.phone,
                address: address || tenant.address,
                domain: domain || tenant.domain,
                updatedAt: new Date()
            }
        });
        (0, response_1.success)(res, updatedTenant, '租户更新成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 删除租户
router.delete('/tenants/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const tenant = await prisma_1.default.tenant.findUnique({
            where: { id }
        });
        if (!tenant) {
            return (0, response_1.notFound)(res, '租户不存在');
        }
        // 检查是否有用户属于此租户
        const userCount = await prisma_1.default.user.count({
            where: { tenantId: id }
        });
        if (userCount > 0) {
            return (0, response_1.fail)(res, '租户下还有用户，无法删除');
        }
        await prisma_1.default.tenant.delete({
            where: { id }
        });
        (0, response_1.success)(res, null, '租户删除成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 系统配置管理 =====
// 获取API密钥管理
router.get('/api-keys', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        // 获取API密钥配置 - 使用systemConfig表存储
        const apiKeyConfigs = await prisma_1.default.systemConfig.findMany({
            where: {
                tenantId: req.user.tenantId,
                key: { startsWith: 'api_key_' }
            }
        });
        // 解析API密钥数据
        const apiKeys = apiKeyConfigs.map(config => {
            try {
                const keyData = JSON.parse(config.value);
                return {
                    id: config.key.replace('api_key_', ''),
                    name: keyData.name,
                    key: keyData.key,
                    permissions: keyData.permissions,
                    createdAt: config.createdAt,
                    updatedAt: config.updatedAt,
                    expiresAt: keyData.expiresAt
                };
            }
            catch (e) {
                return {
                    id: config.key.replace('api_key_', ''),
                    name: '解析错误',
                    key: '',
                    permissions: [],
                    createdAt: config.createdAt
                };
            }
        });
        (0, response_1.success)(res, { list: apiKeys }, 'API密钥列表获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 创建API密钥
router.post('/api-keys', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { name, permissions, expiresAt } = req.body;
        // 生成API密钥
        const apiKey = `ltd_${Date.now()}_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
        const apiKeyData = {
            name,
            key: apiKey,
            permissions: permissions || [],
            createdAt: new Date(),
            expiresAt: expiresAt || null
        };
        await prisma_1.default.systemConfig.create({
            data: {
                tenantId: req.user.tenantId,
                key: `api_key_${apiKey}`,
                value: JSON.stringify(apiKeyData)
            }
        });
        (0, response_1.success)(res, { apiKey }, 'API密钥创建成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 删除API密钥
router.delete('/api-keys/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await prisma_1.default.systemConfig.delete({
            where: {
                tenantId_key: {
                    tenantId: req.user.tenantId,
                    key: `api_key_${id}`
                }
            }
        });
        (0, response_1.success)(res, null, 'API密钥删除成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 客户CRM管理 =====
// 获取客户列表
router.get('/customers', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { page = '1', pageSize = '20', search, level, stage } = req.query;
        const skip = (Number(page) - 1) * Number(pageSize);
        const whereConditions = {
            tenantId: req.user.tenantId
        };
        if (search) {
            whereConditions.OR = [
                { name: { contains: search } },
                { contactName: { contains: search } },
                { contactEmail: { contains: search } }
            ];
        }
        if (level && level !== 'all') {
            whereConditions.level = level;
        }
        if (stage && stage !== 'all') {
            whereConditions.stage = stage;
        }
        const [customers, total] = await Promise.all([
            prisma_1.default.customer.findMany({
                where: whereConditions,
                skip,
                take: Number(pageSize),
                orderBy: { createdAt: 'desc' },
                include: {
                    contacts: true,
                    opportunities: true,
                    lead: { select: { id: true, source: true, createdAt: true } }
                }
            }),
            prisma_1.default.customer.count({ where: whereConditions })
        ]);
        (0, response_1.success)(res, { list: customers, total, page: Number(page), pageSize: Number(pageSize) }, '客户列表获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 客户统计（必须在 /customers/:id 之前）
router.get('/customers/stats', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const [total, active, prospect, churned] = await Promise.all([
            prisma_1.default.customer.count({ where: { tenantId } }),
            prisma_1.default.customer.count({ where: { tenantId, stage: 'active' } }),
            prisma_1.default.customer.count({ where: { tenantId, stage: 'prospect' } }),
            prisma_1.default.customer.count({ where: { tenantId, stage: 'churned' } })
        ]);
        (0, response_1.success)(res, { total, active, prospect, churned }, '客户统计获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 获取客户详情
router.get('/customers/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const customer = await prisma_1.default.customer.findUnique({
            where: { id, tenantId: req.user.tenantId },
            include: {
                contacts: true,
                opportunities: true,
                lead: { include: { followUps: { orderBy: { createdAt: 'desc' } } } }
            }
        });
        if (!customer) {
            return (0, response_1.notFound)(res, '客户不存在');
        }
        (0, response_1.success)(res, customer, '客户详情获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 创建客户
router.post('/customers', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { name, industry, level, stage, contactName, contactPhone, contactEmail, address, website, tags, note } = req.body;
        const customer = await prisma_1.default.customer.create({
            data: {
                name,
                industry,
                level: level || 'C',
                stage: stage || 'prospect',
                contactName,
                contactPhone,
                contactEmail,
                address,
                website,
                tags: tags || '',
                note,
                tenantId: req.user.tenantId
            }
        });
        (0, response_1.success)(res, customer, '客户创建成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 更新客户
router.put('/customers/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { name, industry, level, stage, contactName, contactPhone, contactEmail, address, website, tags, note, assigneeId } = req.body;
        const customer = await prisma_1.default.customer.update({
            where: { id, tenantId: req.user.tenantId },
            data: { name, industry, level, stage, contactName, contactPhone, contactEmail, address, website, tags, note, assigneeId: assigneeId || null }
        });
        (0, response_1.success)(res, customer, '客户更新成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 删除客户
router.delete('/customers/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await prisma_1.default.customer.delete({
            where: { id, tenantId: req.user.tenantId }
        });
        (0, response_1.success)(res, null, '客户删除成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 线索管理 =====
// 获取线索列表
router.get('/leads', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { page = '1', pageSize = '20', search, source, status, priority } = req.query;
        const skip = (Number(page) - 1) * Number(pageSize);
        const whereConditions = {
            tenantId: req.user.tenantId
        };
        if (search) {
            whereConditions.OR = [
                { name: { contains: search } },
                { company: { contains: search } },
                { phone: { contains: search } },
                { email: { contains: search } }
            ];
        }
        if (source && source !== 'all') {
            whereConditions.source = source;
        }
        if (status && status !== 'all') {
            whereConditions.status = status;
        }
        if (priority && priority !== 'all') {
            whereConditions.priority = priority;
        }
        const [leads, total] = await Promise.all([
            prisma_1.default.lead.findMany({
                where: whereConditions,
                skip,
                take: Number(pageSize),
                orderBy: { createdAt: 'desc' },
                include: {
                    assignee: true,
                    followUps: true
                }
            }),
            prisma_1.default.lead.count({ where: whereConditions })
        ]);
        (0, response_1.success)(res, { list: leads, total, page: Number(page), pageSize: Number(pageSize) }, '线索列表获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 线索统计（必须在 /leads/:id 之前，否则 stats 会被当作 :id 参数）
router.get('/leads/stats', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const [total, newLeads, following, converted] = await Promise.all([
            prisma_1.default.lead.count({ where: { tenantId } }),
            prisma_1.default.lead.count({ where: { tenantId, status: 'new' } }),
            prisma_1.default.lead.count({ where: { tenantId, status: 'following' } }),
            prisma_1.default.lead.count({ where: { tenantId, status: 'won' } })
        ]);
        (0, response_1.success)(res, { total, new: newLeads, following, converted }, '线索统计获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 获取线索详情
router.get('/leads/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const lead = await prisma_1.default.lead.findUnique({
            where: { id, tenantId: req.user.tenantId },
            include: {
                assignee: true,
                followUps: true
            }
        });
        if (!lead) {
            return (0, response_1.notFound)(res, '线索不存在');
        }
        (0, response_1.success)(res, lead, '线索详情获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 创建线索
router.post('/leads', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { name, phone, email, company, position, source, assigneeId, status, priority, tags, note } = req.body;
        const lead = await prisma_1.default.lead.create({
            data: {
                name,
                phone,
                email,
                company,
                position,
                source: source || 'form',
                assigneeId,
                status: status || 'new',
                priority: priority || 'medium',
                tags: tags || '',
                note,
                tenantId: req.user.tenantId
            }
        });
        (0, response_1.success)(res, lead, '线索创建成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 更新线索
router.put('/leads/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { name, phone, email, company, position, source, assigneeId, status, priority, tags, note } = req.body;
        const lead = await prisma_1.default.lead.update({
            where: { id, tenantId: req.user.tenantId },
            data: { name, phone, email, company, position, source, assigneeId, status, priority, tags, note }
        });
        (0, response_1.success)(res, lead, '线索更新成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 删除线索
router.delete('/leads/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await prisma_1.default.lead.delete({
            where: { id, tenantId: req.user.tenantId }
        });
        (0, response_1.success)(res, null, '线索删除成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 商机管理 =====
// 获取商机列表
router.get('/opportunities', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { page = '1', pageSize = '20', search, stage, type } = req.query;
        const skip = (Number(page) - 1) * Number(pageSize);
        const whereConditions = {
            tenantId: req.user.tenantId
        };
        if (search) {
            whereConditions.title = { contains: search };
        }
        if (stage && stage !== 'all') {
            whereConditions.stage = stage;
        }
        if (type && type !== 'all') {
            whereConditions.type = type;
        }
        const [opportunities, total] = await Promise.all([
            prisma_1.default.opportunity.findMany({
                where: whereConditions,
                skip,
                take: Number(pageSize),
                orderBy: { createdAt: 'desc' },
                include: { customer: true }
            }),
            prisma_1.default.opportunity.count({ where: whereConditions })
        ]);
        (0, response_1.success)(res, { list: opportunities, total, page: Number(page), pageSize: Number(pageSize) }, '商机列表获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 商机统计（必须在 /opportunities/:id 之前）
router.get('/opportunities/stats', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const [total, pending, following, won, totalAmountResult, wonAmountResult] = await Promise.all([
            prisma_1.default.opportunity.count({ where: { tenantId } }),
            prisma_1.default.opportunity.count({ where: { tenantId, stage: 'pending' } }),
            prisma_1.default.opportunity.count({ where: { tenantId, stage: 'following' } }),
            prisma_1.default.opportunity.count({ where: { tenantId, stage: 'won' } }),
            prisma_1.default.opportunity.aggregate({ where: { tenantId }, _sum: { amount: true } }),
            prisma_1.default.opportunity.aggregate({ where: { tenantId, stage: 'won' }, _sum: { amount: true } })
        ]);
        const totalAmount = totalAmountResult._sum.amount || 0;
        const wonAmount = wonAmountResult._sum.amount || 0;
        const conversionRate = total > 0 ? (won / total) * 100 : 0;
        (0, response_1.success)(res, { total, pending, following, won, totalAmount, wonAmount, conversionRate }, '商机统计获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 商机看板数据（必须在 /opportunities/:id 之前）
router.get('/opportunities/board', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const [total, totalAmountResult, wonAmountResult, allOpps] = await Promise.all([
            prisma_1.default.opportunity.count({ where: { tenantId } }),
            prisma_1.default.opportunity.aggregate({ where: { tenantId }, _sum: { amount: true } }),
            prisma_1.default.opportunity.aggregate({ where: { tenantId, stage: 'won' }, _sum: { amount: true } }),
            prisma_1.default.opportunity.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 10 })
        ]);
        const totalAmount = totalAmountResult._sum.amount || 0;
        const wonAmount = wonAmountResult._sum.amount || 0;
        const won = allOpps.filter(o => o.stage === 'won').length;
        const conversionRate = total > 0 ? (won / total) * 100 : 0;
        const byType = { supply_demand: 0, bidding: 0, trade: 0, resource: 0 };
        const byTypeAmount = { supply_demand: 0, bidding: 0, trade: 0, resource: 0 };
        const byStage = { pending: 0, following: 0, proposal: 0, negotiation: 0, won: 0, lost: 0 };
        const allOpportunities = await prisma_1.default.opportunity.findMany({ where: { tenantId } });
        allOpportunities.forEach(opp => {
            if (byType[opp.type] !== undefined)
                byType[opp.type]++;
            if (byTypeAmount[opp.type] !== undefined)
                byTypeAmount[opp.type] += opp.amount;
            if (byStage[opp.stage] !== undefined)
                byStage[opp.stage]++;
        });
        (0, response_1.success)(res, { total, totalAmount, wonAmount, conversionRate, byType, byTypeAmount, byStage, recentOpps: allOpps.slice(0, 10) }, '商机看板数据获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 获取商机详情
router.get('/opportunities/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const opportunity = await prisma_1.default.opportunity.findUnique({
            where: { id, tenantId: req.user.tenantId },
            include: {
                customer: true
            }
        });
        if (!opportunity) {
            return (0, response_1.notFound)(res, '商机不存在');
        }
        (0, response_1.success)(res, opportunity, '商机详情获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 创建商机
router.post('/opportunities', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { customerId, title, type, amount, budget, stage, probability, deadline, counterparty, cooperationMode, industry, description, expectedCloseDate, note } = req.body;
        const opportunity = await prisma_1.default.opportunity.create({
            data: {
                customerId,
                title,
                type: type || 'supply_demand',
                amount: Number(amount) || 0,
                budget: budget ? Number(budget) : undefined,
                stage: stage || 'pending',
                probability: Number(probability) || 50,
                deadline: deadline ? new Date(deadline) : undefined,
                counterparty,
                cooperationMode,
                industry,
                description,
                expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
                note,
                tenantId: req.user.tenantId
            }
        });
        (0, response_1.success)(res, opportunity, '商机创建成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 更新商机
router.put('/opportunities/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { title, type, amount, budget, stage, probability, deadline, counterparty, cooperationMode, industry, description, expectedCloseDate, note, wonAt, lostAt, lostReason } = req.body;
        const updateData = { title, type, amount: amount ? Number(amount) : undefined, stage, probability: probability ? Number(probability) : undefined, counterparty, cooperationMode, industry, description, note, lostReason };
        if (budget !== undefined)
            updateData.budget = budget ? Number(budget) : null;
        if (deadline)
            updateData.deadline = new Date(deadline);
        if (expectedCloseDate)
            updateData.expectedCloseDate = new Date(expectedCloseDate);
        if (wonAt)
            updateData.wonAt = new Date(wonAt);
        if (lostAt)
            updateData.lostAt = new Date(lostAt);
        const opportunity = await prisma_1.default.opportunity.update({
            where: { id, tenantId: req.user.tenantId },
            data: updateData
        });
        (0, response_1.success)(res, opportunity, '商机更新成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 删除商机
router.delete('/opportunities/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await prisma_1.default.opportunity.delete({
            where: { id, tenantId: req.user.tenantId }
        });
        (0, response_1.success)(res, null, '商机删除成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 线索转化为客户
router.post('/leads/:id/convert', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const lead = await prisma_1.default.lead.findUnique({ where: { id } });
        if (!lead)
            return (0, response_1.notFound)(res, '线索不存在');
        const { level, stage, note: convertNote } = req.body;
        // 创建客户
        const customer = await prisma_1.default.customer.create({
            data: {
                name: lead.company || lead.name,
                contactName: lead.name,
                contactPhone: lead.phone,
                contactEmail: lead.email,
                tenantId: lead.tenantId,
                leadId: lead.id,
                stage: stage || 'active',
                level: level || 'C',
                tags: lead.tags || '',
                note: convertNote || ''
            }
        });
        // 更新线索状态
        await prisma_1.default.lead.update({
            where: { id },
            data: { status: 'qualified', convertedAt: new Date() }
        });
        (0, response_1.success)(res, customer, '线索已转化为客户');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 客户跟进记录 - 列表
router.get('/customers/:id/follow-ups', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const customer = await prisma_1.default.customer.findUnique({ where: { id, tenantId: req.user.tenantId } });
        if (!customer)
            return (0, response_1.notFound)(res, '客户不存在');
        let followUps = [];
        // 如果客户关联了线索，获取线索的跟进记录
        if (customer.leadId) {
            followUps = await prisma_1.default.followUp.findMany({
                where: { leadId: customer.leadId },
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { id: true, name: true } } }
            });
        }
        (0, response_1.success)(res, followUps);
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 客户跟进记录 - 创建
router.post('/customers/:id/follow-ups', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const customer = await prisma_1.default.customer.findUnique({ where: { id, tenantId: req.user.tenantId } });
        if (!customer)
            return (0, response_1.notFound)(res, '客户不存在');
        const { type, content, nextAction, nextTime } = req.body;
        if (!type || !content)
            return (0, response_1.fail)(res, '跟进类型和内容不能为空');
        // 如果客户没有关联线索，先创建一个线索
        let leadId = customer.leadId;
        if (!leadId) {
            const lead = await prisma_1.default.lead.create({
                data: {
                    name: customer.contactName || customer.name,
                    phone: customer.contactPhone,
                    email: customer.contactEmail,
                    company: customer.name,
                    source: 'manual',
                    status: 'following',
                    priority: 'medium',
                    tags: customer.tags || '',
                    tenantId: customer.tenantId,
                }
            });
            leadId = lead.id;
            await prisma_1.default.customer.update({ where: { id }, data: { leadId: lead.id } });
        }
        const followUp = await prisma_1.default.followUp.create({
            data: {
                leadId,
                userId: req.user.userId,
                type,
                content,
                nextAction,
                nextTime: nextTime ? new Date(nextTime) : undefined,
            },
            include: { user: { select: { id: true, name: true } } }
        });
        (0, response_1.success)(res, followUp, '跟进记录创建成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 客户快捷备注更新
router.put('/customers/:id/note', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { note } = req.body;
        const customer = await prisma_1.default.customer.update({
            where: { id, tenantId: req.user.tenantId },
            data: { note }
        });
        (0, response_1.success)(res, customer, '备注更新成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 建站中心管理 =====
// 获取站点列表
router.get('/sites', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { page = '1', pageSize = '20', search, type, status } = req.query;
        const skip = (Number(page) - 1) * Number(pageSize);
        const whereConditions = {
            tenantId: req.user.tenantId
        };
        if (search) {
            whereConditions.name = { contains: search };
        }
        if (type) {
            whereConditions.type = type;
        }
        if (status) {
            whereConditions.status = status;
        }
        const [sites, total] = await Promise.all([
            prisma_1.default.site.findMany({
                where: whereConditions,
                skip,
                take: Number(pageSize),
                orderBy: { createdAt: 'desc' },
                include: {
                    pages: true,
                    forms: true
                }
            }),
            prisma_1.default.site.count({ where: whereConditions })
        ]);
        (0, response_1.success)(res, { list: sites, total, page: Number(page), pageSize: Number(pageSize) }, '站点列表获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 获取站点详情
router.get('/sites/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const site = await prisma_1.default.site.findUnique({
            where: { id, tenantId: req.user.tenantId },
            include: {
                pages: true,
                forms: true
            }
        });
        if (!site) {
            return (0, response_1.notFound)(res, '站点不存在');
        }
        (0, response_1.success)(res, site, '站点详情获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 创建站点
router.post('/sites', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { name, type, domain, seoTitle, seoDesc, seoKeywords, config } = req.body;
        const site = await prisma_1.default.site.create({
            data: {
                name,
                type,
                domain,
                seoTitle,
                seoDesc,
                seoKeywords,
                config,
                tenantId: req.user.tenantId
            }
        });
        (0, response_1.success)(res, site, '站点创建成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 更新站点
router.put('/sites/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { name, type, domain, seoTitle, seoDesc, seoKeywords, config, status } = req.body;
        const site = await prisma_1.default.site.update({
            where: { id, tenantId: req.user.tenantId },
            data: { name, type, domain, seoTitle, seoDesc, seoKeywords, config, status }
        });
        (0, response_1.success)(res, site, '站点更新成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 删除站点
router.delete('/sites/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await prisma_1.default.site.delete({
            where: { id, tenantId: req.user.tenantId }
        });
        (0, response_1.success)(res, null, '站点删除成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 商品管理 =====
// 获取商品列表
router.get('/products', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { page = '1', pageSize = '20', search, category, status } = req.query;
        const skip = (Number(page) - 1) * Number(pageSize);
        const whereConditions = {
            tenantId: req.user.tenantId
        };
        if (search) {
            whereConditions.name = { contains: search };
        }
        if (category) {
            whereConditions.category = category;
        }
        if (status) {
            whereConditions.status = status;
        }
        const [products, total] = await Promise.all([
            prisma_1.default.product.findMany({
                where: whereConditions,
                skip,
                take: Number(pageSize),
                orderBy: { createdAt: 'desc' },
                include: {
                    skus: true
                }
            }),
            prisma_1.default.product.count({ where: whereConditions })
        ]);
        (0, response_1.success)(res, { list: products, total, page: Number(page), pageSize: Number(pageSize) }, '商品列表获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 获取商品详情
router.get('/products/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const product = await prisma_1.default.product.findUnique({
            where: { id, tenantId: req.user.tenantId },
            include: {
                skus: true
            }
        });
        if (!product) {
            return (0, response_1.notFound)(res, '商品不存在');
        }
        (0, response_1.success)(res, product, '商品详情获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 创建商品
router.post('/products', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { name, description, coverImage, images, price, originalPrice, stock, category, tags, externalUrl, status } = req.body;
        const product = await prisma_1.default.product.create({
            data: {
                name,
                description,
                coverImage,
                images: images || '',
                price: Number(price),
                originalPrice: originalPrice ? Number(originalPrice) : undefined,
                stock: Number(stock) || 0,
                category,
                tags: tags || '',
                status: status || 'draft',
                tenantId: req.user.tenantId
            }
        });
        (0, response_1.success)(res, product, '商品创建成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 更新商品
router.put('/products/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { name, description, coverImage, images, price, originalPrice, stock, category, tags, externalUrl, status } = req.body;
        const product = await prisma_1.default.product.update({
            where: { id, tenantId: req.user.tenantId },
            data: { name, description, coverImage, images, price: Number(price), originalPrice: originalPrice ? Number(originalPrice) : undefined, stock: Number(stock), category, tags, status }
        });
        (0, response_1.success)(res, product, '商品更新成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 删除商品
router.delete('/products/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await prisma_1.default.product.delete({
            where: { id, tenantId: req.user.tenantId }
        });
        (0, response_1.success)(res, null, '商品删除成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 商城审核管理 =====
// 获取商城审核统计
router.get('/mall-review/stats', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const [total, pendingCount, approvedCount, rejectedCount] = await Promise.all([
            prisma_1.default.externalWebsite.count({ where: { tenantId } }),
            prisma_1.default.externalWebsite.count({ where: { tenantId, reviewStatus: 'pending' } }),
            prisma_1.default.externalWebsite.count({ where: { tenantId, reviewStatus: 'approved' } }),
            prisma_1.default.externalWebsite.count({ where: { tenantId, reviewStatus: 'rejected' } }),
        ]);
        (0, response_1.success)(res, { total, pendingCount, approvedCount, rejectedCount }, '商城审核统计获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 获取商城审核列表
router.get('/mall-review', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { reviewStatus, search } = req.query;
        const where = { tenantId: req.user.tenantId };
        if (reviewStatus)
            where.reviewStatus = reviewStatus;
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { url: { contains: search } },
                { contactName: { contains: search } },
            ];
        }
        const websites = await prisma_1.default.externalWebsite.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { products: { take: 5, orderBy: { price: 'desc' } } },
        });
        (0, response_1.success)(res, websites, '商城审核列表获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 审核商城 - 通过/驳回
router.put('/mall-review/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { reviewStatus, reviewNote, status } = req.body;
        const website = await prisma_1.default.externalWebsite.update({
            where: { id: req.params.id },
            data: {
                reviewStatus,
                reviewNote,
                status: reviewStatus === 'approved' ? 'active' : reviewStatus === 'rejected' ? 'inactive' : undefined,
            },
        });
        (0, response_1.success)(res, website, reviewStatus === 'approved' ? '商城审核通过' : '商城已驳回');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 新增商城提交
router.post('/mall-review', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { name, url, platform, contactName, contactPhone, contactEmail } = req.body;
        const website = await prisma_1.default.externalWebsite.create({
            data: {
                tenantId: req.user.tenantId,
                name, url, platform,
                contactName, contactPhone, contactEmail,
                reviewStatus: 'pending',
                status: 'inactive',
            },
        });
        (0, response_1.success)(res, website, '商城提交成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 删除商城
router.delete('/mall-review/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        await prisma_1.default.externalWebsite.delete({ where: { id: req.params.id } });
        (0, response_1.success)(res, null, '商城删除成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 爆品链接推广 =====
// 获取爆品推广统计
router.get('/hot-products/stats', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const [totalProducts, promotedCount, totalClicks, totalLeads] = await Promise.all([
            prisma_1.default.product.count({ where: { tenantId } }),
            prisma_1.default.product.count({ where: { tenantId, status: 'active' } }),
            prisma_1.default.trackingLink.aggregate({ _sum: { clickCount: true }, where: {} }),
            prisma_1.default.trackingLink.aggregate({ _sum: { leadCount: true }, where: {} }),
        ]);
        (0, response_1.success)(res, {
            totalProducts,
            promotedCount,
            totalClicks: totalClicks._sum.clickCount || 0,
            totalLeads: totalLeads._sum.leadCount || 0,
        }, '爆品推广统计获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 获取爆品列表（含推广链接）
router.get('/hot-products', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { search, status } = req.query;
        const where = { tenantId: req.user.tenantId };
        if (search)
            where.name = { contains: search };
        if (status)
            where.status = status;
        const products = await prisma_1.default.product.findMany({
            where,
            orderBy: { salesCount: 'desc' },
            include: { skus: true },
        });
        // 获取所有相关的追踪链接
        const productIds = products.map(p => p.id);
        const trackingLinks = await prisma_1.default.trackingLink.findMany({
            where: { articleId: { in: productIds } },
        });
        const linkMap = {};
        trackingLinks.forEach(link => {
            if (!linkMap[link.articleId])
                linkMap[link.articleId] = [];
            linkMap[link.articleId].push(link);
        });
        const result = products.map(p => ({
            ...p,
            trackingLinks: linkMap[p.id] || [],
        }));
        (0, response_1.success)(res, result, '爆品列表获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 为爆品生成推广链接
router.post('/hot-products/promote', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { productId, targetUrl, utmSource, utmMedium, utmCampaign } = req.body;
        const shortCode = Math.random().toString(36).substring(2, 10);
        const link = await prisma_1.default.trackingLink.create({
            data: {
                articleId: productId,
                shortCode,
                targetUrl: targetUrl || '',
                utmSource,
                utmMedium,
                utmCampaign,
            },
        });
        (0, response_1.success)(res, { ...link, shortUrl: `/s/${shortCode}` }, '推广链接生成成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 删除推广链接
router.delete('/hot-products/promote/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        await prisma_1.default.trackingLink.delete({ where: { id: req.params.id } });
        (0, response_1.success)(res, null, '推广链接删除成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 更新商品状态（上架/下架）
router.put('/hot-products/:id/status', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { status } = req.body;
        const product = await prisma_1.default.product.update({
            where: { id: req.params.id, tenantId: req.user.tenantId },
            data: { status },
        });
        (0, response_1.success)(res, product, status === 'active' ? '商品已上架' : '商品已下架');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 图片管理接口 =====
// 获取图片列表
router.get('/images', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { page = '1', pageSize = '20', search, siteId } = req.query;
        const skip = (Number(page) - 1) * Number(pageSize);
        const whereConditions = {};
        // MediaAsset 通过 siteId 关联，需要查询租户下的站点
        const tenantSites = await prisma_1.default.site.findMany({
            where: { tenantId: req.user.tenantId },
            select: { id: true }
        });
        const siteIds = tenantSites.map(s => s.id);
        whereConditions.siteId = { in: siteIds };
        if (search) {
            whereConditions.name = { contains: search };
        }
        if (siteId) {
            whereConditions.siteId = siteId;
        }
        // 只查询图片类型
        whereConditions.type = 'image';
        const [images, total] = await Promise.all([
            prisma_1.default.mediaAsset.findMany({
                where: whereConditions,
                skip,
                take: Number(pageSize),
                orderBy: { createdAt: 'desc' }
            }),
            prisma_1.default.mediaAsset.count({ where: whereConditions })
        ]);
        (0, response_1.success)(res, { list: images, total, page: Number(page), pageSize: Number(pageSize) }, '图片列表获取成功');
    }
    catch (error) {
        console.error('Error fetching images:', error);
        (0, response_1.fail)(res, error.message);
    }
});
// 删除图片
router.delete('/images/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await prisma_1.default.mediaAsset.delete({ where: { id } });
        (0, response_1.success)(res, null, '图片删除成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 员工档案管理接口 =====
// 获取员工统计
router.get('/employees/stats', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const [total, activeCount, departmentCounts] = await Promise.all([
            prisma_1.default.employeeCard.count({ where: { tenantId } }),
            prisma_1.default.employeeCard.count({ where: { tenantId } }),
            prisma_1.default.employeeCard.groupBy({
                by: ['department'],
                where: { tenantId },
                _count: { department: true }
            })
        ]);
        const deptMap = {};
        departmentCounts.forEach((d) => { if (d.department)
            deptMap[d.department] = d._count.department; });
        (0, response_1.success)(res, { total, activeCount, departmentCounts: deptMap }, '员工统计获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 获取员工列表
router.get('/employees', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { page = '1', pageSize = '20', search, department } = req.query;
        const skip = (Number(page) - 1) * Number(pageSize);
        const whereConditions = { tenantId: req.user.tenantId };
        if (search) {
            whereConditions.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
                { phone: { contains: search } }
            ];
        }
        if (department && department !== 'all') {
            whereConditions.department = department;
        }
        const [employees, total] = await Promise.all([
            prisma_1.default.employeeCard.findMany({
                where: whereConditions,
                skip,
                take: Number(pageSize),
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true, email: true, role: true, status: true } } }
            }),
            prisma_1.default.employeeCard.count({ where: whereConditions })
        ]);
        (0, response_1.success)(res, { list: employees, total, page: Number(page), pageSize: Number(pageSize) }, '员工列表获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 获取员工详情
router.get('/employees/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const employee = await prisma_1.default.employeeCard.findUnique({
            where: { id, tenantId: req.user.tenantId },
            include: { user: { select: { name: true, email: true, role: true, phone: true, department: true, status: true } } }
        });
        if (!employee)
            return (0, response_1.notFound)(res, '员工不存在');
        (0, response_1.success)(res, employee, '员工详情获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 创建员工档案
router.post('/employees', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { name, title, department, phone, email, avatar } = req.body;
        const employee = await prisma_1.default.employeeCard.create({
            data: {
                name,
                title,
                department,
                phone,
                email,
                avatar,
                tenantId: req.user.tenantId,
                userId: req.user.userId
            }
        });
        (0, response_1.success)(res, employee, '员工档案创建成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 更新员工档案
router.put('/employees/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { name, title, department, phone, email, avatar } = req.body;
        const employee = await prisma_1.default.employeeCard.update({
            where: { id, tenantId: req.user.tenantId },
            data: { name, title, department, phone, email, avatar }
        });
        (0, response_1.success)(res, employee, '员工档案更新成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 删除员工档案
router.delete('/employees/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await prisma_1.default.employeeCard.delete({ where: { id, tenantId: req.user.tenantId } });
        (0, response_1.success)(res, null, '员工档案删除成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 内容管理接口（图文/视频/白皮书） =====
// 获取内容统计
router.get('/articles/stats', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const [total, articleCount, videoCount, whitepaperCount, publishedCount, draftCount] = await Promise.all([
            prisma_1.default.article.count({ where: { tenantId } }),
            prisma_1.default.article.count({ where: { tenantId, type: 'article' } }),
            prisma_1.default.article.count({ where: { tenantId, type: 'video' } }),
            prisma_1.default.article.count({ where: { tenantId, type: 'whitepaper' } }),
            prisma_1.default.article.count({ where: { tenantId, status: 'published' } }),
            prisma_1.default.article.count({ where: { tenantId, status: 'draft' } }),
        ]);
        (0, response_1.success)(res, { total, articleCount, videoCount, whitepaperCount, publishedCount, draftCount }, '内容统计获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 获取内容列表
router.get('/articles', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { page = '1', pageSize = '20', search, status, type } = req.query;
        const skip = (Number(page) - 1) * Number(pageSize);
        const whereConditions = { tenantId: req.user.tenantId };
        if (search) {
            whereConditions.OR = [
                { title: { contains: search } },
                { summary: { contains: search } }
            ];
        }
        if (status && status !== 'all') {
            whereConditions.status = status;
        }
        if (type && type !== 'all') {
            whereConditions.type = type;
        }
        const [articles, total] = await Promise.all([
            prisma_1.default.article.findMany({
                where: whereConditions,
                skip,
                take: Number(pageSize),
                orderBy: { createdAt: 'desc' }
            }),
            prisma_1.default.article.count({ where: whereConditions })
        ]);
        (0, response_1.success)(res, { list: articles, total, page: Number(page), pageSize: Number(pageSize) }, '内容列表获取成功');
    }
    catch (error) {
        console.error('Error fetching articles:', error);
        (0, response_1.fail)(res, error.message);
    }
});
// 创建内容
router.post('/articles', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { title, type, status, coverImage, summary, content, videoUrl, documentUrl, tags } = req.body;
        const article = await prisma_1.default.article.create({
            data: {
                title,
                type: type || 'article',
                status: status || 'draft',
                coverImage,
                summary,
                content,
                videoUrl,
                documentUrl,
                tags: Array.isArray(tags) ? tags.join(',') : (tags || ''),
                tenantId: req.user.tenantId,
                authorId: req.user.userId,
                publishedAt: status === 'published' ? new Date() : null
            }
        });
        (0, response_1.success)(res, article, '内容创建成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 更新内容
router.put('/articles/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { title, type, status, coverImage, summary, content, videoUrl, documentUrl, tags } = req.body;
        const updateData = { title, type, status, coverImage, summary, content, videoUrl, documentUrl };
        if (tags !== undefined) {
            updateData.tags = Array.isArray(tags) ? tags.join(',') : tags;
        }
        if (status === 'published') {
            updateData.publishedAt = new Date();
        }
        const article = await prisma_1.default.article.update({
            where: { id, tenantId: req.user.tenantId },
            data: updateData
        });
        (0, response_1.success)(res, article, '内容更新成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 删除内容
router.delete('/articles/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await prisma_1.default.article.delete({ where: { id, tenantId: req.user.tenantId } });
        (0, response_1.success)(res, null, '内容删除成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 统计数据接口 =====
// 获取系统统计数据
router.get('/stats', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        // 获取各种统计数据 - 对应仪表盘八大模块
        const [totalSites, // 站点总数
        externalSites, // 接入外部网站
        ownPortals, // 企业自有门户
        builtPages, // 搭建页面数
        leads, // 商机线索
        customers, // 收录客户
        articles, // 文章推广
        videos, // 视频推广
        whitepapers, // 白皮书
        onlineStaff, // 线上人员
        mallSites, // 自有商城
        seoOptimized, // SEO优化站点
        dataSites, // 数据站接入
        totalVisits, // 总访问量
        todayVisits // 今日访问
        ] = await Promise.all([
            prisma_1.default.site.count({ where: { tenantId } }),
            Promise.resolve(0), // TODO: 外部网站统计
            Promise.resolve(0), // TODO: 自有门户统计
            Promise.resolve(0), // TODO: 搭建页面统计
            Promise.resolve(0), // TODO: 商机线索统计
            Promise.resolve(0), // TODO: 客户统计
            Promise.resolve(0), // TODO: 文章推广统计
            Promise.resolve(0), // TODO: 视频推广统计
            Promise.resolve(0), // TODO: 白皮书统计
            Promise.resolve(0), // TODO: 线上人员统计
            Promise.resolve(0), // TODO: 商城统计
            Promise.resolve(0), // TODO: SEO优化统计
            Promise.resolve(0), // TODO: 数据站接入统计
            Promise.resolve(0), // TODO: 总访问量统计
            Promise.resolve(0), // TODO: 今日访问统计
        ]);
        const statsData = {
            externalSites,
            ownPortals,
            builtPages,
            leads,
            customers,
            articles,
            videos,
            whitepapers,
            onlineStaff,
            mallSites,
            seoOptimized,
            seoScore: 0,
            dataSites,
            totalVisits,
            todayVisits,
        };
        (0, response_1.success)(res, statsData, '统计数据获取成功');
    }
    catch (error) {
        console.error('Error fetching stats:', error);
        (0, response_1.fail)(res, error.message);
    }
});
// ===== 后端管理员管理 =====
// 获取管理员列表
router.get('/admin-users', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { page = '1', pageSize = '20', search } = req.query;
        const skip = (Number(page) - 1) * Number(pageSize);
        const whereConditions = {
            tenantId: req.user.tenantId,
            role: { in: ['admin', 'super_admin', 'operator'] }
        };
        if (search) {
            whereConditions.OR = [
                { name: { contains: search } },
                { email: { contains: search } }
            ];
        }
        const [adminUsers, total] = await Promise.all([
            prisma_1.default.user.findMany({
                where: whereConditions,
                skip,
                take: Number(pageSize),
                orderBy: { createdAt: 'desc' }
            }),
            prisma_1.default.user.count({ where: whereConditions })
        ]);
        (0, response_1.success)(res, { list: adminUsers, total, page: Number(page), pageSize: Number(pageSize) }, '管理员列表获取成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 创建管理员
router.post('/admin-users', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const { name, email, phone, role, status, password } = req.body;
        const existingUser = await prisma_1.default.user.findFirst({ where: { email, tenantId: req.user.tenantId } });
        if (existingUser) {
            return (0, response_1.fail)(res, '该邮箱已被注册');
        }
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password || 'Admin@123', 10);
        const adminUser = await prisma_1.default.user.create({
            data: {
                name,
                email,
                phone,
                role: role || 'admin',
                status: status || 'active',
                password: hashedPassword,
                tenantId: req.user.tenantId
            }
        });
        (0, response_1.success)(res, adminUser, '管理员创建成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 更新管理员
router.put('/admin-users/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { name, phone, role, status } = req.body;
        const adminUser = await prisma_1.default.user.update({
            where: { id },
            data: { name, phone, role, status }
        });
        (0, response_1.success)(res, adminUser, '管理员更新成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 删除管理员
router.delete('/admin-users/:id', (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await prisma_1.default.user.delete({ where: { id } });
        (0, response_1.success)(res, null, '管理员删除成功');
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
//# sourceMappingURL=admin.routes.js.map