import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log(' 开始创建种子数据...\n');

  // 创建测试租户
  const tenant = await prisma.tenant.upsert({
    where: { id: 'test-tenant-001' },
    update: {},
    create: {
      id: 'test-tenant-001',
      name: '测试企业',
      plan: 'pro',
      status: 'active',
    },
  });
  console.log(`✅ 租户: ${tenant.name} (${tenant.id})`);

  // 创建测试管理员账号
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { id: 'test-admin-001' },
    update: {},
    create: {
      id: 'test-admin-001',
      tenantId: tenant.id,
      email: 'admin@ltd.com',
      password: hashedPassword,
      name: '管理员',
      phone: '13800138000',
      role: 'admin',
      status: 'active',
    },
  });
  console.log(`✅ 管理员: ${admin.name} (${admin.email})`);

  // 创建测试员工账号
  const employeePassword = await bcrypt.hash('employee123', 10);
  const employee = await prisma.user.upsert({
    where: { id: 'test-employee-001' },
    update: {},
    create: {
      id: 'test-employee-001',
      tenantId: tenant.id,
      email: 'zhangsan@ltd.com',
      password: employeePassword,
      name: '张三',
      phone: '13900139000',
      role: 'member',
      status: 'active',
    },
  });
  console.log(`✅ 员工: ${employee.name} (${employee.email})`);

  // 创建测试站点
  const site = await prisma.site.upsert({
    where: { id: 'test-site-001' },
    update: {},
    create: {
      id: 'test-site-001',
      tenantId: tenant.id,
      name: '企业官网',
      type: 'pc',
      domain: 'https://example.com',
      status: 'published',
    },
  });
  console.log(`✅ 站点: ${site.name}`);

  // 创建测试商品
  const product = await prisma.product.upsert({
    where: { id: 'test-product-001' },
    update: {},
    create: {
      id: 'test-product-001',
      tenantId: tenant.id,
      name: '企业咨询服务',
      category: '服务',
      price: 9999.00,
      stock: 100,
      images: '',
      tags: '',
      status: 'active',
    },
  });
  console.log(`✅ 商品: ${product.name}`);

  console.log('\n🎉 种子数据创建完成！');
  console.log('\n📋 测试账号信息：');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  管理员账号: admin@ltd.com');
  console.log('  管理员密码: admin123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  员工账号:   zhangsan@ltd.com');
  console.log('  员工密码:   employee123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error(' 种子数据创建失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
