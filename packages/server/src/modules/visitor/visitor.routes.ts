import { Router, Request, Response } from 'express';
import prisma from '../../common/prisma';
import { success, fail } from '../../common/response';

const router = Router();

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
    } = req.body;

    if (!tenantId || !visitorId) {
      return fail(res, '缺少 tenantId 或 visitorId');
    }

    // 查找或创建访客记录
    let visitor = await prisma.visitor.findFirst({
      where: { tenantId, fingerprint: visitorId },
    });

    if (!visitor) {
      // 首次访问，创建新访客
      visitor = await prisma.visitor.create({
        data: {
          tenantId,
          fingerprint: visitorId,
          ip: req.ip || req.socket.remoteAddress || '',
          ua: ua || '',
          referrer: data?.referrer || '',
          landingPage: url || '',
          utmSource: data?.utm?.utm_source || '',
          utmMedium: data?.utm?.utm_medium || '',
          utmCampaign: data?.utm?.utm_campaign || '',
          visitCount: 1,
          lastVisitAt: new Date(),
        },
      });
    } else {
      // 回访，更新 lastVisitAt 和 visitCount
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

    success(res, { visitorId: visitor.id });
  } catch (error: any) {
    // 追踪失败不影响用户体验，静默记录
    console.error('[Visitor Track Error]', error.message);
    fail(res, error.message);
  }
});

export default router;
