import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function autoSeed() {
  try {
    // 检查是否已有数据
    const tenantCount = await prisma.tenant.count();
    if (tenantCount > 0) {
      console.log('✅ 数据库已有数据，跳过初始化');
      // 即使已有数据，也确保管理员账号存在
      await ensureAdminExists();
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
    const adminPassword = await bcrypt.hash('admin123', 10);
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
    const backendAdminPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        id: 'backend-admin-001',
        tenantId: 'test-tenant-001',
        email: 'backend@ltd.com', // 使用合法邮箱格式
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

    // 创建测试页面
    await prisma.page.create({
      data: {
        id: 'test-page-001',
        tenantId: 'test-tenant-001',
        siteId: 'test-site-001',
        title: '辽宁高新安防科技有限公司',
        slug: '辽宁高新安防科技有限公司',
        content: JSON.stringify([
          { id: 'h1', type: 'heading', props: { level: 1, content: '辽宁高新安防科技有限公司', align: 'center', color: '#1a1a1a' } },
          { id: 'p1', type: 'text', props: { content: '欢迎访问辽宁高新安防科技有限公司官方网站', align: 'center', color: '#666', fontSize: '16px' } },
        ]),
        seoTitle: '辽宁高新安防科技有限公司',
        seoDesc: '辽宁高新安防科技有限公司官方网站',
        status: 'published',
        publishedAt: new Date(),
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

    console.log('✅ 初始化完成！');
    console.log('📋 管理员: admin@ltd.com / admin123');
    console.log('📋 员工: zhangsan@ltd.com / employee123');
  } catch (error) {
    console.error('❌ 初始化失败:', error);
  }
}

// 确保管理员账号始终存在（防止数据库重置后丢失）
async function ensureAdminExists() {
  try {
    const admin = await prisma.user.findUnique({ where: { id: 'test-admin-001' } });
    const password = await bcrypt.hash('admin123', 10);
    
    if (!admin) {
      // 管理员不存在，创建
      const tenant = await prisma.tenant.findFirst();
      if (tenant) {
        await prisma.user.create({
          data: {
            id: 'test-admin-001',
            tenantId: tenant.id,
            email: 'admin@ltd.com',
            password,
            name: '管理员',
            phone: '13800138000',
            role: 'admin',
            status: 'active',
          },
        });
        console.log('✅ 管理员账号已自动恢复: admin@ltd.com / admin123');
      }
    } else {
      // 管理员存在，但确保密码正确和状态正常
      if (admin.status !== 'active' || !(await bcrypt.compare('admin123', admin.password))) {
        await prisma.user.update({
          where: { id: 'test-admin-001' },
          data: { password, status: 'active' },
        });
        console.log('✅ 管理员密码已同步更新: admin@ltd.com / admin123');
      }
    }
  } catch (error) {
    console.error('恢复管理员账号失败:', error);
  }
}
