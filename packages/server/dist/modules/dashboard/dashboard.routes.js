"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../../common/prisma"));
const response_1 = require("../../common/response");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
// 获取数据看板统计
router.get('/dashboard', async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const [todayVisitors, todayPageViews, todayLeads, monthOpportunities, monthWonOrders, totalCustomers, totalLeads, totalPageViews, leadsBySource, recentLeads, articles, products,] = await Promise.all([
            // 今日独立访客数
            prisma_1.default.visitor.count({ where: { tenantId, lastVisitAt: { gte: today } } }),
            // 今日页面访问次数（每次打开/刷新+1）
            prisma_1.default.visitorBehavior.count({
                where: {
                    visitor: { tenantId },
                    type: 'pageview',
                    createdAt: { gte: today },
                },
            }),
            // 今日新增线索
            prisma_1.default.lead.count({ where: { tenantId, createdAt: { gte: today } } }),
            // 本月商机总额
            prisma_1.default.opportunity.aggregate({
                where: { tenantId, createdAt: { gte: monthStart }, stage: { not: 'lost' } },
                _sum: { amount: true },
                _count: true,
            }),
            // 本月成交订单
            prisma_1.default.order.count({ where: { tenantId, status: 'paid', paidAt: { gte: monthStart } } }),
            // 总客户数
            prisma_1.default.customer.count({ where: { tenantId } }),
            // 总线索数
            prisma_1.default.lead.count({ where: { tenantId } }),
            // 总页面访问次数
            prisma_1.default.visitorBehavior.count({
                where: {
                    visitor: { tenantId },
                    type: 'pageview',
                },
            }),
            // 线索来源分布
            prisma_1.default.lead.groupBy({
                by: ['source'],
                where: { tenantId },
                _count: { source: true },
            }),
            // 最新线索
            prisma_1.default.lead.findMany({
                where: { tenantId },
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: { id: true, name: true, company: true, source: true, status: true, createdAt: true },
            }),
            // 内容统计
            prisma_1.default.article.aggregate({
                where: { tenantId },
                _sum: { viewCount: true, leadCount: true },
                _count: true,
            }),
            // 商品统计
            prisma_1.default.product.count({ where: { tenantId, status: 'active' } }),
        ]);
        (0, response_1.success)(res, {
            overview: {
                todayVisitors,
                todayPageViews,
                todayLeads,
                monthOpportunityAmount: monthOpportunities._sum.amount || 0,
                monthOpportunityCount: monthOpportunities._count || 0,
                monthWonOrders,
                totalCustomers,
                totalLeads,
                totalPageViews,
                totalArticles: articles._count,
                totalArticleViews: articles._sum.viewCount || 0,
                totalArticleLeads: articles._sum.leadCount || 0,
                activeProducts: products,
            },
            leadsBySource: leadsBySource.map((item) => ({
                source: item.source,
                count: item._count.source,
            })),
            recentLeads,
        });
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
// 获取漏斗数据
router.get('/dashboard/funnel', async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const [visitors, totalVisits, leads, opportunities, following, won] = await Promise.all([
            prisma_1.default.visitor.count({ where: { tenantId } }),
            prisma_1.default.visitorBehavior.count({
                where: { visitor: { tenantId }, type: 'pageview' },
            }),
            prisma_1.default.lead.count({ where: { tenantId } }),
            prisma_1.default.opportunity.count({ where: { tenantId } }),
            prisma_1.default.lead.count({ where: { tenantId, status: { in: ['following', 'qualified'] } } }),
            prisma_1.default.lead.count({ where: { tenantId, status: 'won' } }),
        ]);
        (0, response_1.success)(res, {
            funnel: [
                { stage: '全站访客', count: visitors },
                { stage: '总访问量', count: totalVisits },
                { stage: '产生线索', count: leads },
                { stage: '商机客户', count: opportunities },
                { stage: '报价跟进', count: following },
                { stage: '成交', count: won },
            ],
        });
    }
    catch (error) {
        (0, response_1.fail)(res, error.message);
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map