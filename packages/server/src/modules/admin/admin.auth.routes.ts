import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../../common/prisma';
import { success, fail } from '../../common/response';
import { generateToken, generateRefreshToken } from '../../middleware/auth';

const router: Router = Router();

const adminLoginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '请输入密码'),
});

// 管理员登录
router.post('/admin-login', async (req: Request, res: Response) => {
  try {
    const data = adminLoginSchema.parse(req.body);

    // 查找用户，支持多种管理员账号登录方式
    let user;
    
    // 首先尝试使用提供的邮箱查找管理员用户
    user = await prisma.user.findFirst({
      where: { 
        email: data.email,
        role: 'admin'
      },
      include: { tenant: true },
    });
    
    // 如果没找到，尝试查找预设的管理员账号
    if (!user) {
      user = await prisma.user.findFirst({
        where: { 
          email: 'admin@ltd.com',
          role: 'admin'
        },
        include: { tenant: true },
      });
    }
    
    // 如果还没找到，尝试查找备用管理员账号
    if (!user) {
      user = await prisma.user.findFirst({
        where: { 
          email: 'admin',
          role: 'admin'
        },
        include: { tenant: true },
      });
    }

    if (!user) {
      return fail(res, '管理员账号或密码错误');
    }

    // 检查是否为管理员角色
    if (user.role !== 'admin') {
      return fail(res, '该账号不是管理员账号');
    }

    if (user.status !== 'active') {
      return fail(res, '账号已被禁用');
    }

    // 验证密码
    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      return fail(res, '管理员账号或密码错误');
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
      tenant: { id: user.tenantId, name: user.tenant.name },
    }, '管理员登录成功');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return fail(res, error.errors.map((e: any) => e.message).join(', '));
    }
    fail(res, error.message || '登录失败');
  }
});

export default router;