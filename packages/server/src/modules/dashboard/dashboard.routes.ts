import { Router, Request, Response } from 'express';
import prisma from '../../common/prisma';
import { success, fail } from '../../common/response';
import { authMiddleware } from '../../middleware/auth';

const router: Router = Router();
router.use(authMiddleware);

// 获取数据看板统计
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      todayVisitors,
      todayPageViews,
      todayLeads,
      monthOpportunities,
      monthWonOrders,
      totalCustomers,
      totalLeads,
      totalPageViews,
      leadsBySource,
      recentLeads,
      articles,
      products,
    ] = await Promise.all([
      // 今日独立访客数
      prisma.visitor.count({ where: { tenantId, lastVisitAt: { gte: today } } }),
      // 今日页面访问次数（每次打开/刷新+1）
      prisma.visitorBehavior.count({
        where: {
          visitor: { tenantId },
          type: 'pageview',
          createdAt: { gte: today },
        },
      }),
      // 今日新增线索
      prisma.lead.count({ where: { tenantId, createdAt: { gte: today } } }),
      // 本月商机总额
      prisma.opportunity.aggregate({
        where: { tenantId, createdAt: { gte: monthStart }, stage: { not: 'lost' } },
        _sum: { amount: true },
        _count: true,
      }),
      // 本月成交订单
      prisma.order.count({ where: { tenantId, status: 'paid', paidAt: { gte: monthStart } } }),
      // 总客户数
      prisma.customer.count({ where: { tenantId } }),
      // 总线索数
      prisma.lead.count({ where: { tenantId } }),
      // 总页面访问次数
      prisma.visitorBehavior.count({
        where: {
          visitor: { tenantId },
          type: 'pageview',
        },
      }),
      // 线索来源分布
      prisma.lead.groupBy({
        by: ['source'],
        where: { tenantId },
        _count: { source: true },
      }),
      // 最新线索
      prisma.lead.findMany({
        where: { tenantId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, company: true, source: true, status: true, createdAt: true },
      }),
      // 内容统计
      prisma.article.aggregate({
        where: { tenantId },
        _sum: { viewCount: true, leadCount: true },
        _count: true,
      }),
      // 商品统计
      prisma.product.count({ where: { tenantId, status: 'active' } }),
    ]);

    success(res, {
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
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 获取漏斗数据
router.get('/dashboard/funnel', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const [visitors, totalVisits, leads, opportunities, following, won] = await Promise.all([
      prisma.visitor.count({ where: { tenantId } }),
      prisma.visitorBehavior.count({
        where: { visitor: { tenantId }, type: 'pageview' },
      }),
      prisma.lead.count({ where: { tenantId } }),
      prisma.opportunity.count({ where: { tenantId } }),
      prisma.lead.count({ where: { tenantId, status: { in: ['following', 'qualified'] } } }),
      prisma.lead.count({ where: { tenantId, status: 'won' } }),
    ]);

    success(res, {
      funnel: [
        { stage: '全站访客', count: visitors },
        { stage: '总访问量', count: totalVisits },
        { stage: '产生线索', count: leads },
        { stage: '商机客户', count: opportunities },
        { stage: '报价跟进', count: following },
        { stage: '成交', count: won },
      ],
    });
  } catch (error: any) {
    fail(res, error.message);
  }
});

export default router;
