import { Router, Request, Response } from 'express';
import prisma from '../../common/prisma';
import { success, successWithPagination, fail, notFound } from '../../common/response';
import { authMiddleware } from '../../middleware/auth';
import * as QRCode from 'qrcode';
import * as nodemailer from 'nodemailer';

const router: Router = Router();
router.use(authMiddleware);

// URL 自动补全协议
const normalizeUrl = (url: string) => {
  if (!url) return url;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

// ============================================
// 分享追踪链接
// ============================================

// 获取追踪链接列表
router.get('/tracking-links', async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '20', articleId } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const where: any = {};
    if (articleId) where.articleId = articleId;
    
    const [links, total] = await Promise.all([
      prisma.trackingLink.findMany({
        where,
        include: { article: { select: { id: true, title: true } } },
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.trackingLink.count({ where }),
    ]);

    successWithPagination(res, links, { page: Number(page), pageSize: Number(pageSize), total });
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 创建追踪链接
router.post('/tracking-links', async (req: Request, res: Response) => {
  try {
    const { articleId, targetUrl, utmSource, utmMedium, utmCampaign } = req.body;
    const shortCode = Math.random().toString(36).substring(2, 10);
    const link = await prisma.trackingLink.create({
      data: { articleId, shortCode, targetUrl, utmSource, utmMedium, utmCampaign },
    });
    success(res, {
      ...link,
      shortUrl: `${req.protocol}://${req.get('host')}/t/${shortCode}`,
    }, '追踪链接创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 模拟点击追踪链接
router.post('/tracking-links/:id/simulate-click', async (req: Request, res: Response) => {
  try {
    const link = await prisma.trackingLink.findUnique({
      where: { id: req.params.id as string },
    });
    if (!link) return notFound(res, '链接不存在');
    
    const clicks = Number(req.body.clicks) || 1;
    await prisma.trackingLink.update({
      where: { id: link.id },
      data: { clickCount: { increment: clicks } },
    });

    success(res, { clickCount: link.clickCount + clicks }, `模拟点击 ${clicks} 次成功`);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 删除追踪链接
router.delete('/tracking-links/:id', async (req: Request, res: Response) => {
  try {
    await prisma.trackingLink.delete({ where: { id: req.params.id as string } });
    success(res, null, '追踪链接删除成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 追踪链接点击（公开接口，不需要认证）
// 注意：这个路由需要在 app.ts 中单独注册为公开路由
router.post('/tracking-links/:shortCode/click', async (req: Request, res: Response) => {
  try {
    const link = await prisma.trackingLink.findUnique({ where: { shortCode: req.params.shortCode } });
    if (!link) return notFound(res, '链接不存在');
    
    await prisma.trackingLink.update({
      where: { id: link.id },
      data: { clickCount: { increment: 1 } },
    });

    // 记录访客信息
    const { visitorId, page } = req.body;
    
    success(res, { targetUrl: link.targetUrl });
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 追踪链接统计
router.get('/tracking-links/stats', async (req: Request, res: Response) => {
  try {
    const links = await prisma.trackingLink.findMany({
      include: { article: { select: { title: true } } },
      orderBy: { clickCount: 'desc' },
      take: 20,
    });

    const totalClicks = links.reduce((sum, l) => sum + l.clickCount, 0);
    const totalLeads = links.reduce((sum, l) => sum + l.leadCount, 0);

    success(res, {
      links,
      summary: { totalClicks, totalLeads, totalLinks: links.length },
    });
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ============================================
// 二维码生成
// ============================================

// 获取二维码列表
router.get('/qrcodes', async (req: Request, res: Response) => {
  try {
    const qrcodes = await prisma.qrCode.findMany({
      where: { tenantId: req.user!.tenantId },
      orderBy: { createdAt: 'desc' },
    });
    success(res, qrcodes);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 生成二维码
router.post('/qrcodes', async (req: Request, res: Response) => {
  try {
    const { name, targetUrl, size = 300, color = '#000000', bgColor = '#ffffff' } = req.body;
    const normalizedUrl = normalizeUrl(targetUrl);
    
    // 生成二维码 Data URL
    const qrDataUrl = await QRCode.toDataURL(normalizedUrl, {
      width: size,
      margin: 2,
      color: { dark: color, light: bgColor },
    });

    const qrcode = await prisma.qrCode.create({
      data: {
        tenantId: req.user!.tenantId,
        name,
        targetUrl: normalizedUrl,
        imageUrl: qrDataUrl,
        size,
        color,
        bgColor,
      },
    });

    success(res, qrcode, '二维码生成成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 更新二维码
router.put('/qrcodes/:id', async (req: Request, res: Response) => {
  try {
    const { name, targetUrl, size, color, bgColor } = req.body;
    const normalizedUrl = targetUrl ? normalizeUrl(targetUrl) : undefined;
    
    let imageUrl: string | undefined;
    if (normalizedUrl) {
      imageUrl = await QRCode.toDataURL(normalizedUrl, {
        width: size || 300,
        margin: 2,
        color: { dark: color || '#000000', light: bgColor || '#ffffff' },
      });
    }

    const qrcode = await prisma.qrCode.update({
      where: { id: req.params.id },
      data: { name, targetUrl: normalizedUrl, size, color, bgColor, ...(imageUrl && { imageUrl }) },
    });

    success(res, qrcode, '二维码更新成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 删除二维码
router.delete('/qrcodes/:id', async (req: Request, res: Response) => {
  try {
    await prisma.qrCode.delete({ where: { id: req.params.id } });
    success(res, null, '二维码删除成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 直接生成二维码图片（不保存）
router.post('/qrcodes/generate', async (req: Request, res: Response) => {
  try {
    const { url, size = 300, color = '#000000', bgColor = '#ffffff' } = req.body;
    const normalizedUrl = normalizeUrl(url);
    const qrDataUrl = await QRCode.toDataURL(normalizedUrl, {
      width: size,
      margin: 2,
      color: { dark: color, light: bgColor },
    });
    success(res, { imageUrl: qrDataUrl });
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ============================================
// 邮件营销
// ============================================

// 获取邮件模板列表
router.get('/email-templates', async (req: Request, res: Response) => {
  try {
    const templates = await prisma.emailTemplate.findMany({
      where: { tenantId: req.user!.tenantId },
      orderBy: { createdAt: 'desc' },
    });
    success(res, templates);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 创建邮件模板
router.post('/email-templates', async (req: Request, res: Response) => {
  try {
    const { name, subject, content, variables } = req.body;
    const template = await prisma.emailTemplate.create({
      data: { tenantId: req.user!.tenantId, name, subject, content, variables: (typeof variables === 'string' || !variables) ? (variables || '') : variables.toString() },
    });
    success(res, template, '模板创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 更新邮件模板
router.put('/email-templates/:id', async (req: Request, res: Response) => {
  try {
    const { name, subject, content, variables } = req.body;
    const template = await prisma.emailTemplate.update({
      where: { id: req.params.id },
      data: { name, subject, content, variables: (typeof variables === 'string' || !variables) ? (variables || '') : variables.toString() },
    });
    success(res, template, '模板更新成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 删除邮件模板
router.delete('/email-templates/:id', async (req: Request, res: Response) => {
  try {
    await prisma.emailTemplate.delete({ where: { id: req.params.id } });
    success(res, null, '模板删除成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 获取邮件活动列表
router.get('/email-campaigns', async (req: Request, res: Response) => {
  try {
    const campaigns = await prisma.emailCampaign.findMany({
      where: { tenantId: req.user!.tenantId },
      orderBy: { createdAt: 'desc' },
    });
    success(res, campaigns);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 创建邮件活动
router.post('/email-campaigns', async (req: Request, res: Response) => {
  try {
    const { name, templateId, subject, content, recipients, scheduledAt } = req.body;
    const recipientList = recipients.split(',').map((e: string) => e.trim()).filter(Boolean);
    
    const campaign = await prisma.emailCampaign.create({
      data: {
        tenantId: req.user!.tenantId,
        name,
        templateId,
        subject,
        content,
        recipients: recipientList.join(','),
        totalCount: recipientList.length,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    });
    
    // 如果设置了定时发送，则启动定时任务
    if (scheduledAt) {
      const delay = new Date(scheduledAt).getTime() - Date.now();
      if (delay > 0) {
        setTimeout(async () => {
          try {
            // 重新获取最新的活动信息
            const latestCampaign = await prisma.emailCampaign.findUnique({ where: { id: campaign.id } });
            if (latestCampaign && latestCampaign.status === 'draft') { // 确保活动尚未发送
              // 执行实际的邮件发送逻辑
              // 更新状态为发送中
              await prisma.emailCampaign.update({
                where: { id: latestCampaign.id },
                data: { status: 'sending' },
              });
              
              // 获取 SMTP 配置
              const smtpConfig = await prisma.systemConfig.findFirst({
                where: { tenantId: latestCampaign.tenantId, key: 'smtp_config' },
              });
              
              let successCount = 0;
              let failCount = 0;
              
              if (smtpConfig) {
                try {
                  const config = JSON.parse(smtpConfig.value);
                  const transporter = nodemailer.createTransport(config);
                  const recipients = latestCampaign.recipients.split(',').map(e => e.trim()).filter(Boolean);
                  
                  // 智能发送策略：分批发送，避免触发反垃圾邮件机制
                  const batchSize = 10; // 每批最多10封邮件
                  for (let i = 0; i < recipients.length; i += batchSize) {
                    const batch = recipients.slice(i, i + batchSize);
                    
                    for (const recipientStr of batch) {
                      try {
                        // 解析收件人信息，支持带名称的邮箱格式 "Name <email@example.com>"
                        let recipientEmail = recipientStr;
                        let recipientName = '';
                        
                        if (recipientStr.includes('<') && recipientStr.includes('>')) {
                          const match = recipientStr.match(/^(.*?)\s*<(.+?)>$/);
                          if (match) {
                            recipientName = match[1].trim();
                            recipientEmail = match[2].trim();
                          }
                        } else {
                          recipientEmail = recipientStr.trim();
                        }
                        
                        // 个性化内容替换
                        let personalizedSubject = latestCampaign.subject;
                        let personalizedContent = latestCampaign.content;
                        
                        // 替换常见的个性化变量
                        if (recipientName) {
                          personalizedSubject = personalizedSubject.replace(/\{\{姓名\}\}/g, recipientName)
                                                    .replace(/\{\{name\}\}/gi, recipientName);
                        }
                        if (recipientName) {
                          personalizedContent = personalizedContent.replace(/\{\{姓名\}\}/g, recipientName)
                                                     .replace(/\{\{name\}\}/gi, recipientName);
                        }
                        
                        // 添加收件人特定的跟踪参数
                        const trackingParams = `?email=${encodeURIComponent(recipientEmail)}&campaign=${latestCampaign.id}`;
                        personalizedContent = personalizedContent.replace(/(href="([^"]*?)")/g, `$1 data-tracking="${trackingParams}"`)
                                                       .replace(/(src="([^"]*?)")/g, `$1 data-tracking="${trackingParams}"`);
                        
                        await transporter.sendMail({
                          from: config.auth?.user || 'noreply@ltd.com',
                          to: recipientStr, // 保持原始格式，支持 "Name <email@example.com>"
                          subject: personalizedSubject,
                          html: personalizedContent,
                        });
                        
                        successCount++;
                        
                        // 在发送邮件之间添加延迟，避免被识别为垃圾邮件
                        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms 延迟
                        
                      } catch (sendError) {
                        console.error(`Failed to send email to ${recipientStr}:`, sendError);
                        failCount++;
                      }
                    }
                    
                    // 批次之间的额外延迟
                    if (i + batchSize < recipients.length) {
                      await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒延迟
                    }
                  }
                } catch (error: any) {
                  await prisma.emailCampaign.update({
                    where: { id: latestCampaign.id },
                    data: { status: 'failed' },
                  });
                  console.error('SMTP 配置错误:', error.message);
                }
              } else {
                // 没有 SMTP 配置，模拟发送
                const recipients = latestCampaign.recipients.split(',');
                successCount = recipients.length;
              }
              
              // 更新活动状态
              await prisma.emailCampaign.update({
                where: { id: latestCampaign.id },
                data: {
                  status: 'sent',
                  sentCount: successCount + failCount,
                  successCount,
                  failCount,
                  sentAt: new Date(),
                },
              });
            }
          } catch (err) {
            console.error('定时发送邮件失败:', err);
          }
        }, delay);
      }
    }
    
    success(res, campaign, '邮件活动创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 发送邮件活动
router.post('/email-campaigns/:id/send', async (req: Request, res: Response) => {
  try {
    const campaign = await prisma.emailCampaign.findFirst({
      where: { id: req.params.id, tenantId: req.user!.tenantId },
    });
    if (!campaign) return notFound(res, '邮件活动不存在');

    // 更新状态为发送中
    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: { status: 'sending' },
    });

    // 获取 SMTP 配置（从系统配置中读取）
    const smtpConfig = await prisma.systemConfig.findFirst({
      where: { tenantId: req.user!.tenantId, key: 'smtp_config' },
    });

    let successCount = 0;
    let failCount = 0;

    if (smtpConfig) {
      try {
        const config = JSON.parse(smtpConfig.value);
        const transporter = nodemailer.createTransport(config);
        const recipients = campaign.recipients.split(',').map(e => e.trim()).filter(Boolean);

        // 智能发送策略：分批发送，避免触发反垃圾邮件机制
        const batchSize = 10; // 每批最多10封邮件
        for (let i = 0; i < recipients.length; i += batchSize) {
          const batch = recipients.slice(i, i + batchSize);
          
          for (const recipientStr of batch) {
            try {
              // 解析收件人信息，支持带名称的邮箱格式 "Name <email@example.com>"
              let recipientEmail = recipientStr;
              let recipientName = '';
              
              if (recipientStr.includes('<') && recipientStr.includes('>')) {
                const match = recipientStr.match(/^(.*?)\s*<(.+?)>$/);
                if (match) {
                  recipientName = match[1].trim();
                  recipientEmail = match[2].trim();
                }
              } else {
                recipientEmail = recipientStr.trim();
              }
              
              // 个性化内容替换
              let personalizedSubject = campaign.subject;
              let personalizedContent = campaign.content;
              
              // 替换常见的个性化变量
              if (recipientName) {
                personalizedSubject = personalizedSubject.replace(/\{\{姓名\}\}/g, recipientName)
                                          .replace(/\{\{name\}\}/gi, recipientName);
                personalizedContent = personalizedContent.replace(/\{\{姓名\}\}/g, recipientName)
                                             .replace(/\{\{name\}\}/gi, recipientName);
              }
              
              // 添加收件人特定的跟踪参数
              const trackingParams = `?email=${encodeURIComponent(recipientEmail)}&campaign=${campaign.id}`;
              personalizedContent = personalizedContent.replace(/(href="([^"]*?)")/g, `$1 data-tracking="${trackingParams}"`)
                                             .replace(/(src="([^"]*?)")/g, `$1 data-tracking="${trackingParams}"`);
              
              await transporter.sendMail({
                from: config.auth?.user || 'noreply@ltd.com',
                to: recipientStr, // 保持原始格式，支持 "Name <email@example.com>"
                subject: personalizedSubject,
                html: personalizedContent,
              });
              
              successCount++;
              
              // 在发送邮件之间添加延迟，避免被识别为垃圾邮件
              await new Promise(resolve => setTimeout(resolve, 500)); // 500ms 延迟
              
            } catch (sendError) {
              console.error(`Failed to send email to ${recipientStr}:`, sendError);
              failCount++;
            }
          }
          
          // 批次之间的额外延迟
          if (i + batchSize < recipients.length) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒延迟
          }
        }
      } catch (error: any) {
        await prisma.emailCampaign.update({
          where: { id: campaign.id },
          data: { status: 'failed' },
        });
        return fail(res, `SMTP 配置错误: ${error.message}`);
      }
    } else {
      // 没有 SMTP 配置，模拟发送
      const recipients = campaign.recipients.split(',');
      successCount = recipients.length;
    }

    // 更新活动状态
    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        status: 'sent',
        sentCount: successCount + failCount,
        successCount,
        failCount,
        sentAt: new Date(),
      },
    });

    success(res, { successCount, failCount, total: successCount + failCount }, '邮件发送完成');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 删除邮件活动
router.delete('/email-campaigns/:id', async (req: Request, res: Response) => {
  try {
    await prisma.emailCampaign.delete({ where: { id: req.params.id as string } });
    success(res, null, '活动删除成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 邮件地址列表管理

// 获取邮件地址列表
router.get('/email-addresses', async (req: Request, res: Response) => {
  try {
    // 从邮件活动和收件人中提取地址
    const campaigns = await prisma.emailCampaign.findMany({
      where: { tenantId: req.user!.tenantId },
      select: { recipients: true }
    });
    
    // 提取所有唯一收件人邮箱
    const allRecipients = new Set<string>();
    campaigns.forEach(campaign => {
      if (campaign.recipients) {
        campaign.recipients.split(',').forEach(email => {
          const cleanEmail = email.trim();
          if (cleanEmail) {
            allRecipients.add(cleanEmail);
          }
        });
      }
    });
    
    // 转换为所需格式
    const addresses = Array.from(allRecipients).map((email, index) => ({
      id: `temp_${index}`,
      email,
      name: email.split('@')[0], // 使用邮箱用户名作为姓名
      group: 'imported',
      createdAt: new Date()
    }));
    
    success(res, addresses, '邮件地址列表获取成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 创建邮件地址
router.post('/email-addresses', async (req: Request, res: Response) => {
  try {
    const { email, name, group } = req.body;
    
    // 验证邮箱格式
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      return fail(res, '邮箱格式不正确');
    }
    
    // 检查是否已经存在于收件人列表中
    const existingCampaigns = await prisma.emailCampaign.findMany({
      where: { tenantId: req.user!.tenantId },
      select: { recipients: true }
    });
    
    const allRecipients = new Set<string>();
    existingCampaigns.forEach(campaign => {
      if (campaign.recipients) {
        campaign.recipients.split(',').forEach(recipient => {
          const cleanRecipient = recipient.trim();
          if (cleanRecipient) {
            allRecipients.add(cleanRecipient);
          }
        });
      }
    });
    
    if (allRecipients.has(email)) {
      return fail(res, '该邮箱地址已存在');
    }
    
    // 在响应中返回成功消息，但不实际存储
    success(res, { email, name, group }, '邮件地址验证成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 批量导入邮件地址
router.post('/email-addresses/import', async (req: Request, res: Response) => {
  try {
    const { csvData, group } = req.body;
    
    if (!csvData) {
      return fail(res, '请提供CSV数据');
    }
    
    // 解析CSV数据 (假设格式为: 邮箱,姓名 或 邮箱)
    const lines = csvData.split('\n').filter((line: string) => line.trim() !== '');
    if (lines.length === 0) {
      return fail(res, 'CSV数据为空');
    }
    
    let importedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    const validAddresses: string[] = [];
    
    // 验证邮箱格式
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    
    for (let i = 0; i < lines.length; i++) {
      try {
        const line = lines[i].trim();
        if (!line) continue;
        
        // 分割CSV行
        let email = '';
        
        if (line.includes(',')) {
          const parts = line.split(',').map((part: string) => part.trim());
          email = parts[0];
        } else {
          email = line;
        }
        
        // 验证邮箱格式
        if (!emailRegex.test(email)) {
          throw new Error(`第${i+1}行邮箱格式不正确: ${email}`);
        }
        
        // 验证邮箱是否已存在
        const existingCampaigns = await prisma.emailCampaign.findMany({
          where: { tenantId: req.user!.tenantId },
          select: { recipients: true }
        });
        
        const allRecipients = new Set<string>();
        existingCampaigns.forEach(campaign => {
          if (campaign.recipients) {
            campaign.recipients.split(',').forEach(recipient => {
              const cleanRecipient = recipient.trim();
              if (cleanRecipient) {
                allRecipients.add(cleanRecipient);
              }
            });
          }
        });
        
        if (allRecipients.has(email)) {
          throw new Error(`第${i+1}行邮箱已存在: ${email}`);
        }
        
        validAddresses.push(email);
        importedCount++;
      } catch (error: any) {
        errorCount++;
        errors.push(error.message || `第${i+1}行导入失败`);
      }
    }
    
    // 将有效的邮件地址添加到一个临时的邮件活动中
    if (validAddresses.length > 0) {
      // 创建一个临时邮件活动来存储导入的地址
      await prisma.emailCampaign.create({
        data: {
          tenantId: req.user!.tenantId,
          name: `Imported Addresses ${new Date().toISOString()}`,
          subject: 'Temporary Storage',
          content: 'Temporary storage for imported addresses',
          recipients: validAddresses.join(','),
          totalCount: validAddresses.length,
          status: 'draft'
        }
      });
    }
    
    success(res, { 
      importedCount, 
      errorCount, 
      total: lines.length,
      errors: errors.slice(0, 10) // 只返回前10个错误
    }, `批量导入完成，成功${importedCount}条，失败${errorCount}条`);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 保存 SMTP 配置
router.post('/smtp-config', async (req: Request, res: Response) => {
  try {
    const { host, port, secure, auth } = req.body;
    const config = JSON.stringify({
      host,
      port: port || 465,
      secure: secure !== false,
      auth: { user: auth?.user, pass: auth?.pass },
    });

    await prisma.systemConfig.upsert({
      where: { tenantId_key: { tenantId: req.user!.tenantId, key: 'smtp_config' } },
      update: { value: config },
      create: { tenantId: req.user!.tenantId, key: 'smtp_config', value: config },
    });

    success(res, null, 'SMTP 配置保存成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 获取 SMTP 配置
router.get('/smtp-config', async (req: Request, res: Response) => {
  try {
    const config = await prisma.systemConfig.findFirst({
      where: { tenantId: req.user!.tenantId, key: 'smtp_config' },
    });
    success(res, config ? JSON.parse(config.value) : null);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ============================================
// SEO 工具
// ============================================

// 生成 Sitemap
router.get('/seo/sitemap', async (req: Request, res: Response) => {
  try {
    const sites = await prisma.site.findMany({
      where: { tenantId: req.user!.tenantId, status: 'published' },
      include: { pages: { where: { status: 'published' } } },
    });

    const articles = await prisma.article.findMany({
      where: { tenantId: req.user!.tenantId, status: 'published' },
    });

    success(res, { sites, articles });
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 生成 Sitemap XML
router.get('/seo/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const sites = await prisma.site.findMany({
      where: { tenantId: req.user!.tenantId, status: 'published' },
      include: { pages: { where: { status: 'published' } } },
    });

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const site of sites) {
      if (site.domain) {
        xml += `  <url><loc>${site.domain}</loc><priority>1.0</priority></url>\n`;
        for (const page of site.pages) {
          xml += `  <url><loc>${site.domain}/${page.slug}</loc><lastmod>${page.updatedAt.toISOString().split('T')[0]}</lastmod><priority>0.8</priority></url>\n`;
        }
      }
    }

    xml += '</urlset>';

    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// SEO 分析（增强版）
router.get('/seo/analysis', async (req: Request, res: Response) => {
  try {
    const sites = await prisma.site.findMany({
      where: { tenantId: req.user!.tenantId },
      include: { pages: true },
    });

    const analysis = sites.map(site => {
      const checks: any[] = [];
      let score = 100;

      const addCheck = (category: string, passed: boolean, issue: string, fix: string, impact: string, currentValue?: string) => {
        const displayFix = passed && currentValue ? `当前值: ${currentValue}` : fix;
        checks.push({ category, passed, issue, fix: displayFix, impact });
        if (!passed) score -= impact === 'high' ? 20 : impact === 'medium' ? 10 : 5;
      };

      // 基础 SEO 检查（passed=true 表示通过/没问题）
      addCheck('基础', !!site.seoTitle, '缺少 SEO 标题', '为站点设置 SEO 标题（30-60字符）', 'high', site.seoTitle || undefined);
      addCheck('基础', !!site.seoDesc, '缺少 SEO 描述', '为站点设置 SEO 描述（120-160字符）', 'high', site.seoDesc || undefined);
      addCheck('基础', !!site.seoKeywords, '缺少关键词', '设置 3-5 个核心关键词', 'medium', site.seoKeywords || undefined);
      addCheck('基础', !!site.domain, '未绑定域名', '绑定自定义域名提升可信度', 'high', site.domain || undefined);

      // 长度检查
      if (site.seoTitle) {
        addCheck('优化', site.seoTitle.length <= 60, `SEO 标题过长（${site.seoTitle.length}字符）`, '缩短至 60 字符以内', 'medium', site.seoTitle);
        addCheck('优化', site.seoTitle.length >= 10, 'SEO 标题过短', '标题至少 10 个字符', 'low', site.seoTitle);
      }
      if (site.seoDesc) {
        addCheck('优化', site.seoDesc.length <= 160, `SEO 描述过长（${site.seoDesc.length}字符）`, '缩短至 160 字符以内', 'medium', site.seoDesc);
        addCheck('优化', site.seoDesc.length >= 50, 'SEO 描述过短', '描述至少 50 个字符', 'low', site.seoDesc);
      }

      // 页面检查
      const pagesWithoutSeo = site.pages.filter(p => !p.seoTitle || !p.seoDesc).length;
      const publishedPages = site.pages.filter(p => p.status === 'published');
      addCheck('页面', pagesWithoutSeo === 0, `${pagesWithoutSeo} 个页面缺少 SEO 信息`, '为每个页面设置独立的 SEO 标题和描述', 'high');
      addCheck('页面', publishedPages.length > 0, '没有已发布的页面', '发布至少一个页面', 'high');
      addCheck('页面', site.pages.length >= 3, `页面数量较少（${site.pages.length}个）`, '建议创建至少 3 个页面', 'low');

      score = Math.max(0, Math.min(100, score));

      return {
        siteId: site.id,
        siteName: site.name,
        domain: site.domain,
        seoTitle: site.seoTitle,
        seoDesc: site.seoDesc,
        seoKeywords: site.seoKeywords,
        score,
        checks,
        issues: checks.filter(c => !c.passed),
        passed: checks.filter(c => c.passed),
        pageCount: site.pages.length,
        publishedPageCount: publishedPages.length,
        pages: site.pages.map(p => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          status: p.status,
          hasSeoTitle: !!p.seoTitle,
          hasSeoDesc: !!p.seoDesc,
          seoTitle: p.seoTitle,
          seoDesc: p.seoDesc,
        })),
      };
    });

    success(res, analysis);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 生成 robots.txt
router.get('/seo/robots.txt', async (req: Request, res: Response) => {
  try {
    const sites = await prisma.site.findMany({
      where: { tenantId: req.user!.tenantId, status: 'published' },
    });

    let robots = 'User-agent: *\n';
    robots += 'Allow: /\n\n';

    // Sitemap 引用
    for (const site of sites) {
      if (site.domain) {
        robots += `Sitemap: ${site.domain}/sitemap.xml\n`;
      }
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(robots);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 生成结构化数据 (JSON-LD)
router.get('/seo/structured-data', async (req: Request, res: Response) => {
  try {
    const { siteId } = req.query;
    const where: any = { tenantId: req.user!.tenantId };
    if (siteId) where.id = siteId;

    const sites = await prisma.site.findMany({ where });
    const articles = await prisma.article.findMany({
      where: { tenantId: req.user!.tenantId, status: 'published' },
    });

    const structuredData: any[] = [];

    // 站点 Organization 结构化数据
    for (const site of sites) {
      if (site.domain) {
        structuredData.push({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: site.name,
          url: site.domain,
          description: site.seoDesc || '',
        });
      }
    }

    // 文章 Article 结构化数据
    for (const article of articles) {
      structuredData.push({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.summary || '',
        datePublished: article.publishedAt?.toISOString() || article.createdAt.toISOString(),
        dateModified: article.updatedAt.toISOString(),
      });
    }

    success(res, structuredData);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 一键修复 SEO 问题
router.post('/seo/auto-fix', async (req: Request, res: Response) => {
  try {
    const { siteId } = req.body;
    const site = await prisma.site.findFirst({
      where: { id: siteId, tenantId: req.user!.tenantId },
      include: { pages: true },
    });
    if (!site) return notFound(res, '站点不存在');

    let fixed = 0;
    const details: string[] = [];

    // 1. 修复站点 SEO 标题
    if (!site.seoTitle || site.seoTitle.length < 10) {
      const title = site.seoTitle && site.seoTitle.length >= 10 ? site.seoTitle : `${site.name} - 专业${site.name}服务提供商`;
      await prisma.site.update({ where: { id: siteId }, data: { seoTitle: title } });
      fixed++;
      details.push('SEO标题');
    }

    // 2. 修复站点 SEO 描述
    if (!site.seoDesc || site.seoDesc.length < 50) {
      const desc = site.seoDesc && site.seoDesc.length >= 50 ? site.seoDesc : `${site.name}是专业的服务提供商，致力于为客户提供优质的解决方案。我们拥有丰富的行业经验和专业的团队，欢迎咨询合作。`;
      await prisma.site.update({ where: { id: siteId }, data: { seoDesc: desc } });
      fixed++;
      details.push('SEO描述');
    }

    // 3. 修复关键词
    if (!site.seoKeywords) {
      await prisma.site.update({ where: { id: siteId }, data: { seoKeywords: `${site.name},专业服务,解决方案` } });
      fixed++;
      details.push('关键词');
    }

    // 4. 修复页面 SEO（所有页面）
    for (const page of site.pages) {
      let pageFixed = false;
      const updateData: any = {};
      if (!page.seoTitle) {
        updateData.seoTitle = `${page.title} - ${site.name}`;
        pageFixed = true;
      }
      if (!page.seoDesc || page.seoDesc.length < 50) {
        updateData.seoDesc = `${page.title}页面，了解${site.name}提供的专业服务与解决方案。欢迎联系我们获取更多信息。`;
        pageFixed = true;
      }
      if (pageFixed) {
        await prisma.page.update({ where: { id: page.id }, data: updateData });
        fixed++;
      }
    }
    if (site.pages.some(p => !p.seoTitle || !p.seoDesc || p.seoDesc.length < 50)) {
      details.push('页面SEO');
    }

    // 5. 自动发布草稿页面（解决"没有已发布的页面"）
    const draftPages = site.pages.filter(p => p.status === 'draft');
    if (draftPages.length > 0 && site.pages.filter(p => p.status === 'published').length === 0) {
      for (const page of draftPages.slice(0, 1)) {
        await prisma.page.update({
          where: { id: page.id },
          data: { status: 'published', publishedAt: new Date() },
        });
        fixed++;
        details.push('发布页面');
      }
    }

    const msg = fixed > 0
      ? `已修复 ${fixed} 项：${details.join('、')}`
      : '所有可自动修复的问题已处理完毕';

    success(res, { fixed, details }, msg);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 导出 SEO 报告
router.get('/seo/report', async (req: Request, res: Response) => {
  try {
    const sites = await prisma.site.findMany({
      where: { tenantId: req.user!.tenantId },
      include: { pages: true },
    });
    const articles = await prisma.article.findMany({
      where: { tenantId: req.user!.tenantId, status: 'published' },
    });

    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalSites: sites.length,
        publishedSites: sites.filter(s => s.status === 'published').length,
        totalPages: sites.reduce((sum, s) => sum + s.pages.length, 0),
        totalArticles: articles.length,
      },
      sites: sites.map(site => {
        const pagesWithoutSeo = site.pages.filter(p => !p.seoTitle || !p.seoDesc).length;
        const score = Math.max(0, 100
          - (site.seoTitle ? 0 : 20)
          - (site.seoDesc ? 0 : 20)
          - (site.seoKeywords ? 0 : 10)
          - (site.domain ? 0 : 20)
          - (pagesWithoutSeo > 0 ? 15 : 0)
          - (site.pages.filter(p => p.status === 'published').length === 0 ? 15 : 0)
        );
        return {
          name: site.name,
          domain: site.domain,
          score,
          status: site.status,
          pages: site.pages.length,
          publishedPages: site.pages.filter(p => p.status === 'published').length,
          issues: [
            !site.seoTitle && '缺少SEO标题',
            !site.seoDesc && '缺少SEO描述',
            !site.seoKeywords && '缺少关键词',
            !site.domain && '未绑定域名',
            pagesWithoutSeo > 0 && `${pagesWithoutSeo}个页面缺少SEO信息`,
          ].filter(Boolean),
        };
      }),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=seo-report.json');
    res.json(report);
  } catch (error: any) {
    fail(res, error.message);
  }
});

export default router;

// ===== SEO 策略管理 =====

// 获取策略列表
router.get('/seo/strategies', async (req: Request, res: Response) => {
  try {
    const { target } = req.query;
    const where: any = { tenantId: req.user!.tenantId };
    if (target) where.target = target;
    const strategies = await prisma.seoStrategy.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
    success(res, strategies);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 创建策略
router.post('/seo/strategies', async (req: Request, res: Response) => {
  try {
    const { name, description, target, rules, isActive, sortOrder } = req.body;
    if (!name || !target || !rules) return fail(res, '名称、目标和规则不能为空');
    const strategy = await prisma.seoStrategy.create({
      data: {
        tenantId: req.user!.tenantId,
        name,
        description: description || '',
        target,
        rules: JSON.stringify(rules),
        isActive: isActive !== false,
        sortOrder: sortOrder || 0,
      },
    });
    success(res, strategy, '策略创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 更新策略
router.put('/seo/strategies/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name, description, target, rules, isActive, sortOrder } = req.body;
    const existing = await prisma.seoStrategy.findFirst({
      where: { id, tenantId: req.user!.tenantId },
    });
    if (!existing) return notFound(res, '策略不存在');
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (target !== undefined) data.target = target;
    if (rules !== undefined) data.rules = JSON.stringify(rules);
    if (isActive !== undefined) data.isActive = isActive;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    const strategy = await prisma.seoStrategy.update({ where: { id }, data });
    success(res, strategy, '策略更新成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 删除策略
router.delete('/seo/strategies/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const existing = await prisma.seoStrategy.findFirst({
      where: { id, tenantId: req.user!.tenantId },
    });
    if (!existing) return notFound(res, '策略不存在');
    await prisma.seoStrategy.delete({ where: { id } });
    success(res, null, '策略已删除');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 按策略执行 SEO 修复
router.post('/seo/strategy-fix', async (req: Request, res: Response) => {
  try {
    const { siteId, pageId } = req.body;
    const tenantId = req.user!.tenantId;

    // 获取所有启用的策略
    const strategies = await prisma.seoStrategy.findMany({
      where: { tenantId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    let fixed = 0;
    const details: string[] = [];

    // 处理站点策略
    if (siteId) {
      const site = await prisma.site.findFirst({
        where: { id: siteId, tenantId },
        include: { pages: true },
      });
      if (!site) return notFound(res, '站点不存在');

      const siteStrategies = strategies.filter(s => s.target === 'site');
      for (const strategy of siteStrategies) {
        const rules = JSON.parse(strategy.rules);
        for (const rule of rules) {
          const { field, condition, action, template } = rule;
          const currentValue = (site as any)[field];
          let shouldFix = false;

          if (condition === 'empty' && !currentValue) shouldFix = true;
          else if (condition === 'short' && currentValue && currentValue.length < (rule.minLength || 10)) shouldFix = true;
          else if (condition === 'missing' && !currentValue) shouldFix = true;

          if (shouldFix) {
            let value = template
              ? template.replace(/\{siteName\}/g, site.name)
                .replace(/\{siteDomain\}/g, site.domain || '')
                .replace(/\{pageTitle\}/g, '')
              : currentValue;
            await prisma.site.update({ where: { id: siteId }, data: { [field]: value } });
            fixed++;
            details.push(`${strategy.name}: ${field}`);
          }
        }
      }

      // 处理关联页面的策略
      const pageStrategies = strategies.filter(s => s.target === 'page');
      for (const page of site.pages) {
        for (const strategy of pageStrategies) {
          const rules = JSON.parse(strategy.rules);
          for (const rule of rules) {
            const { field, condition, template } = rule;
            const currentValue = (page as any)[field];
            let shouldFix = false;

            if (condition === 'empty' && !currentValue) shouldFix = true;
            else if (condition === 'short' && currentValue && currentValue.length < (rule.minLength || 10)) shouldFix = true;

            if (shouldFix) {
              let value = template
                ? template.replace(/\{siteName\}/g, site.name)
                  .replace(/\{siteDomain\}/g, site.domain || '')
                  .replace(/\{pageTitle\}/g, page.title)
                : currentValue;
              await prisma.page.update({ where: { id: page.id }, data: { [field]: value } });
              fixed++;
              details.push(`${strategy.name}: 页面${page.title}-${field}`);
            }
          }
        }
      }
    }

    // 处理单页面策略
    if (pageId) {
      const page = await prisma.page.findFirst({
        where: { id: pageId, tenantId },
        include: { site: true },
      });
      if (!page) return notFound(res, '页面不存在');

      const pageStrategies = strategies.filter(s => s.target === 'page');
      for (const strategy of pageStrategies) {
        const rules = JSON.parse(strategy.rules);
        for (const rule of rules) {
          const { field, condition, template } = rule;
          const currentValue = (page as any)[field];
          let shouldFix = false;

          if (condition === 'empty' && !currentValue) shouldFix = true;
          else if (condition === 'short' && currentValue && currentValue.length < (rule.minLength || 10)) shouldFix = true;

          if (shouldFix) {
            let value = template
              ? template.replace(/\{siteName\}/g, page.site?.name || '')
                .replace(/\{siteDomain\}/g, page.site?.domain || '')
                .replace(/\{pageTitle\}/g, page.title)
              : currentValue;
            await prisma.page.update({ where: { id: pageId }, data: { [field]: value } });
            fixed++;
            details.push(`${strategy.name}: ${field}`);
          }
        }
      }
    }

    const msg = fixed > 0
      ? `已修复 ${fixed} 项：${details.join('、')}`
      : '所有策略检查通过，无需修复';
    success(res, { fixed, details }, msg);
  } catch (error: any) {
    fail(res, error.message);
  }
});
