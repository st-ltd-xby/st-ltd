const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();

(async () => {
  try {
    const admin = await p.user.findUnique({ where: { id: 'test-admin-001' } });
    const pw = await bcrypt.hash('admin123', 10);
    
    if (admin) {
      await p.user.update({ where: { id: 'test-admin-001' }, data: { password: pw, status: 'active' } });
      console.log('ADMIN_UPDATED');
    } else {
      const tenant = await p.tenant.findFirst();
      await p.user.create({ data: { id: 'test-admin-001', tenantId: tenant.id, email: 'admin@ltd.com', password: pw, name: '管理员', role: 'admin', status: 'active' } });
      console.log('ADMIN_CREATED');
    }
    await p.$disconnect();
  } catch (e) {
    console.error('ERROR:', e.message);
    await p.$disconnect();
  }
})();
