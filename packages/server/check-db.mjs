import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const pages = await p.page.findMany({ select: { id: true, title: true, slug: true, status: true } });
  console.log('=== Pages ===');
  console.log(JSON.stringify(pages, null, 2));
  const sites = await p.site.findMany({ select: { id: true, name: true } });
  console.log('=== Sites ===');
  console.log(JSON.stringify(sites, null, 2));
  const users = await p.user.findMany({ select: { id: true, name: true, email: true } });
  console.log('=== Users ===');
  console.log(JSON.stringify(users, null, 2));
  await p.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
