import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../../common/prisma';
import { success, fail } from '../../common/response';
import { generateToken, generateRefreshToken, authMiddleware } from '../../middleware/auth';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, '姓名至少2个字符'),
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6位'),
  companyName: z.string().min(1, '企业名称不能为空'),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '请输入密码'),
});

// 注册
router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    // 检查邮箱是否已注册
    const existing = await prisma.user.findFirst({ where: { email: data.email } });
    if (existing) {
      return fail(res, '该邮箱已注册');
    }

    // 创建租户 (企业)
    const tenant = await prisma.tenant.create({
      data: { name: data.companyName, phone: data.phone },
    });

    // 创建用户（状态为 pending，待管理员审核）
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
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

    success(res, {
      userId: user.id,
      email: user.email,
      name: user.name,
    }, '注册成功，请等待管理员审核');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return fail(res, error.errors.map((e: any) => e.message).join(', '));
    }
    fail(res, error.message || '注册失败');
  }
});

// 登录
router.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: { email: data.email },
      include: { tenant: true },
    });

    if (!user) {
      return fail(res, '邮箱或密码错误');
    }

    if (user.status !== 'active') {
      if (user.status === 'pending') {
        return fail(res, '账号正在审核中，请等待管理员批准');
      }
      return fail(res, '账号已被禁用');
    }

    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      return fail(res, '邮箱或密码错误');
    }

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload = { userId: user.id, tenantId: user.tenantId, role: user.role };
    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    success(res, {
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
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return fail(res, error.errors.map((e: any) => e.message).join(', '));
    }
    fail(res, error.message || '登录失败');
  }
});

// 获取当前用户信息
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { tenant: true },
    });

    if (!user) {
      return fail(res, '用户不存在');
    }

    success(res, {
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
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 刷新 Token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return fail(res, '缺少 refreshToken');
    }

    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'ltd-hub-refresh'
    ) as any;

    const payload = { userId: decoded.userId, tenantId: decoded.tenantId, role: decoded.role };
    const newToken = generateToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    success(res, { token: newToken, refreshToken: newRefreshToken });
  } catch {
    fail(res, 'Token 刷新失败，请重新登录');
  }
});

export default router;
