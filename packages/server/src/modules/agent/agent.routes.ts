import { Router, Request, Response } from 'express';
import axios from 'axios';
import prisma from '../../common/prisma';
import { authMiddleware, authorizeRole } from '../../middleware/auth';
import { success, fail } from '../../common/response';

const router = Router();
router.use(authMiddleware);

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';

// Coze API 配置
const COZE_TOKEN = process.env.COZE_TOKEN || 'pat_GW8sEJIj5DBFm5aG8rdAR8R8L2cUg3QJIxZOw1hdOW2DUIORs1Z60iFeeYc4vy71';
const COZE_BOT_ID = process.env.COZE_BOT_ID || '7672271561340092710';
const COZE_BASE_URL = 'https://api.coze.cn';

// System prompt for the AI advisor
const SYSTEM_PROMPT = `你是 ST-LTD 营销枢纽系统的 AI 智囊顾问。你的职责是：

1. **商机线索分析**：分析客户线索数据，识别高质量线索，提供跟进建议
2. **营销策略建议**：基于业务数据，为运营团队提供推广和营销方案
3. **内容策划**：根据客户画像和市场趋势，建议内容创作方向
4. **数据洞察**：解读业务数据，发现增长机会和优化空间
5. **方案生成**：针对具体场景生成可执行的营销方案

回答要求：
- 基于提供的业务数据进行分析，不要凭空编造数据
- 给出具体、可执行的建议，避免泛泛而谈
- 使用中文回答，语言简洁专业
- 如果数据不足以得出结论，主动询问更多信息
- 适当使用列表、分点等格式让建议更清晰`;

// Collect business data snapshot as context
async function collectBusinessContext(tenantId: string): Promise<string> {
  try {
    const [
      leadCount, recentLeads, customerCount, recentCustomers,
      articleCount, contentStats, opportunityCount, recentOpportunities,
      trackingLinks, qrCodes
    ] = await Promise.all([
      prisma.lead.count({ where: { tenantId } }),
      prisma.lead.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 5, select: { name: true, source: true, status: true, createdAt: true } }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.customer.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 5, select: { name: true, industry: true, stage: true, createdAt: true } }),
      prisma.article.count({ where: { tenantId } }),
      prisma.article.groupBy({ by: ['type'], where: { tenantId }, _count: true }),
      prisma.opportunity.count({ where: { tenantId } }),
      prisma.opportunity.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 5, select: { title: true, stage: true, amount: true, createdAt: true } }),
      prisma.trackingLink.count(),
      prisma.qrCode.count({ where: { tenantId } }),
    ]);

    const leadStatusBreakdown = await prisma.lead.groupBy({
      by: ['status'], where: { tenantId }, _count: true,
    });

    const oppStageBreakdown = await prisma.opportunity.groupBy({
      by: ['stage'], where: { tenantId }, _count: true,
    });

    let context = `## 当前业务数据概览\n\n`;
    context += `### 线索数据\n`;
    context += `- 总线索数: ${leadCount}\n`;
    context += `- 线索状态分布: ${leadStatusBreakdown.map(s => `${s.status}(${s._count})`).join(', ') || '无'}\n`;
    context += `- 最近线索: ${recentLeads.map(l => `${l.name}[${l.source}/${l.status}]`).join(', ') || '无'}\n\n`;

    context += `### 客户数据\n`;
    context += `- 总客户数: ${customerCount}\n`;
    context += `- 最近客户: ${recentCustomers.map(c => `${c.name}[${c.industry || '未知'}/${c.stage}]`).join(', ') || '无'}\n\n`;

    context += `### 内容数据\n`;
    context += `- 总内容数: ${articleCount}\n`;
    context += `- 内容类型: ${contentStats.map(s => `${s.type}(${s._count})`).join(', ') || '无'}\n\n`;

    context += `### 商机数据\n`;
    context += `- 总商机数: ${opportunityCount}\n`;
    context += `- 商机阶段: ${oppStageBreakdown.map(s => `${s.stage}(${s._count})`).join(', ') || '无'}\n`;
    context += `- 最近商机: ${recentOpportunities.map(o => `${o.title}[${o.stage}/${o.amount || 0}]`).join(', ') || '无'}\n\n`;

    context += `### 推广数据\n`;
    context += `- 追踪链接数: ${trackingLinks}\n`;
    context += `- 二维码数: ${qrCodes}\n`;

    return context;
  } catch (error) {
    console.error('收集业务上下文失败:', error);
    return '业务数据暂时无法获取，请基于用户描述进行分析。';
  }
}

// ===== 对话管理 =====

