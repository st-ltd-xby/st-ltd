import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../common/prisma';
import { success, fail } from '../../common/response';

const router: Router = Router();

/**
 * 访客追踪接口（公开，无需认证）
 * SDK 发送 pageview/click/form/leave 等事件
 */
router.post('/visitor/track', async (req: Request, res: Response) => {
  try {
    const {
      tenantId,
      visitorId,
      sessionId,
      type,
      url,
      title,
      timestamp,
      data,
      ua,
      screen: screenSize,
      viewport,
      lang,
      promoCode,
    } = req.body;

    if (!tenantId || !visitorId) {
      return fail(res, '缺少 tenantId 或 visitorId');
    }

    // 查找或创建访客记录
    let visitor = await prisma.visitor.findFirst({
      where: { tenantId, fingerprint: visitorId },
    });

    if (!visitor) {
      visitor = await prisma.visitor.create({
        data: {
          tenantId,
          fingerprint: visitorId,
          ip: req.ip || req.socket.remoteAddress || '',
          ua: ua || '',
          referrer: data?.referrer || '',
          landingPage: url || '',
          utmSource: data?.utm?.utm_source || (promoCode ? 'promotion' : ''),
          utmMedium: data?.utm?.utm_medium || (promoCode ? 'short-link' : ''),
          utmCampaign: data?.utm?.utm_campaign || '',
          visitCount: 1,
          lastVisitAt: new Date(),
        },
      });
    } else {
      await prisma.visitor.update({
        where: { id: visitor.id },
        data: {
          lastVisitAt: new Date(),
          visitCount: { increment: 1 },
          ip: req.ip || req.socket.remoteAddress || visitor.ip,
        },
      });
    }

    // 记录访客行为
    if (type) {
      await prisma.visitorBehavior.create({
        data: {
          visitorId: visitor.id,
          type,
          page: url || '',
          data: JSON.stringify({
            title,
            timestamp,
            sessionId,
            screenSize,
            viewport,
            lang,
            ...data,
          }),
        },
      });
    }

    // 如果是通过推广短链来的，自动创建线索
    if (promoCode) {
      const trackingLink = await prisma.trackingLink.findUnique({ where: { shortCode: promoCode } });
      if (trackingLink) {
        // 从目标URL提取页面slug，获取tenantId
        const slugMatch = trackingLink.targetUrl.match(/\/p\/(.+)$/);
        let leadTenantId = tenantId;
        if (slugMatch) {
          const page = await prisma.page.findFirst({ where: { slug: decodeURIComponent(slugMatch[1]) } });
          if (page) leadTenantId = page.tenantId;
        }
        // 创建线索（来源：推广链接）
        await prisma.lead.create({
          data: {
            tenantId: leadTenantId,
            name: `推广访客-${promoCode}`,
            source: 'promotion',
            sourceId: trackingLink.id,
            visitorId: visitor.id,
            status: 'new',
            priority: 'medium',
            tags: '',
            note: `通过推广短链 ${promoCode} 访问，目标: ${trackingLink.targetUrl}`,
          },
        });
        // 更新追踪链接的线索计数
        await prisma.trackingLink.update({
          where: { id: trackingLink.id },
          data: { leadCount: { increment: 1 } },
        });
      }
    }

    success(res, { visitorId: visitor.id });
  } catch (error: any) {
    console.error('[Visitor Track Error]', error.message);
    fail(res, error.message);
  }
});

export default router;
