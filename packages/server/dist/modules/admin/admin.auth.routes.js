"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../../common/prisma"));
const response_1 = require("../../common/response");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
const adminLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('邮箱格式不正确'),
    password: zod_1.z.string().min(1, '请输入密码'),
});
// 管理员登录
router.post('/admin-login', async (req, res) => {
    try {
        const data = adminLoginSchema.parse(req.body);
        // 查找用户，支持多种管理员账号登录方式
        let user;
        // 首先尝试使用提供的邮箱查找管理员用户
        user = await prisma_1.default.user.findFirst({
            where: {
                email: data.email,
                role: 'admin'
            },
            include: { tenant: true },
        });
        // 如果没找到，尝试查找预设的管理员账号
        if (!user) {
            user = await prisma_1.default.user.findFirst({
                where: {
                    email: 'admin@ltd.com',
                    role: 'admin'
                },
                include: { tenant: true },
            });
        }
        // 如果还没找到，尝试查找备用管理员账号
        if (!user) {
            user = await prisma_1.default.user.findFirst({
                where: {
                    email: 'admin',
                    role: 'admin'
                },
                include: { tenant: true },
            });
        }
        if (!user) {
            return (0, response_1.fail)(res, '管理员账号或密码错误');
        }
        // 检查是否为管理员角色
        if (user.role !== 'admin') {
            return (0, response_1.fail)(res, '该账号不是管理员账号');
        }
        if (user.status !== 'active') {
            return (0, response_1.fail)(res, '账号已被禁用');
        }
        // 验证密码
        const isValid = await bcryptjs_1.default.compare(data.password, user.password);
        if (!isValid) {
            return (0, response_1.fail)(res, '管理员账号或密码错误');
        }
        // 更新最后登录时间
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const payload = { userId: user.id, tenantId: user.tenantId, role: user.role };
        const token = (0, auth_1.generateToken)(payload);
        const refreshToken = (0, auth_1.generateRefreshToken)(payload);
        (0, response_1.success)(res, {
            token,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
            },
            tenant: { id: user.tenantId, name: user.tenant.name },
        }, '管理员登录成功');
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return (0, response_1.fail)(res, error.errors.map((e) => e.message).join(', '));
        }
        (0, response_1.fail)(res, error.message || '登录失败');
    }
});
exports.default = router;
//# sourceMappingURL=admin.auth.routes.js.map