// 获取对话列表
router.get('/conversations', authorizeRole(['admin']), async (req: Request, res: Response) => {
  try {
    const conversations = await prisma.agentConversation.findMany({
      where: { tenantId: req.user!.tenantId, userId: req.user!.userId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { messages: true } } },
    });
    success(res, conversations);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 获取对话详情（含消息历史）
router.get('/conversations/:id', authorizeRole(['admin']), async (req: Request, res: Response) => {
  try {
    const conversation = await prisma.agentConversation.findFirst({
      where: { id: req.params.id, tenantId: req.user!.tenantId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation) return fail(res, '对话不存在');
    success(res, conversation);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 删除对话
router.delete('/conversations/:id', authorizeRole(['admin']), async (req: Request, res: Response) => {
  try {
    await prisma.agentMessage.deleteMany({ where: { conversationId: req.params.id } });
    await prisma.agentConversation.delete({
      where: { id: req.params.id, tenantId: req.user!.tenantId },
    });
    success(res, null, '对话已删除');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ===== AI 对话 =====

// 发送消息并获取 AI 回复
router.post('/chat', authorizeRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { message, conversationId } = req.body;
    if (!message) return fail(res, '请输入消息内容');

    if (!COZE_TOKEN) {
      return fail(res, 'AI 服务未配置，请联系管理员设置 COZE_TOKEN');
    }

    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;

    // 获取或创建对话
    let conversation;
    if (conversationId) {
      conversation = await prisma.agentConversation.findFirst({
        where: { id: conversationId, tenantId },
      });
    }
    if (!conversation) {
      conversation = await prisma.agentConversation.create({
        data: {
          tenantId, userId,
          title: message.slice(0, 30) + (message.length > 30 ? '...' : ''),
        },
      });
    }

    // 保存用户消息
    await prisma.agentMessage.create({
      data: { conversationId: conversation.id, role: 'user', content: message },
    });

    // 收集业务数据上下文
    const businessContext = await collectBusinessContext(tenantId);

    // 获取历史消息（最近 20 条）
    const historyMessages = await prisma.agentMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    // 构建消息列表
    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT + '\n\n' + businessContext },
      ...historyMessages.map(m => ({ role: m.role, content: m.content })),
    ];

    // 调用 Coze API
    const aiResponse = await axios.post(
      `${COZE_BASE_URL}/v3/chat`,
      {
        bot_id: COZE_BOT_ID,
        user_id: userId,
        stream: false,
        auto_save_history: true,
        additional_messages: messages.map(m => ({
          role: m.role,
          content: m.content,
          content_type: 'text',
        })),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${COZE_TOKEN}`,
        },
        timeout: 60000,
      }
    );

    // 解析 Coze 响应
    const reply = aiResponse.data?.messages?.[0]?.content || 
                  aiResponse.data?.data?.[0]?.content ||
                  '抱歉，我暂时无法回答这个问题。';
    const tokenCount = aiResponse.data?.usage?.token_count || 0;

    // 保存 AI 回复
    await prisma.agentMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: reply,
        contextData: businessContext,
        tokenCount,
      },
    });

    // 更新对话时间
    await prisma.agentConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    success(res, {
      conversationId: conversation.id,
      reply,
      tokenCount,
    }, 'AI 回复成功');
  } catch (error: any) {
    console.error('AI 对话错误:', error.response?.data || error.message);
    if (error.code === 'ECONNABORTED') {
      return fail(res, 'AI 响应超时，请稍后重试');
    }
    fail(res, error.response?.data?.error?.message || error.message || 'AI 服务异常');
  }
});

// 流式对话（SSE）
router.post('/chat/stream', authorizeRole(['admin']), async (req: Request, res: Response) => {
  try {
    const { message, conversationId } = req.body;
    if (!message) return fail(res, '请输入消息内容');

    if (!DEEPSEEK_API_KEY) {
      return fail(res, 'AI 服务未配置');
    }

    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;

    let conversation;
    if (conversationId) {
      conversation = await prisma.agentConversation.findFirst({
        where: { id: conversationId, tenantId },
      });
    }
    if (!conversation) {
      conversation = await prisma.agentConversation.create({
        data: {
          tenantId, userId,
          title: message.slice(0, 30) + (message.length > 30 ? '...' : ''),
        },
      });
    }

    await prisma.agentMessage.create({
      data: { conversationId: conversation.id, role: 'user', content: message },
    });

    const businessContext = await collectBusinessContext(tenantId);

    const historyMessages = await prisma.agentMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT + '\n\n' + businessContext },
      ...historyMessages.map(m => ({ role: m.role, content: m.content })),
    ];

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const response = await axios.post(
      `${DEEPSEEK_BASE_URL}/chat/completions`,
      {
        model: 'deepseek-chat',
        messages,
        max_tokens: 4000,
        temperature: 0.7,
        stream: true,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        responseType: 'stream',
        timeout: 120000,
      }
    );

    let fullContent = '';

    response.data.on('data', (chunk: Buffer) => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
            res.end();
            // Save full response
            prisma.agentMessage.create({
              data: {
                conversationId: conversation!.id,
                role: 'assistant',
                content: fullContent,
                contextData: businessContext,
              },
            }).catch(console.error);
            prisma.agentConversation.update({
              where: { id: conversation!.id },
              data: { updatedAt: new Date() },
            }).catch(console.error);
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
            }
          } catch { /* ignore parse errors */ }
        }
      }
    });

    response.data.on('error', (err: Error) => {
      console.error('Stream error:', err);
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });

  } catch (error: any) {
    console.error('AI stream error:', error.message);
    if (!res.headersSent) {
      fail(res, error.message);
    } else {
      res.end();
    }
  }
});

// ===== 嵌入式 AI 能力接口 =====

// SEO 智能分析
router.post('/seo-analyze', async (req: Request, res: Response) => {
  try {
    const { siteName, domain, seoTitle, seoDesc, seoKeywords, pages } = req.body;
    if (!DEEPSEEK_API_KEY) return fail(res, 'AI 服务未配置');

    const prompt = `你是一个专业的 SEO 优化专家。请分析以下站点/页面的 SEO 状况，并给出具体优化建议。

## 站点信息
- 站点名称: ${siteName || '未设置'}
- 域名: ${domain || '未设置'}
- SEO标题: ${seoTitle || '未设置'}
- SEO描述: ${seoDesc || '未设置'}
- SEO关键词: ${seoKeywords || '未设置'}
- 页面数量: ${pages?.length || 0}

${pages?.length ? '## 页面列表\n' + pages.map((p: any, i: number) => `${i + 1}. ${p.title || p.name} - slug: ${p.slug}`).join('\n') : ''}

请从以下维度分析并给出建议：
1. **标题优化**：SEO标题是否合理，建议修改方案
2. **描述优化**：Meta描述是否吸引人，建议修改方案
3. **关键词建议**：推荐适合的高频搜索关键词
4. **内容策略**：针对该站点类型的内容发布建议
5. **技术SEO**：sitemap、robots、结构化数据等方面的建议

请用中文回答，给出具体可执行的修改建议，不要泛泛而谈。`;

    const response = await axios.post(
      `${DEEPSEEK_BASE_URL}/chat/completions`,
      { model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], max_tokens: 2000, temperature: 0.7 },
      { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` }, timeout: 60000 }
    );

    const reply = response.data?.choices?.[0]?.message?.content || '';
    success(res, { suggestion: reply });
  } catch (error: any) {
    console.error('SEO AI分析错误:', error.message);
    fail(res, 'AI 分析失败，请稍后重试');
  }
});

// 内容智能扩写
router.post('/content-expand', async (req: Request, res: Response) => {
  try {
    const { content, title, mode } = req.body;
    if (!content && !title) return fail(res, '请提供内容或标题');
    if (!DEEPSEEK_API_KEY) return fail(res, 'AI 服务未配置');

    const modeConfig: Record<string, string> = {
      expand: '请对以下内容进行扩写，丰富细节、增加论据和案例，使内容更加充实饱满。保持原有核心观点不变，增加深度和广度。',
      rewrite: '请对以下内容进行改写优化，提升文字质量、可读性和专业度，使表达更加精准有力。',
      summary: '请对以下内容进行精炼总结，提取核心要点，生成简洁的摘要。',
      seo: '请对以下内容进行SEO优化改写，增加关键词密度、优化标题结构、改善可读性，使其更适合搜索引擎收录。',
    };

    const instruction = modeConfig[mode || 'expand'] || modeConfig.expand;

    const prompt = `你是一个专业的内容创作专家。${instruction}

${title ? `文章标题：${title}\n\n` : ''}原文内容：
${content || '（无内容）'}

要求：
1. 保持中文输出
2. 内容专业、有深度
3. 结构清晰，段落分明
4. 直接输出修改后的内容，不要加任何说明或前缀`;

    const response = await axios.post(
      `${DEEPSEEK_BASE_URL}/chat/completions`,
      { model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], max_tokens: 3000, temperature: 0.8 },
      { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` }, timeout: 60000 }
    );

    const reply = response.data?.choices?.[0]?.message?.content || '';
    success(res, { expanded: reply });
  } catch (error: any) {
    console.error('内容扩写错误:', error.message);
    fail(res, 'AI 扩写失败，请稍后重试');
  }
});

export default router;
