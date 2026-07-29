const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();

(async () => {
  try {
    const tenantCount = await p.tenant.count();
    console.log('tenant count:', tenantCount);
    const userCount = await p.user.count();
    console.log('user count:', userCount);

    if (tenantCount === 0) {
      // 创建租户
      await p.tenant.create({
        data: {
          id: 'default-tenant-001',
          name: 'ST-LTD',
          plan: 'pro',
          status: 'active',
        },
      });
      console.log('Tenant created');

      // 创建管理员
      const pwd = await bcrypt.hash('admin123', 10);
      await p.user.create({
        data: {
          id: 'admin-001',
          tenantId: 'default-tenant-001',
          email: 'admin@st-ltd.com',
          password: pwd,
          name: '管理员',
          phone: '13800138000',
          role: 'admin',
          status: 'active',
        },
      });
      console.log('Admin user created: admin@st-ltd.com / admin123');
    } else {
      // 租户已存在，检查是否有管理员
      const admin = await p.user.findFirst({ where: { role: 'admin' } });
      if (!admin) {
        const tenant = await p.tenant.findFirst();
        const pwd = await bcrypt.hash('admin123', 10);
        await p.user.create({
          data: {
            id: 'admin-001',
            tenantId: tenant.id,
            email: 'admin@st-ltd.com',
            password: pwd,
            name: '管理员',
            phone: '13800138000',
            role: 'admin',
            status: 'active',
          },
        });
        console.log('Admin user created: admin@st-ltd.com / admin123');
      } else {
        console.log('Admin already exists:', admin.email);
      }
    }

    await p.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    await p.disconnect();
  }
})();
