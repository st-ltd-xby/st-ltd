"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, '姓名至少2个字符'),
    email: zod_1.z.string().email('邮箱格式不正确'),
    password: zod_1.z.string().min(6, '密码至少6位'),
    companyName: zod_1.z.string().min(1, '企业名称不能为空'),
    phone: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('邮箱格式不正确'),
    password: zod_1.z.string().min(1, '请输入密码'),
});
// 注册
router.post('/register', async (req, res) => {
    try {
        const data = registerSchema.parse(req.body);
        // 检查邮箱是否已注册
        const existing = await prisma_1.default.user.findFirst({ where: { email: data.email } });
        if (existing) {
            return (0, response_1.fail)(res, '该邮箱已注册');
        }
        // 创建租户 (企业)
        const tenant = await prisma_1.default.tenant.create({
            data: { name: data.companyName, phone: data.phone },
        });
        // 创建用户（状态为 pending，待管理员审核）
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
        const user = await prisma_1.default.user.create({
            data: {
                tenantId: tenant.id,
                email: data.email,
                password: hashedPassword,
                name: data.name,
                phone: data.phone,
                role: 'admin',
                status: 'pending', // 待审核状态
            },
        });
        (0, response_1.success)(res, {
            userId: user.id,
            email: user.email,
            name: user.name,
        }, '注册成功，请等待管理员审核');
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return (0, response_1.fail)(res, error.errors.map((e) => e.message).join(', '));
        }
        (0, response_1.fail)(res, error.message || '注册失败');
    }
});
// 登录
router.post('/login', async (req, res) => {
    try {
        const data = loginSchema.parse(req.body);
        const user = await prisma_1.default.user.findFirst({
            where: { email: data.email },
            include: { tenant: true },
        });
        if (!user) {
            return (0, response_1.fail)(res, '邮箱或密码错误');
        }
        // 修改：允许管理员账户直接登录，即使状态不是active
        if (user.status !== 'active' && user.role !== 'admin') {
            if (user.status === 'pending') {
                return (0, response_1.fail)(res, '账号正在审核中，请等待管理员批准');
            }
            return (0, response_1.fail)(res, '账号已被禁用');
        }
        const isValid = await bcryptjs_1.default.compare(data.password, user.password);
        if (!isValid) {
            return (0, response_1.fail)(res, '邮箱或密码错误');
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
            tenant: { id: user.tenant.id, name: user.tenant.name },
        }, '登录成功');
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return (0, response_1.fail)(res, error.errors.map((e) => e.message).join(', '));
        }
        (0, response_1.fail)(res, error.message || '登录失败');
    }
});
// 获取当前用户信息
router.get('/me', auth_1.authMiddleware, async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.userId },
            include: { tenant: true },
        });
        if (!user) {
            return (0, response_1.fail)(res, '用户不存在');
        }
        (0, response_1.success)(res, {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                phone: user.phone,
                department: user.department,
            },
            tenant: { id: user.tenant.id, name: user.tenant.name },
        });
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 刷新 Token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return (0, response_1.fail)(res, '缺少 refreshToken');
        }
        const jwt = await Promise.resolve().then(() => __importStar(require('jsonwebtoken')));
        const decoded = jwt.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'ltd-hub-refresh');
        const payload = { userId: decoded.userId, tenantId: decoded.tenantId, role: decoded.role };
        const newToken = (0, auth_1.generateToken)(payload);
        const newRefreshToken = (0, auth_1.generateRefreshToken)(payload);
        (0, response_1.success)(res, { token: newToken, refreshToken: newRefreshToken });
    }
    catch {
        (0, response_1.fail)(res, 'Token 刷新失败，请重新登录');
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map