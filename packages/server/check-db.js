const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  try {
    const users = await p.user.findMany({ where: { role: 'admin' } });
    console.log('Admin users:', JSON.stringify(users, null, 2));
    
    const tenants = await p.tenant.count();
    console.log('Tenant count:', tenants);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await p.$disconnect();
  }
}

main();
