import { PrismaClient } from '@prisma/client';
import * as QRCode from 'qrcode';

const prisma = new PrismaClient();

async function seedPromotion() {
  const tenantId = 'test-tenant-001';

  // 检查是否已有推广数据
  const linkCount = await prisma.trackingLink.count();
  if (linkCount > 0) {
    console.log(' 推广演示数据已存在，跳过');
    return;
  }

  console.log(' 正在创建推广演示数据...');

  // 1. 创建追踪链接
  const links = [
    { shortCode: 'wx2024', targetUrl: 'https://example.com/landing?from=wechat', utmSource: 'wechat', utmMedium: 'social', utmCampaign: '618促销', clickCount: 128, leadCount: 12 },
    { shortCode: 'xhs001', targetUrl: 'https://example.com/landing?from=xiaohongshu', utmSource: 'xiaohongshu', utmMedium: 'social', utmCampaign: '新品发布', clickCount: 86, leadCount: 8 },
    { shortCode: 'dy2024', targetUrl: 'https://example.com/landing?from=douyin', utmSource: 'douyin', utmMedium: 'video', utmCampaign: '直播带货', clickCount: 256, leadCount: 31 },
    { shortCode: 'bd001', targetUrl: 'https://example.com/landing?from=baidu', utmSource: 'baidu', utmMedium: 'cpc', utmCampaign: '品牌推广', clickCount: 45, leadCount: 5 },
    { shortCode: 'email01', targetUrl: 'https://example.com/landing?from=email', utmSource: 'email', utmMedium: 'newsletter', utmCampaign: '月度通讯', clickCount: 32, leadCount: 7 },
  ];

  for (const link of links) {
    await prisma.trackingLink.create({ data: link });
  }
  console.log(`  创建 ${links.length} 个追踪链接`);

  // 2. 创建二维码
  const qrData = [
    { name: '官网首页', targetUrl: 'https://example.com', color: '#000000', bgColor: '#ffffff', size: 300, scanCount: 56 },
    { name: '产品手册下载', targetUrl: 'https://example.com/brochure', color: '#1890ff', bgColor: '#ffffff', size: 300, scanCount: 23 },
    { name: '活动报名', targetUrl: 'https://example.com/event/signup', color: '#52c41a', bgColor: '#ffffff', size: 300, scanCount: 89 },
    { name: '微信公众号', targetUrl: 'https://example.com/wechat', color: '#07c160', bgColor: '#ffffff', size: 300, scanCount: 134 },
  ];

  for (const qr of qrData) {
    const imageUrl = await QRCode.toDataURL(qr.targetUrl, {
      width: qr.size,
      margin: 2,
      color: { dark: qr.color, light: qr.bgColor },
    });
    await prisma.qrCode.create({
      data: { tenantId, imageUrl, ...qr },
    });
  }
  console.log(`  创建 ${qrData.length} 个二维码`);

  // 3. 创建邮件模板
  const templates = [
    { name: '新品发布通知', subject: '🎉 我们推出了全新产品！', content: '<h1>新品发布</h1><p>尊敬的客户，我们很高兴地通知您，我们的全新产品现已上线！</p><p>立即访问我们的网站了解更多详情。</p><p>祝好，<br>团队</p>', variables: 'customer_name,product_name', status: 'active' },
    { name: '促销活动邀请', subject: '限时优惠！618大促来袭', content: '<h1>618 大促</h1><p>亲爱的 {{customer_name}}，</p><p>618 大促来袭！所有产品享受 <strong>8 折优惠</strong>！</p><p>活动截止日期：2024年6月18日</p><p>立即抢购 →</p>', variables: 'customer_name,discount', status: 'active' },
    { name: '客户回访', subject: '感谢您的信任', content: '<h1>客户回访</h1><p>尊敬的 {{customer_name}}，</p><p>感谢您选择我们的服务。我们希望了解您的使用体验。</p><p>请填写简短的满意度调查，我们将为您提供专属优惠。</p>', variables: 'customer_name,survey_link', status: 'active' },
  ];

  for (const t of templates) {
    await prisma.emailTemplate.create({ data: { tenantId, ...t } });
  }
  console.log(`  创建 ${templates.length} 个邮件模板`);

  // 4. 创建邮件活动
  const campaigns = [
    { name: '618促销推送', subject: '限时优惠！618大促来袭', content: templates[1].content, recipients: 'user1@example.com,user2@example.com,user3@example.com', totalCount: 3, sentCount: 3, successCount: 3, failCount: 0, status: 'sent', sentAt: new Date('2024-06-15') },
    { name: '新品通知-第二批', subject: '🎉 我们推出了全新产品！', content: templates[0].content, recipients: 'vip1@example.com,vip2@example.com', totalCount: 2, status: 'draft' },
  ];

  for (const c of campaigns) {
    await prisma.emailCampaign.create({ data: { tenantId, ...c } });
  }
  console.log(`  创建 ${campaigns.length} 个邮件活动`);

  console.log(' 推广演示数据创建完成！');
}

seedPromotion().catch(console.error).finally(() => prisma.$disconnect());
