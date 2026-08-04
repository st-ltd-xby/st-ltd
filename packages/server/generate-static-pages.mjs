import { PrismaClient } from '@prisma/client';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function main() {
  const pages = await prisma.page.findMany({
    where: { status: 'published' },
    include: { site: { select: { name: true, seoTitle: true, seoDesc: true } } },
  });

  const outputDir = join(process.cwd(), 'packages/web/public/p');
  mkdirSync(outputDir, { recursive: true });

  // 生成所有页面索引
  const index = pages.map(p => ({ slug: p.slug, title: p.title, seoTitle: p.seoTitle, seoDesc: p.seoDesc }));
  writeFileSync(join(outputDir, 'index.json'), JSON.stringify(index));

  // 为每个页面生成独立JSON
  for (const page of pages) {
    const fileName = encodeURIComponent(page.slug) + '.json';
    writeFileSync(join(outputDir, fileName), JSON.stringify({ code: 0, data: page }));
    console.log(`Generated: p/${page.slug}`);
  }

  console.log(`Total: ${pages.length} pages`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
