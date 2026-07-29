import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function autoSeed() {
  try {
    // 检查是否已有数据
    const tenantCount = await prisma.tenant.count();
    if (tenantCount > 0) {
      console.log(' 数据库已有数据，跳过初始化');
      return;
    }

    console.log(' 首次运行，正在初始化数据...');

    // 创建测试租户
    await prisma.tenant.create({
      data: {
        id: 'test-tenant-001',
        name: '测试企业',
        plan: 'pro',
        status: 'active',
      },
    });

    // 创建管理员
    const adminPassword = await bcrypt.hash('admin', 10); // 修改密码为admin
    await prisma.user.create({
      data: {
        id: 'test-admin-001',
        tenantId: 'test-tenant-001',
        email: 'admin@ltd.com',
        password: adminPassword,
        name: '管理员',
        phone: '13800138000',
        role: 'admin',
        status: 'active',
      },
    });

    // 创建后端管理员账号
    const backendAdminPassword = await bcrypt.hash('admin', 10);
    await prisma.user.create({
      data: {
        id: 'backend-admin-001',
        tenantId: 'test-tenant-001',
        email: 'admin', // 使用admin作为登录名
        password: backendAdminPassword,
        name: '后端管理员',
        phone: '13900139000',
        role: 'admin',
        status: 'active',
      },
    });

    // 创建员工
    const empPassword = await bcrypt.hash('employee123', 10);
    await prisma.user.create({
      data: {
        id: 'test-employee-001',
        tenantId: 'test-tenant-001',
        email: 'zhangsan@ltd.com',
        password: empPassword,
        name: '张三',
        phone: '13900139000',
        role: 'member',
        status: 'active',
      },
    });

    // 创建测试站点
    await prisma.site.create({
      data: {
        id: 'test-site-001',
        tenantId: 'test-tenant-001',
        name: '企业官网',
        type: 'pc',
        domain: 'https://example.com',
        status: 'published',
      },
    });

    // 创建测试商品
    await prisma.product.create({
      data: {
        id: 'test-product-001',
        tenantId: 'test-tenant-001',
        name: '企业咨询服务',
        category: '服务',
        price: 9999.00,
        stock: 100,
        images: '',
        tags: '',
        status: 'active',
      },
    });

    console.log(' 初始化完成！');
    console.log(' 管理员: admin@ltd.com / admin123');
    console.log(' 员工: zhangsan@ltd.com / employee123');
  } catch (error) {
    console.error(' 初始化失败:', error);
  }
}
