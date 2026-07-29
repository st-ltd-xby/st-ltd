import { Router, Request, Response } from 'express';
import prisma from '../../common/prisma';
import { success, successWithPagination, fail, notFound } from '../../common/response';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
router.use(authMiddleware);

// ===== 线索管理 =====

router.get('/leads', async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '20', status, source, keyword } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const where: any = { tenantId: req.user!.tenantId };
    if (status) where.status = status;
    if (source) where.source = source;
    if (keyword) {
      where.OR = [
        { name: { contains: String(keyword), mode: 'insensitive' } },
        { company: { contains: String(keyword), mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where, skip, take: Number(pageSize),
        include: { assignee: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.lead.count({ where }),
    ]);

    successWithPagination(res, leads, { page: Number(page), pageSize: Number(pageSize), total });
  } catch (error: any) {
    fail(res, error.message);
  }
});

router.post('/leads', async (req: Request, res: Response) => {
  try {
    const { name, phone, email, company, position, source, priority, tags, note } = req.body;
    const lead = await prisma.lead.create({
      data: { tenantId: req.user!.tenantId, name, phone, email, company, position, source: source || 'manual', priority, tags, note },
    });
    success(res, lead, '线索创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

router.get('/leads/:id', async (req: Request, res: Response) => {
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: req.params.id, tenantId: req.user!.tenantId },
      include: { assignee: { select: { id: true, name: true } }, followUps: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } } },
    });
    if (!lead) return notFound(res, '线索不存在');
    success(res, lead);
  } catch (error: any) {
    fail(res, error.message);
  }
});

router.put('/leads/:id', async (req: Request, res: Response) => {
  try {
    const { name, phone, email, company, position, status, priority, tags, note, assigneeId } = req.body;
    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data: { name, phone, email, company, position, status, priority, tags, note, assigneeId, convertedAt: status === 'won' ? new Date() : undefined },
    });
    success(res, lead, '线索更新成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

router.delete('/leads/:id', async (req: Request, res: Response) => {
  try {
    await prisma.lead.delete({ where: { id: req.params.id } });
    success(res, null, '线索删除成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 分配线索
router.post('/leads/:id/assign', async (req: Request, res: Response) => {
  try {
    const { assigneeId } = req.body;
    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data: { assigneeId, status: 'following' },
    });
    success(res, lead, '线索分配成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ===== 客户管理 =====

router.get('/customers', async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '20', level, stage, keyword } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const where: any = { tenantId: req.user!.tenantId };
    if (level) where.level = level;
    if (stage) where.stage = stage;
    if (keyword) {
      where.OR = [
        { name: { contains: String(keyword), mode: 'insensitive' } },
        { contactName: { contains: String(keyword), mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({ where, skip, take: Number(pageSize), include: { _count: { select: { contacts: true, opportunities: true } } }, orderBy: { updatedAt: 'desc' } }),
      prisma.customer.count({ where }),
    ]);

    successWithPagination(res, customers, { page: Number(page), pageSize: Number(pageSize), total });
  } catch (error: any) {
    fail(res, error.message);
  }
});

router.post('/customers', async (req: Request, res: Response) => {
  try {
    const { name, industry, level, contactName, contactPhone, contactEmail, address, tags, note } = req.body;
    const customer = await prisma.customer.create({
      data: { tenantId: req.user!.tenantId, name, industry, level, contactName, contactPhone, contactEmail, address, tags, note },
    });
    success(res, customer, '客户创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

router.get('/customers/:id', async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, tenantId: req.user!.tenantId },
      include: { contacts: true, opportunities: { orderBy: { createdAt: 'desc' } } },
    });
    if (!customer) return notFound(res, '客户不存在');
    success(res, customer);
  } catch (error: any) {
    fail(res, error.message);
  }
});

router.put('/customers/:id', async (req: Request, res: Response) => {
  try {
    const { name, industry, level, stage, contactName, contactPhone, contactEmail, address, tags, note } = req.body;
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: { name, industry, level, stage, contactName, contactPhone, contactEmail, address, tags, note },
    });
    success(res, customer, '客户更新成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ===== 跟进记录 =====

router.post('/leads/:leadId/follow-ups', async (req: Request, res: Response) => {
  try {
    const { type, content, nextAction, nextTime } = req.body;
    const followUp = await prisma.followUp.create({
      data: { leadId: req.params.leadId, userId: req.user!.userId, type, content, nextAction, nextTime },
    });
    success(res, followUp, '跟进记录创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ===== 商机管理 =====

router.get('/opportunities', async (req: Request, res: Response) => {
  try {
    const { stage } = req.query;
    const where: any = { tenantId: req.user!.tenantId };
    if (stage) where.stage = stage;

    const opportunities = await prisma.opportunity.findMany({
      where,
      include: { customer: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    success(res, opportunities);
  } catch (error: any) {
    fail(res, error.message);
  }
});

router.post('/opportunities', async (req: Request, res: Response) => {
  try {
    const { customerId, title, amount, stage, expectedCloseDate, note } = req.body;
    const opportunity = await prisma.opportunity.create({
      data: { customerId, tenantId: req.user!.tenantId, title, amount, stage, expectedCloseDate, note },
    });
    success(res, opportunity, '商机创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

router.put('/opportunities/:id', async (req: Request, res: Response) => {
  try {
    const { title, amount, stage, probability, note, lostReason } = req.body;
    const data: any = { title, amount, stage, probability, note };
    if (stage === 'won') data.wonAt = new Date();
    if (stage === 'lost') { data.lostAt = new Date(); data.lostReason = lostReason; }

    const opportunity = await prisma.opportunity.update({ where: { id: req.params.id }, data });
    success(res, opportunity, '商机更新成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ===== 标签管理 =====

router.get('/tags', async (req: Request, res: Response) => {
  try {
    const tags = await prisma.tag.findMany({ where: { tenantId: req.user!.tenantId } });
    success(res, tags);
  } catch (error: any) {
    fail(res, error.message);
  }
});

router.post('/tags', async (req: Request, res: Response) => {
  try {
    const { name, color, category } = req.body;
    const tag = await prisma.tag.create({
      data: { tenantId: req.user!.tenantId, name, color, category },
    });
    success(res, tag, '标签创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

export default router;
