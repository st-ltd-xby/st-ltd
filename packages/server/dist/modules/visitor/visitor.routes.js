"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../common/prisma"));
const response_1 = require("../../common/response");
const router = (0, express_1.Router)();
/**
 * 访客追踪接口（公开，无需认证）
 * SDK 发送 pageview/click/form/leave 等事件
 */
router.post('/visitor/track', async (req, res) => {
    try {
        const { tenantId, visitorId, sessionId, type, url, title, timestamp, data, ua, screen: screenSize, viewport, lang, promoCode, } = req.body;
        if (!tenantId || !visitorId) {
            return (0, response_1.fail)(res, '缺少 tenantId 或 visitorId');
        }
        // 查找或创建访客记录
        let visitor = await prisma_1.default.visitor.findFirst({
            where: { tenantId, fingerprint: visitorId },
        });
        if (!visitor) {
            visitor = await prisma_1.default.visitor.create({
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
        }
        else {
            await prisma_1.default.visitor.update({
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
            await prisma_1.default.visitorBehavior.create({
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
            const trackingLink = await prisma_1.default.trackingLink.findUnique({ where: { shortCode: promoCode } });
            if (trackingLink) {
                // 从目标URL提取页面slug，获取tenantId
                const slugMatch = trackingLink.targetUrl.match(/\/p\/(.+)$/);
                let leadTenantId = tenantId;
                if (slugMatch) {
                    const page = await prisma_1.default.page.findFirst({ where: { slug: decodeURIComponent(slugMatch[1]) } });
                    if (page)
                        leadTenantId = page.tenantId;
                }
                // 解析UA获取设备/浏览器信息
                const userAgent = ua || '';
                const device = /Mobile|Android|iPhone|iPad/i.test(userAgent) ? '移动端' : 'PC端';
                const browser = /Edg/i.test(userAgent) ? 'Edge' : /Chrome/i.test(userAgent) ? 'Chrome' : /Firefox/i.test(userAgent) ? 'Firefox' : /Safari/i.test(userAgent) ? 'Safari' : '未知';
                const ip = req.ip || req.socket.remoteAddress || '';
                const referrer = data?.referrer || '';
                // 防重复：同一访客同一推广链接只创建一次线索
                const existingLead = await prisma_1.default.lead.findFirst({
                    where: { tenantId: leadTenantId, visitorId: visitor.id, source: 'promotion', sourceId: trackingLink.id },
                });
                if (!existingLead) {
                    await prisma_1.default.lead.create({
                        data: {
                            tenantId: leadTenantId,
                            name: `推广访客-${promoCode}`,
                            source: 'promotion',
                            sourceId: trackingLink.id,
                            visitorId: visitor.id,
                            status: 'new',
                            priority: 'medium',
                            tags: '推广采集',
                            note: `推广短链: ${promoCode}\n设备: ${device} | 浏览器: ${browser}\nIP: ${ip}\n来源页: ${referrer || '直接访问'}\n目标页: ${trackingLink.targetUrl}`,
                        },
                    });
                    // 更新追踪链接的线索计数
                    await prisma_1.default.trackingLink.update({
                        where: { id: trackingLink.id },
                        data: { leadCount: { increment: 1 } },
                    });
                }
            }
        }
        (0, response_1.success)(res, { visitorId: visitor.id });
    }
    catch (error) {
        console.error('[Visitor Track Error]', error.message);
        (0, response_1.fail)(res, error.message);
    }
});
exports.default = router;
//# sourceMappingURL=visitor.routes.js.map