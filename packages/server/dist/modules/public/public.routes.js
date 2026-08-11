"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../common/prisma"));
const response_1 = require("../../common/response");
const router = (0, express_1.Router)();
/**
 * 公开表单提交 → 自动创建线索
 * POST /api/v1/public/form-submit
 * 参数：formId, name, phone, email, company, message, tenantId
 */
router.post('/form-submit', async (req, res) => {
    try {
        const { formId, name, phone, email, company, message, tenantId } = req.body;
        if (!tenantId) {
            return (0, response_1.fail)(res, '缺少 tenantId');
        }
        // 查找表单配置
        const formConfig = await prisma_1.default.systemConfig.findFirst({
            where: {
                tenantId,
                key: `form_${formId}`,
            },
        });
        // 表单不存在时仍然接受提交（兼容页面搭建器直接嵌入的表单）
        if (formConfig) {
            const formDataParsed = JSON.parse(formConfig.value);
            if (formDataParsed.status === 'inactive') {
                return (0, response_1.fail)(res, '表单当前不可提交');
            }
            // 更新提交次数
            formDataParsed.submissions = (formDataParsed.submissions || 0) + 1;
            await prisma_1.default.systemConfig.update({
                where: { id: formConfig.id },
                data: { value: JSON.stringify(formDataParsed) },
            });
        }
        // 保存提交记录
        const submissionId = `fs_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        await prisma_1.default.systemConfig.create({
            data: {
                tenantId,
                key: `form_submission_${submissionId}`,
                value: JSON.stringify({
                    formId,
                    name,
                    phone,
                    email,
                    company,
                    message,
                    submittedAt: new Date(),
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                }),
            },
        });
        // 自动创建线索
        if (name || phone || email) {
            await prisma_1.default.lead.create({
                data: {
                    tenantId,
                    name: name || phone || email || '匿名访客',
                    phone: phone || null,
                    email: email || null,
                    company: company || null,
                    source: 'form',
                    sourceId: formId || null,
                    status: 'new',
                    priority: 'medium',
                    tags: '',
                    note: message || `通过表单 ${formId || '未知'} 提交`,
                },
            });
        }
        (0, response_1.success)(res, { id: submissionId }, '提交成功，我们会尽快联系您');
    }
    catch (error) {
        console.error('[Public Form Submit Error]', error.message);
        (0, response_1.fail)(res, error.message);
    }
});
/**
 * 客户自助注册
 * POST /api/v1/public/customer-register
 * 参数：name, industry, contactName, contactPhone, contactEmail, address, note, tenantId
 */
router.post('/customer-register', async (req, res) => {
    try {
        const { name, industry, contactName, contactPhone, contactEmail, address, note, tenantId } = req.body;
        if (!tenantId) {
            return (0, response_1.fail)(res, '缺少 tenantId');
        }
        if (!name && !contactName) {
            return (0, response_1.fail)(res, '公司名称或联系人至少填写一项');
        }
        // 检查是否已存在相同邮箱/电话的客户（避免重复）
        if (contactEmail || contactPhone) {
            const existing = await prisma_1.default.customer.findFirst({
                where: {
                    tenantId,
                    OR: [
                        contactEmail ? { contactEmail } : { id: '' },
                        contactPhone ? { contactPhone } : { id: '' },
                    ].filter((c) => Object.keys(c).length > 0),
                },
            });
            if (existing) {
                return (0, response_1.fail)(res, '该客户已存在，请勿重复注册');
            }
        }
        const customer = await prisma_1.default.customer.create({
            data: {
                tenantId,
                name: name || contactName || '未命名客户',
                industry: industry || null,
                contactName: contactName || null,
                contactPhone: contactPhone || null,
                contactEmail: contactEmail || null,
                address: address || null,
                stage: 'prospect',
                level: 'C',
                tags: '自助注册',
                note: note || '通过自助注册页面创建',
            },
        });
        (0, response_1.success)(res, { id: customer.id }, '注册成功，我们将尽快与您联系');
    }
    catch (error) {
        console.error('[Public Customer Register Error]', error.message);
        (0, response_1.fail)(res, error.message);
    }
});
/**
 * 商机进度查询（公开，通过 token 访问）
 * GET /api/v1/public/opportunities/:token
 */
router.get('/opportunities/:token', async (req, res) => {
    try {
        const tokenRaw = req.params.token;
        const tokenStr = Array.isArray(tokenRaw) ? tokenRaw[0] : tokenRaw;
        // 通过 token 查找商机（token 存储在 opportunity.note 或专用字段）
        // 这里使用 opportunity.id 作为 token（后续可改为专用 token 字段）
        const opportunity = await prisma_1.default.opportunity.findFirst({
            where: {
                OR: [
                    { id: tokenStr },
                    { note: { contains: tokenStr } },
                ],
            },
            include: {
                customer: {
                    select: { id: true, name: true },
                },
            },
        });
        if (!opportunity) {
            return (0, response_1.notFound)(res, '商机不存在或链接已失效');
        }
        // 只返回公开信息
        (0, response_1.success)(res, {
            id: opportunity.id,
            title: opportunity.title,
            type: opportunity.type,
            stage: opportunity.stage,
            amount: opportunity.amount,
            expectedCloseDate: opportunity.expectedCloseDate,
            note: opportunity.note,
            customerName: opportunity.customer?.name || null,
            createdAt: opportunity.createdAt,
        });
    }
    catch (error) {
        console.error('[Public Opportunity Query Error]', error.message);
        (0, response_1.fail)(res, error.message);
    }
});
exports.default = router;
//# sourceMappingURL=public.routes.js.map