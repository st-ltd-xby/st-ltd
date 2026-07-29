import { Router, Request, Response } from 'express';
import prisma from '../../common/prisma';
import { success, successWithPagination, fail, notFound } from '../../common/response';
import { authMiddleware } from '../../middleware/auth';

const router: Router = Router();
router.use(authMiddleware);

// 辅助函数：解析产品数据，提取 externalUrl 信息
const parseProductData = (product: any) => {
  if (product.tags) {
    try {
      const parsedTags = JSON.parse(product.tags);
      if (parsedTags.externalUrl) {
        return {
          ...product,
          externalUrl: parsedTags.externalUrl,
          tags: JSON.stringify(Object.fromEntries(
            Object.entries(parsedTags).filter(([key]) => key !== 'externalUrl')
          )),
        };
      }
    } catch {
      // 如果 tags 不是有效 JSON，则直接返回原产品
    }
  }
  return product;
};

// ===== 商品管理 =====

router.get('/products', async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '20', status, keyword } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const where: any = { tenantId: req.user!.tenantId };
    if (status) where.status = status;
    if (keyword) where.name = { contains: String(keyword), mode: 'insensitive' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take: Number(pageSize), include: { skus: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.product.count({ where }),
    ]);

    // 解析产品数据，提取 externalUrl 信息
    const parsedProducts = products.map(parseProductData);

    successWithPagination(res, parsedProducts, { page: Number(page), pageSize: Number(pageSize), total });
  } catch (error: any) {
    fail(res, error.message);
  }
});

router.post('/products', async (req: Request, res: Response) => {
  try {
    const { name, description, coverImage, images, price, originalPrice, stock, category, tags, externalUrl, skus } = req.body;
    // 将 externalUrl 信息添加到 tags 字段中
    let updatedTags = tags || "";
    if (externalUrl) {
      try {
        const parsedTags = JSON.parse(updatedTags);
        parsedTags.externalUrl = externalUrl;
        updatedTags = JSON.stringify(parsedTags);
      } catch {
        // 如果 tags 不是有效 JSON，则创建新的 JSON 对象
        updatedTags = JSON.stringify({ externalUrl });
      }
    }
    
    const product = await prisma.product.create({
      data: {
        tenantId: req.user!.tenantId, name, description, coverImage, images: typeof images === 'string' ? images : JSON.stringify(images || []), price, originalPrice, stock, category, tags: typeof updatedTags === 'string' ? updatedTags : JSON.stringify(updatedTags),
        skus: skus ? { create: skus } : undefined,
      },
      include: { skus: true },
    });
    success(res, product, '商品创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

router.put('/products/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, coverImage, images, price, originalPrice, stock, category, tags, externalUrl, status, sortOrder } = req.body;
    // 将 externalUrl 信息添加到 tags 字段中
    let updatedTags = tags || "";
    if (externalUrl) {
      try {
        const parsedTags = JSON.parse(updatedTags);
        parsedTags.externalUrl = externalUrl;
        updatedTags = JSON.stringify(parsedTags);
      } catch {
        // 如果 tags 不是有效 JSON，则创建新的 JSON 对象
        updatedTags = JSON.stringify({ externalUrl });
      }
    }
    
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { name, description, coverImage, images: typeof images === 'string' ? images : JSON.stringify(images || []), price, originalPrice, stock, category, tags: typeof updatedTags === 'string' ? updatedTags : JSON.stringify(updatedTags), status, sortOrder },
    });
    success(res, product, '商品更新成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ===== 订单管理 =====

router.get('/orders', async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '20', status } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const where: any = { tenantId: req.user!.tenantId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({ where, skip, take: Number(pageSize), include: { items: true, payments: true }, orderBy: { createdAt: 'desc' } }),
      prisma.order.count({ where }),
    ]);

    successWithPagination(res, orders, { page: Number(page), pageSize: Number(pageSize), total });
  } catch (error: any) {
    fail(res, error.message);
  }
});

router.post('/orders', async (req: Request, res: Response) => {
  try {
    const { contactName, contactPhone, items, note } = req.body;
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    const orderNo = `ORD${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        tenantId: req.user!.tenantId, orderNo, contactName, contactPhone,
        totalAmount, payAmount: totalAmount, note,
        items: { create: items.map((item: any) => ({ productId: item.productId, name: item.name, price: item.price, quantity: item.quantity, subtotal: item.price * item.quantity })) },
      },
      include: { items: true },
    });
    success(res, order, '订单创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

router.put('/orders/:id', async (req: Request, res: Response) => {
  try {
    const { status, note } = req.body;
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status, note, paidAt: status === 'paid' ? new Date() : undefined },
    });
    success(res, order, '订单更新成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ===== 会员管理 =====

router.get('/members', async (req: Request, res: Response) => {
  try {
    const members = await prisma.member.findMany({
      where: { tenantId: req.user!.tenantId },
      orderBy: { createdAt: 'desc' },
    });
    success(res, members);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ===== 预约管理 =====

router.get('/appointments', async (req: Request, res: Response) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { tenantId: req.user!.tenantId },
      orderBy: { date: 'desc' },
    });
    success(res, appointments);
  } catch (error: any) {
    fail(res, error.message);
  }
});

router.post('/appointments', async (req: Request, res: Response) => {
  try {
    const { name, phone, email, service, date, time, note } = req.body;
    const appointment = await prisma.appointment.create({
      data: { tenantId: req.user!.tenantId, name, phone, email, service, date: new Date(date), time, note },
    });
    success(res, appointment, '预约创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ===== 外部网站接入管理 =====

// 获取外部网站列表
router.get('/external-websites', async (req: Request, res: Response) => {
  try {
    // 使用系统配置表存储外部网站信息
    const configs = await prisma.systemConfig.findMany({
      where: { tenantId: req.user!.tenantId, key: { startsWith: 'external_website_' } },
      orderBy: { createdAt: 'desc' },
    });
    
    // 解析配置数据
    const websites = configs.map(config => {
      const data = JSON.parse(config.value);
      return {
        id: config.id,
        tenantId: config.tenantId,
        name: data.name,
        url: data.url,
        platform: data.platform,
        lastSyncAt: data.lastSyncAt,
        status: data.status,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      };
    });
    
    success(res, websites);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 添加外部网站
router.post('/external-websites', async (req: Request, res: Response) => {
  try {
    const { name, url, platform, apiKey, apiSecret } = req.body;
    
    // 验证网站URL格式
    try {
      new URL(url);
    } catch {
      return fail(res, '无效的网站URL');
    }
    
    // 生成唯一ID
    const websiteId = `extws_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    // 存储到系统配置表
    const website = await prisma.systemConfig.create({
      data: {
        tenantId: req.user!.tenantId,
        key: `external_website_${websiteId}`,
        value: JSON.stringify({
          name,
          url,
          platform,
          apiKey,
          apiSecret,
          status: 'active',
          lastSyncAt: null,
        }),
      },
    });
    
    success(res, {
      id: websiteId,
      tenantId: website.tenantId,
      name,
      url,
      platform,
      status: 'active',
      createdAt: website.createdAt,
    }, '外部网站添加成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 更新外部网站
router.put('/external-websites/:id', async (req: Request, res: Response) => {
  try {
    const { name, url, platform, apiKey, apiSecret, status } = req.body;
    
    // 从系统配置表获取现有数据
    const existingConfig = await prisma.systemConfig.findUnique({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `external_website_${req.params.id}` 
        } 
      },
    });
    
    if (!existingConfig) {
      return notFound(res, '外部网站不存在');
    }
    
    // 解析现有数据并合并更新
    const existingData = JSON.parse(existingConfig.value);
    const updatedData = {
      ...existingData,
      name: name || existingData.name,
      url: url || existingData.url,
      platform: platform || existingData.platform,
      apiKey: apiKey !== undefined ? apiKey : existingData.apiKey,
      apiSecret: apiSecret !== undefined ? apiSecret : existingData.apiSecret,
      status: status || existingData.status,
    };
    
    const updatedConfig = await prisma.systemConfig.update({
      where: { id: existingConfig.id },
      data: { value: JSON.stringify(updatedData) },
    });
    
    success(res, {
      id: req.params.id,
      tenantId: updatedConfig.tenantId,
      name: updatedData.name,
      url: updatedData.url,
      platform: updatedData.platform,
      status: updatedData.status,
      updatedAt: updatedConfig.updatedAt,
    }, '外部网站更新成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 删除外部网站
router.delete('/external-websites/:id', async (req: Request, res: Response) => {
  try {
    await prisma.systemConfig.delete({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `external_website_${req.params.id}` 
        } 
      },
    });
    success(res, null, '外部网站删除成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 同步外部网站产品
router.post('/external-websites/:id/sync', async (req: Request, res: Response) => {
  try {
    // 获取网站配置
    const config = await prisma.systemConfig.findUnique({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `external_website_${req.params.id}` 
        } 
      },
    });
    
    if (!config) {
      return notFound(res, '外部网站不存在');
    }
    
    // 解析现有数据并更新同步时间
    const data = JSON.parse(config.value);
    data.lastSyncAt = new Date();
    
    await prisma.systemConfig.update({
      where: { id: config.id },
      data: { value: JSON.stringify(data) },
    });
    
    // 模拟从外部网站获取产品数据
    // 这里应该根据实际的API或数据源来获取产品
    const sampleProducts = [
      { id: 'prod_1', name: `${data.name} - 产品1`, price: 99.99, stock: 100, status: 'active', externalUrl: `${data.url}/product/1` },
      { id: 'prod_2', name: `${data.name} - 产品2`, price: 149.99, stock: 50, status: 'active', externalUrl: `${data.url}/product/2` },
      { id: 'prod_3', name: `${data.name} - 产品3`, price: 199.99, stock: 20, status: 'active', externalUrl: `${data.url}/product/3` },
    ];
    
    // 保存产品数据到系统配置表
    for (const product of sampleProducts) {
      const productId = `extprod_${req.params.id}_${product.id}`;
      
      // 检查是否已存在
      const existingProduct = await prisma.systemConfig.findUnique({
        where: {
          tenantId_key: {
            tenantId: req.user!.tenantId,
            key: `external_product_${productId}`
          }
        }
      });
      
      if (existingProduct) {
        // 更新现有产品
        await prisma.systemConfig.update({
          where: { id: existingProduct.id },
          data: { value: JSON.stringify({
            ...JSON.parse(existingProduct.value),
            ...product,
            websiteId: req.params.id,
            updatedAt: new Date(),
          })}
        });
      } else {
        // 创建新产品
        await prisma.systemConfig.create({
          data: {
            tenantId: req.user!.tenantId,
            key: `external_product_${productId}`,
            value: JSON.stringify({
              ...product,
              websiteId: req.params.id,
              createdAt: new Date(),
            })
          }
        });
      }
    }
    
    success(res, {
      id: req.params.id,
      name: data.name,
      lastSyncAt: data.lastSyncAt,
      syncedProducts: sampleProducts.length,
    }, `网站产品同步成功，同步了 ${sampleProducts.length} 个产品`);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 获取外部网站产品列表
router.get('/external-products', async (req: Request, res: Response) => {
  try {
    // 从系统配置表获取产品信息
    const configs = await prisma.systemConfig.findMany({
      where: { 
        tenantId: req.user!.tenantId, 
        key: { startsWith: 'external_product_' } 
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // 解析产品数据
    const products = configs.map(config => {
      const data = JSON.parse(config.value);
      return {
        id: config.id,
        name: data.name,
        price: data.price,
        stock: data.stock,
        status: data.status,
        externalUrl: data.externalUrl,
        websiteId: data.websiteId,
        createdAt: config.createdAt,
      };
    });
    
    success(res, products);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 获取推广任务列表
router.get('/promotion-tasks', async (req: Request, res: Response) => {
  try {
    // 从系统配置表获取推广任务
    const configs = await prisma.systemConfig.findMany({
      where: { 
        tenantId: req.user!.tenantId, 
        key: { startsWith: 'promotion_task_' } 
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // 解析任务数据
    const tasks = configs.map(config => {
      const data = JSON.parse(config.value);
      return {
        id: config.id,
        name: data.name,
        type: data.type,
        status: data.status,
        externalProductId: data.externalProductId,
        createdAt: config.createdAt,
      };
    });
    
    success(res, tasks);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 创建推广任务
router.post('/promotion-tasks', async (req: Request, res: Response) => {
  try {
    const { name, externalProductId, type, config: taskConfig } = req.body;
    
    // 生成任务ID
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    // 创建推广任务
    const task = await prisma.systemConfig.create({
      data: {
        tenantId: req.user!.tenantId,
        key: `promotion_task_${taskId}`,
        value: JSON.stringify({
          name,
          externalProductId,
          type,
          config: taskConfig || {},
          status: 'pending',
        }),
      },
    });
    
    success(res, {
      id: taskId,
      name,
      externalProductId,
      type,
      status: 'pending',
      createdAt: task.createdAt,
    }, '推广任务创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ===== 内容营销管理 =====

// 获取内容列表
router.get('/contents', async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '20', type, status } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    
    const where: any = { tenantId: req.user!.tenantId, key: { startsWith: 'content_' } };
    if (type) where.value = { contains: `"type":"${type}"` };
    if (status) where.value = { contains: `"status":"${status}"` };
    
    const [configs, total] = await Promise.all([
      prisma.systemConfig.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.systemConfig.count({ where }),
    ]);
    
    const contents = configs.map(config => {
      const data = JSON.parse(config.value);
      return {
        id: config.id,
        title: data.title,
        type: data.type,
        status: data.status,
        url: data.url,
        thumbnail: data.thumbnail,
        description: data.description,
        views: data.views || 0,
        shares: data.shares || 0,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      };
    });
    
    successWithPagination(res, contents, { page: Number(page), pageSize: Number(pageSize), total });
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 创建内容
router.post('/contents', async (req: Request, res: Response) => {
  try {
    const { title, type, description, url, thumbnail } = req.body;
    
    // 验证内容类型
    const validTypes = ['article', 'video', 'whitepaper'];
    if (!validTypes.includes(type)) {
      return fail(res, '无效的内容类型，支持: article(图文), video(视频), whitepaper(白皮书)');
    }
    
    const contentId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const content = await prisma.systemConfig.create({
      data: {
        tenantId: req.user!.tenantId,
        key: `content_${contentId}`,
        value: JSON.stringify({
          title,
          type,
          description,
          url,
          thumbnail,
          status: 'draft',
          views: 0,
          shares: 0,
          createdAt: new Date(),
        }),
      },
    });
    
    success(res, {
      id: contentId,
      title,
      type,
      description,
      url,
      thumbnail,
      status: 'draft',
      createdAt: content.createdAt,
    }, '内容创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 更新内容
router.put('/contents/:id', async (req: Request, res: Response) => {
  try {
    const { title, type, description, url, thumbnail, status } = req.body;
    
    const existingConfig = await prisma.systemConfig.findUnique({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `content_${req.params.id}` 
        } 
      },
    });
    
    if (!existingConfig) {
      return notFound(res, '内容不存在');
    }
    
    const existingData = JSON.parse(existingConfig.value);
    const updatedData = {
      ...existingData,
      title: title !== undefined ? title : existingData.title,
      type: type !== undefined ? type : existingData.type,
      description: description !== undefined ? description : existingData.description,
      url: url !== undefined ? url : existingData.url,
      thumbnail: thumbnail !== undefined ? thumbnail : existingData.thumbnail,
      status: status !== undefined ? status : existingData.status,
      updatedAt: new Date(),
    };
    
    await prisma.systemConfig.update({
      where: { id: existingConfig.id },
      data: { value: JSON.stringify(updatedData) },
    });
    
    success(res, {
      id: req.params.id,
      ...updatedData,
    }, '内容更新成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 删除内容
router.delete('/contents/:id', async (req: Request, res: Response) => {
  try {
    await prisma.systemConfig.delete({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `content_${req.params.id}` 
        } 
      },
    });
    success(res, null, '内容删除成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 发布内容
router.post('/contents/:id/publish', async (req: Request, res: Response) => {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `content_${req.params.id}` 
        } 
      },
    });
    
    if (!config) {
      return notFound(res, '内容不存在');
    }
    
    const data = JSON.parse(config.value);
    data.status = 'published';
    data.publishedAt = new Date();
    
    await prisma.systemConfig.update({
      where: { id: config.id },
      data: { value: JSON.stringify(data) },
    });
    
    success(res, {
      id: req.params.id,
      ...data,
    }, '内容发布成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ===== 全员营销 - 员工任务管理 =====

// 获取员工任务列表
router.get('/employee-tasks', async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '20', status, assigneeId } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    
    const where: any = { tenantId: req.user!.tenantId, key: { startsWith: 'employee_task_' } };
    if (status) where.value = { contains: `"status":"${status}"` };
    if (assigneeId) where.value = { contains: `"assigneeId":"${assigneeId}"` };
    
    const [configs, total] = await Promise.all([
      prisma.systemConfig.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.systemConfig.count({ where }),
    ]);
    
    const tasks = configs.map(config => {
      const data = JSON.parse(config.value);
      return {
        id: config.id,
        title: data.title,
        description: data.description,
        assigneeId: data.assigneeId,
        assigneeName: data.assigneeName,
        status: data.status,
        priority: data.priority,
        progress: data.progress || 0,
        startDate: data.startDate,
        dueDate: data.dueDate,
        completedAt: data.completedAt,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      };
    });
    
    successWithPagination(res, tasks, { page: Number(page), pageSize: Number(pageSize), total });
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 创建员工任务
router.post('/employee-tasks', async (req: Request, res: Response) => {
  try {
    const { title, description, assigneeId, assigneeName, priority, startDate, dueDate } = req.body;
    
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const task = await prisma.systemConfig.create({
      data: {
        tenantId: req.user!.tenantId,
        key: `employee_task_${taskId}`,
        value: JSON.stringify({
          title,
          description,
          assigneeId,
          assigneeName,
          status: 'pending',
          priority: priority || 'normal',
          progress: 0,
          startDate: startDate ? new Date(startDate) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          createdAt: new Date(),
        }),
      },
    });
    
    success(res, {
      id: taskId,
      title,
      description,
      assigneeId,
      assigneeName,
      status: 'pending',
      priority: priority || 'normal',
      progress: 0,
      startDate: startDate ? new Date(startDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      createdAt: task.createdAt,
    }, '任务创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 更新员工任务
router.put('/employee-tasks/:id', async (req: Request, res: Response) => {
  try {
    const { title, description, assigneeId, assigneeName, status, priority, progress, startDate, dueDate } = req.body;
    
    const existingConfig = await prisma.systemConfig.findUnique({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `employee_task_${req.params.id}` 
        } 
      },
    });
    
    if (!existingConfig) {
      return notFound(res, '任务不存在');
    }
    
    const existingData = JSON.parse(existingConfig.value);
    const updatedData = {
      ...existingData,
      title: title !== undefined ? title : existingData.title,
      description: description !== undefined ? description : existingData.description,
      assigneeId: assigneeId !== undefined ? assigneeId : existingData.assigneeId,
      assigneeName: assigneeName !== undefined ? assigneeName : existingData.assigneeName,
      status: status !== undefined ? status : existingData.status,
      priority: priority !== undefined ? priority : existingData.priority,
      progress: progress !== undefined ? progress : existingData.progress,
      startDate: startDate !== undefined ? new Date(startDate) : existingData.startDate,
      dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existingData.dueDate,
      completedAt: (status === 'completed' && existingData.status !== 'completed') ? new Date() : existingData.completedAt,
      updatedAt: new Date(),
    };
    
    await prisma.systemConfig.update({
      where: { id: existingConfig.id },
      data: { value: JSON.stringify(updatedData) },
    });
    
    success(res, {
      id: req.params.id,
      ...updatedData,
    }, '任务更新成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 删除员工任务
router.delete('/employee-tasks/:id', async (req: Request, res: Response) => {
  try {
    await prisma.systemConfig.delete({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `employee_task_${req.params.id}` 
        } 
      },
    });
    success(res, null, '任务删除成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 更新任务进度
router.post('/employee-tasks/:id/progress', async (req: Request, res: Response) => {
  try {
    const { progress, status } = req.body;
    
    const config = await prisma.systemConfig.findUnique({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `employee_task_${req.params.id}` 
        } 
      },
    });
    
    if (!config) {
      return notFound(res, '任务不存在');
    }
    
    const data = JSON.parse(config.value);
    data.progress = progress !== undefined ? Math.min(100, Math.max(0, progress)) : data.progress;
    data.status = status || data.status;
    if (data.status === 'completed' && !data.completedAt) {
      data.completedAt = new Date();
    }
    data.updatedAt = new Date();
    
    await prisma.systemConfig.update({
      where: { id: config.id },
      data: { value: JSON.stringify(data) },
    });
    
    success(res, {
      id: req.params.id,
      ...data,
    }, '任务进度更新成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ===== 全员营销（员工任务管理） =====

// 获取员工任务列表
router.get('/employee-tasks', async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '20', status, assignee } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    
    const where: any = { tenantId: req.user!.tenantId, key: { startsWith: 'employee_task_' } };
    if (status) where.value = { contains: `"status":"${status}"` };
    if (assignee) where.value = { contains: `"assignee":"${assignee}"` };
    
    const [configs, total] = await Promise.all([
      prisma.systemConfig.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.systemConfig.count({ where }),
    ]);
    
    const tasks = configs.map(config => {
      const data = JSON.parse(config.value);
      return {
        id: config.id,
        title: data.title,
        description: data.description,
        assignee: data.assignee,
        assigneeName: data.assigneeName,
        status: data.status,
        priority: data.priority,
        startDate: data.startDate,
        dueDate: data.dueDate,
        progress: data.progress || 0,
        metrics: data.metrics || {},
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      };
    });
    
    successWithPagination(res, tasks, { page: Number(page), pageSize: Number(pageSize), total });
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 创建员工任务
router.post('/employee-tasks', async (req: Request, res: Response) => {
  try {
    const { title, description, assignee, assigneeName, priority, startDate, dueDate, metrics } = req.body;
    
    const taskId = `etask_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const task = await prisma.systemConfig.create({
      data: {
        tenantId: req.user!.tenantId,
        key: `employee_task_${taskId}`,
        value: JSON.stringify({
          title,
          description,
          assignee,
          assigneeName,
          status: 'pending',
          priority: priority || 'medium',
          startDate,
          dueDate,
          progress: 0,
          metrics: metrics || {},
          createdAt: new Date(),
        }),
      },
    });
    
    success(res, {
      id: taskId,
      title,
      description,
      assignee,
      assigneeName,
      status: 'pending',
      priority: priority || 'medium',
      startDate,
      dueDate,
      progress: 0,
      metrics: metrics || {},
      createdAt: task.createdAt,
    }, '任务创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 更新员工任务
router.put('/employee-tasks/:id', async (req: Request, res: Response) => {
  try {
    const { title, description, assignee, assigneeName, status, priority, startDate, dueDate, progress, metrics } = req.body;
    
    const existingConfig = await prisma.systemConfig.findUnique({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `employee_task_${req.params.id}` 
        } 
      },
    });
    
    if (!existingConfig) {
      return notFound(res, '任务不存在');
    }
    
    const existingData = JSON.parse(existingConfig.value);
    const updatedData = {
      ...existingData,
      title: title !== undefined ? title : existingData.title,
      description: description !== undefined ? description : existingData.description,
      assignee: assignee !== undefined ? assignee : existingData.assignee,
      assigneeName: assigneeName !== undefined ? assigneeName : existingData.assigneeName,
      status: status !== undefined ? status : existingData.status,
      priority: priority !== undefined ? priority : existingData.priority,
      startDate: startDate !== undefined ? startDate : existingData.startDate,
      dueDate: dueDate !== undefined ? dueDate : existingData.dueDate,
      progress: progress !== undefined ? progress : existingData.progress,
      metrics: metrics !== undefined ? metrics : existingData.metrics,
      updatedAt: new Date(),
    };
    
    await prisma.systemConfig.update({
      where: { id: existingConfig.id },
      data: { value: JSON.stringify(updatedData) },
    });
    
    success(res, {
      id: req.params.id,
      ...updatedData,
    }, '任务更新成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 删除员工任务
router.delete('/employee-tasks/:id', async (req: Request, res: Response) => {
  try {
    await prisma.systemConfig.delete({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `employee_task_${req.params.id}` 
        } 
      },
    });
    success(res, null, '任务删除成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 更新任务进度
router.put('/employee-tasks/:id/progress', async (req: Request, res: Response) => {
  try {
    const { progress, updateNotes } = req.body;
    
    const config = await prisma.systemConfig.findUnique({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `employee_task_${req.params.id}` 
        } 
      },
    });
    
    if (!config) {
      return notFound(res, '任务不存在');
    }
    
    const data = JSON.parse(config.value);
    data.progress = progress;
    data.status = progress >= 100 ? 'completed' : (progress > 0 ? 'in_progress' : 'pending');
    if (updateNotes) {
      if (!data.updateHistory) data.updateHistory = [];
      data.updateHistory.push({
        date: new Date(),
        progress,
        notes: updateNotes,
        updatedBy: req.user!.tenantId
      });
    }
    
    await prisma.systemConfig.update({
      where: { id: config.id },
      data: { value: JSON.stringify(data) },
    });
    
    success(res, {
      id: req.params.id,
      ...data,
    }, '进度更新成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 获取员工列表（用于任务分配）
router.get('/employees', async (req: Request, res: Response) => {
  try {
    // 这里可以集成实际的员工管理系统
    // 暂时返回模拟数据
    const employees = [
      { id: 'emp_1', name: '张三', department: '市场部', position: '市场专员' },
      { id: 'emp_2', name: '李四', department: '销售部', position: '销售经理' },
      { id: 'emp_3', name: '王五', department: '运营部', position: '运营专员' },
      { id: 'emp_4', name: '赵六', department: '客服部', position: '客服主管' },
    ];
    
    success(res, employees);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ===== 线索管理 =====

// 获取线索列表
router.get('/leads', async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '20', status, source, assignee } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    
    const where: any = { tenantId: req.user!.tenantId, key: { startsWith: 'lead_' } };
    if (status) where.value = { contains: `"status":"${status}"` };
    if (source) where.value = { contains: `"source":"${source}"` };
    if (assignee) where.value = { contains: `"assignee":"${assignee}"` };
    
    const [configs, total] = await Promise.all([
      prisma.systemConfig.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.systemConfig.count({ where }),
    ]);
    
    const leads = configs.map(config => {
      const data = JSON.parse(config.value);
      return {
        id: config.id,
        name: data.name,
        company: data.company,
        position: data.position,
        phone: data.phone,
        email: data.email,
        source: data.source,
        status: data.status,
        assignee: data.assignee,
        assigneeName: data.assigneeName,
        interestLevel: data.interestLevel,
        estimatedValue: data.estimatedValue,
        lastContactDate: data.lastContactDate,
        nextContactDate: data.nextContactDate,
        notes: data.notes,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      };
    });
    
    successWithPagination(res, leads, { page: Number(page), pageSize: Number(pageSize), total });
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 创建线索
router.post('/leads', async (req: Request, res: Response) => {
  try {
    const { name, company, position, phone, email, source, assignee, assigneeName, interestLevel, estimatedValue, notes } = req.body;
    
    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const lead = await prisma.systemConfig.create({
      data: {
        tenantId: req.user!.tenantId,
        key: `lead_${leadId}`,
        value: JSON.stringify({
          name,
          company,
          position,
          phone,
          email,
          source,
          status: 'new',
          assignee,
          assigneeName,
          interestLevel: interestLevel || 1,
          estimatedValue: estimatedValue || 0,
          notes: notes || '',
          createdAt: new Date(),
          lastContactDate: null,
          nextContactDate: null,
        }),
      },
    });
    
    success(res, {
      id: leadId,
      name,
      company,
      position,
      phone,
      email,
      source,
      status: 'new',
      assignee,
      assigneeName,
      interestLevel: interestLevel || 1,
      estimatedValue: estimatedValue || 0,
      notes: notes || '',
      createdAt: lead.createdAt,
    }, '线索创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 更新线索
router.put('/leads/:id', async (req: Request, res: Response) => {
  try {
    const { name, company, position, phone, email, source, status, assignee, assigneeName, interestLevel, estimatedValue, lastContactDate, nextContactDate, notes } = req.body;
    
    const existingConfig = await prisma.systemConfig.findUnique({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `lead_${req.params.id}` 
        } 
      },
    });
    
    if (!existingConfig) {
      return notFound(res, '线索不存在');
    }
    
    const existingData = JSON.parse(existingConfig.value);
    const updatedData = {
      ...existingData,
      name: name !== undefined ? name : existingData.name,
      company: company !== undefined ? company : existingData.company,
      position: position !== undefined ? position : existingData.position,
      phone: phone !== undefined ? phone : existingData.phone,
      email: email !== undefined ? email : existingData.email,
      source: source !== undefined ? source : existingData.source,
      status: status !== undefined ? status : existingData.status,
      assignee: assignee !== undefined ? assignee : existingData.assignee,
      assigneeName: assigneeName !== undefined ? assigneeName : existingData.assigneeName,
      interestLevel: interestLevel !== undefined ? interestLevel : existingData.interestLevel,
      estimatedValue: estimatedValue !== undefined ? estimatedValue : existingData.estimatedValue,
      lastContactDate: lastContactDate !== undefined ? new Date(lastContactDate) : existingData.lastContactDate,
      nextContactDate: nextContactDate !== undefined ? (nextContactDate ? new Date(nextContactDate) : null) : existingData.nextContactDate,
      notes: notes !== undefined ? notes : existingData.notes,
      updatedAt: new Date(),
    };
    
    await prisma.systemConfig.update({
      where: { id: existingConfig.id },
      data: { value: JSON.stringify(updatedData) },
    });
    
    success(res, {
      id: req.params.id,
      ...updatedData,
    }, '线索更新成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 删除线索
router.delete('/leads/:id', async (req: Request, res: Response) => {
  try {
    await prisma.systemConfig.delete({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `lead_${req.params.id}` 
        } 
      },
    });
    success(res, null, '线索删除成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 更新线索状态
router.post('/leads/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body;
    
    const config = await prisma.systemConfig.findUnique({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `lead_${req.params.id}` 
        } 
      },
    });
    
    if (!config) {
      return notFound(res, '线索不存在');
    }
    
    const data = JSON.parse(config.value);
    data.status = status;
    if (notes) {
      if (!data.statusHistory) data.statusHistory = [];
      data.statusHistory.push({
        status,
        date: new Date(),
        notes,
        updatedBy: req.user!.tenantId
      });
    }
    
    await prisma.systemConfig.update({
      where: { id: config.id },
      data: { value: JSON.stringify(data) },
    });
    
    success(res, {
      id: req.params.id,
      ...data,
    }, '线索状态更新成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ===== 客户管理 =====

// 获取客户列表
router.get('/customers', async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '20', status, industry, assignee } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    
    const where: any = { tenantId: req.user!.tenantId, key: { startsWith: 'customer_' } };
    if (status) where.value = { contains: `"status":"${status}"` };
    if (industry) where.value = { contains: `"industry":"${industry}"` };
    if (assignee) where.value = { contains: `"assignee":"${assignee}"` };
    
    const [configs, total] = await Promise.all([
      prisma.systemConfig.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.systemConfig.count({ where }),
    ]);
    
    const customers = configs.map(config => {
      const data = JSON.parse(config.value);
      return {
        id: config.id,
        name: data.name,
        company: data.company,
        position: data.position,
        phone: data.phone,
        email: data.email,
        industry: data.industry,
        status: data.status,
        assignee: data.assignee,
        assigneeName: data.assigneeName,
        customerLevel: data.customerLevel,
        totalDealValue: data.totalDealValue,
        lastContactDate: data.lastContactDate,
        nextContactDate: data.nextContactDate,
        notes: data.notes,
        source: data.source || 'unknown',
        leadId: data.leadId, // 关联的线索ID
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      };
    });
    
    successWithPagination(res, customers, { page: Number(page), pageSize: Number(pageSize), total });
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 创建客户
router.post('/customers', async (req: Request, res: Response) => {
  try {
    const { name, company, position, phone, email, industry, assignee, assigneeName, customerLevel, source, leadId, notes } = req.body;
    
    const customerId = `cust_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const customer = await prisma.systemConfig.create({
      data: {
        tenantId: req.user!.tenantId,
        key: `customer_${customerId}`,
        value: JSON.stringify({
          name,
          company,
          position,
          phone,
          email,
          industry,
          status: 'prospect',
          assignee,
          assigneeName,
          customerLevel: customerLevel || 'normal',
          totalDealValue: 0,
          notes: notes || '',
          source: source || 'unknown',
          leadId: leadId || null, // 关联的线索ID
          createdAt: new Date(),
          lastContactDate: null,
          nextContactDate: null,
        }),
      },
    });
    
    // 如果此客户来自线索，更新线索状态为已转化
    if (leadId) {
      const leadConfig = await prisma.systemConfig.findUnique({
        where: { 
          tenantId_key: { 
            tenantId: req.user!.tenantId, 
            key: `lead_${leadId}` 
          } 
        },
      });
      
      if (leadConfig) {
        const leadData = JSON.parse(leadConfig.value);
        leadData.status = 'converted';
        await prisma.systemConfig.update({
          where: { id: leadConfig.id },
          data: { value: JSON.stringify(leadData) },
        });
      }
    }
    
    success(res, {
      id: customerId,
      name,
      company,
      position,
      phone,
      email,
      industry,
      status: 'prospect',
      assignee,
      assigneeName,
      customerLevel: customerLevel || 'normal',
      totalDealValue: 0,
      notes: notes || '',
      source: source || 'unknown',
      leadId: leadId || null,
      createdAt: customer.createdAt,
    }, '客户创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 更新客户
router.put('/customers/:id', async (req: Request, res: Response) => {
  try {
    const { name, company, position, phone, email, industry, status, assignee, assigneeName, customerLevel, totalDealValue, lastContactDate, nextContactDate, notes, supplyInfo, demandInfo, projectName, projectBudget, projectTimeline, projectStatus, tenderName, tenderBudget, tenderDate, bidStatus } = req.body;
    
    const existingConfig = await prisma.systemConfig.findUnique({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `customer_${req.params.id}` 
        } 
      },
    });
    
    if (!existingConfig) {
      return notFound(res, '客户不存在');
    }
    
    const existingData = JSON.parse(existingConfig.value);
    const updatedData = {
      ...existingData,
      name: name !== undefined ? name : existingData.name,
      company: company !== undefined ? company : existingData.company,
      position: position !== undefined ? position : existingData.position,
      phone: phone !== undefined ? phone : existingData.phone,
      email: email !== undefined ? email : existingData.email,
      industry: industry !== undefined ? industry : existingData.industry,
      status: status !== undefined ? status : existingData.status,
      assignee: assignee !== undefined ? assignee : existingData.assignee,
      assigneeName: assigneeName !== undefined ? assigneeName : existingData.assigneeName,
      customerLevel: customerLevel !== undefined ? customerLevel : existingData.customerLevel,
      totalDealValue: totalDealValue !== undefined ? totalDealValue : existingData.totalDealValue,
      lastContactDate: lastContactDate !== undefined ? new Date(lastContactDate) : existingData.lastContactDate,
      nextContactDate: nextContactDate !== undefined ? (nextContactDate ? new Date(nextContactDate) : null) : existingData.nextContactDate,
      notes: notes !== undefined ? notes : existingData.notes,
      supplyInfo: supplyInfo !== undefined ? supplyInfo : existingData.supplyInfo,
      demandInfo: demandInfo !== undefined ? demandInfo : existingData.demandInfo,
      projectName: projectName !== undefined ? projectName : existingData.projectName,
      projectBudget: projectBudget !== undefined ? projectBudget : existingData.projectBudget,
      projectTimeline: projectTimeline !== undefined ? projectTimeline : existingData.projectTimeline,
      projectStatus: projectStatus !== undefined ? projectStatus : existingData.projectStatus,
      tenderName: tenderName !== undefined ? tenderName : existingData.tenderName,
      tenderBudget: tenderBudget !== undefined ? tenderBudget : existingData.tenderBudget,
      tenderDate: tenderDate !== undefined ? (tenderDate ? new Date(tenderDate) : null) : existingData.tenderDate,
      bidStatus: bidStatus !== undefined ? bidStatus : existingData.bidStatus,
      updatedAt: new Date(),
    };
    
    await prisma.systemConfig.update({
      where: { id: existingConfig.id },
      data: { value: JSON.stringify(updatedData) },
    });
    
    success(res, {
      id: req.params.id,
      ...updatedData,
    }, '客户更新成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 删除客户
router.delete('/customers/:id', async (req: Request, res: Response) => {
  try {
    await prisma.systemConfig.delete({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `customer_${req.params.id}` 
        } 
      },
    });
    success(res, null, '客户删除成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 将线索转换为客户
router.post('/leads/:id/convert-to-customer', async (req: Request, res: Response) => {
  try {
    const leadId = req.params.id;
    
    const leadConfig = await prisma.systemConfig.findUnique({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `lead_${leadId}` 
        } 
      },
    });
    
    if (!leadConfig) {
      return notFound(res, '线索不存在');
    }
    
    const leadData = JSON.parse(leadConfig.value);
    
    // 创建客户记录
    const customerId = `cust_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    await prisma.systemConfig.create({
      data: {
        tenantId: req.user!.tenantId,
        key: `customer_${customerId}`,
        value: JSON.stringify({
          name: leadData.name,
          company: leadData.company,
          position: leadData.position,
          phone: leadData.phone,
          email: leadData.email,
          industry: leadData.industry || '',
          status: 'prospect',
          assignee: leadData.assignee,
          assigneeName: leadData.assigneeName,
          customerLevel: 'normal',
          totalDealValue: 0,
          notes: `从线索 ${leadId} 转化而来`,
          source: leadData.source,
          leadId: leadId,
          createdAt: new Date(),
          lastContactDate: null,
          nextContactDate: null,
        }),
      },
    });
    
    // 更新线索状态为已转化
    leadData.status = 'converted';
    await prisma.systemConfig.update({
      where: { id: leadConfig.id },
      data: { value: JSON.stringify(leadData) },
    });
    
    success(res, {
      customerId,
      leadId,
      message: '线索已成功转换为客户',
    });
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ===== 商机管理 =====

// 获取商机列表
router.get('/opportunities', async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '20', status, assignee, leadId } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    
    const where: any = { tenantId: req.user!.tenantId, key: { startsWith: 'opportunity_' } };
    if (status) where.value = { contains: `"status":"${status}"` };
    if (assignee) where.value = { contains: `"assignee":"${assignee}"` };
    if (leadId) where.value = { contains: `"leadId":"${leadId}"` };
    
    const [configs, total] = await Promise.all([
      prisma.systemConfig.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.systemConfig.count({ where }),
    ]);
    
    const opportunities = configs.map(config => {
      const data = JSON.parse(config.value);
      return {
        id: config.id,
        name: data.name,
        description: data.description,
        leadId: data.leadId,
        customerId: data.customerId,
        assignee: data.assignee,
        assigneeName: data.assigneeName,
        status: data.status,
        priority: data.priority,
        estimatedValue: data.estimatedValue,
        probability: data.probability,
        expectedCloseDate: data.expectedCloseDate,
        actualCloseDate: data.actualCloseDate,
        stage: data.stage,
        progress: data.progress,
        budget: data.budget,
        timeline: data.timeline,
        notes: data.notes,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      };
    });
    
    successWithPagination(res, opportunities, { page: Number(page), pageSize: Number(pageSize), total });
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 创建商机
router.post('/opportunities', async (req: Request, res: Response) => {
  try {
    const { name, description, leadId, customerId, assignee, assigneeName, priority, estimatedValue, probability, expectedCloseDate, stage, budget, timeline, notes } = req.body;
    
    const opportunityId = `opp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const opportunity = await prisma.systemConfig.create({
      data: {
        tenantId: req.user!.tenantId,
        key: `opportunity_${opportunityId}`,
        value: JSON.stringify({
          name,
          description,
          leadId,
          customerId,
          assignee,
          assigneeName,
          status: 'initiated',
          priority: priority || 'medium',
          estimatedValue: estimatedValue || 0,
          probability: probability || 0,
          expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
          actualCloseDate: null,
          stage: stage || 'prospecting',
          progress: 0,
          budget: budget || 0,
          timeline: timeline || '',
          notes: notes || '',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
    });
    
    // 更新关联线索的状态为商机阶段
    if (leadId) {
      const leadConfig = await prisma.systemConfig.findUnique({
        where: { 
          tenantId_key: { 
            tenantId: req.user!.tenantId, 
            key: `lead_${leadId}` 
          } 
        },
      });
      
      if (leadConfig) {
        const leadData = JSON.parse(leadConfig.value);
        leadData.status = 'opportunity';
        await prisma.systemConfig.update({
          where: { id: leadConfig.id },
          data: { value: JSON.stringify(leadData) },
        });
      }
    }
    
    success(res, {
      id: opportunityId,
      name,
      description,
      leadId,
      customerId,
      assignee,
      assigneeName,
      status: 'initiated',
      priority: priority || 'medium',
      estimatedValue: estimatedValue || 0,
      probability: probability || 0,
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
      actualCloseDate: null,
      stage: stage || 'prospecting',
      progress: 0,
      budget: budget || 0,
      timeline: timeline || '',
      notes: notes || '',
      createdAt: opportunity.createdAt,
    }, '商机创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 更新商机
router.put('/opportunities/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, assignee, assigneeName, status, priority, estimatedValue, probability, expectedCloseDate, actualCloseDate, stage, progress, budget, timeline, notes } = req.body;
    
    const existingConfig = await prisma.systemConfig.findUnique({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `opportunity_${req.params.id}` 
        } 
      },
    });
    
    if (!existingConfig) {
      return notFound(res, '商机不存在');
    }
    
    const existingData = JSON.parse(existingConfig.value);
    const updatedData = {
      ...existingData,
      name: name !== undefined ? name : existingData.name,
      description: description !== undefined ? description : existingData.description,
      assignee: assignee !== undefined ? assignee : existingData.assignee,
      assigneeName: assigneeName !== undefined ? assigneeName : existingData.assigneeName,
      status: status !== undefined ? status : existingData.status,
      priority: priority !== undefined ? priority : existingData.priority,
      estimatedValue: estimatedValue !== undefined ? estimatedValue : existingData.estimatedValue,
      probability: probability !== undefined ? probability : existingData.probability,
      expectedCloseDate: expectedCloseDate !== undefined ? (expectedCloseDate ? new Date(expectedCloseDate) : null) : existingData.expectedCloseDate,
      actualCloseDate: actualCloseDate !== undefined ? (actualCloseDate ? new Date(actualCloseDate) : null) : existingData.actualCloseDate,
      stage: stage !== undefined ? stage : existingData.stage,
      progress: progress !== undefined ? progress : existingData.progress,
      budget: budget !== undefined ? budget : existingData.budget,
      timeline: timeline !== undefined ? timeline : existingData.timeline,
      notes: notes !== undefined ? notes : existingData.notes,
      updatedAt: new Date(),
    };
    
    await prisma.systemConfig.update({
      where: { id: existingConfig.id },
      data: { value: JSON.stringify(updatedData) },
    });
    
    success(res, {
      id: req.params.id,
      ...updatedData,
    }, '商机更新成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 删除商机
router.delete('/opportunities/:id', async (req: Request, res: Response) => {
  try {
    await prisma.systemConfig.delete({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `opportunity_${req.params.id}` 
        } 
      },
    });
    success(res, null, '商机删除成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 更新商机进度
router.put('/opportunities/:id/progress', async (req: Request, res: Response) => {
  try {
    const { progress, stage, notes } = req.body;
    
    const config = await prisma.systemConfig.findUnique({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `opportunity_${req.params.id}` 
        } 
      },
    });
    
    if (!config) {
      return notFound(res, '商机不存在');
    }
    
    const data = JSON.parse(config.value);
    if (progress !== undefined) data.progress = Math.min(100, Math.max(0, progress));
    if (stage) data.stage = stage;
    if (notes) {
      if (!data.progressNotes) data.progressNotes = [];
      data.progressNotes.push({
        date: new Date(),
        progress: data.progress,
        stage: data.stage,
        notes,
        updatedBy: req.user!.tenantId
      });
    }
    data.updatedAt = new Date();
    
    await prisma.systemConfig.update({
      where: { id: config.id },
      data: { value: JSON.stringify(data) },
    });
    
    success(res, {
      id: req.params.id,
      ...data,
    }, '商机进度更新成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ===== 建站中心 =====

// 获取站点列表（已有独立站的客户管理）
router.get('/sites', async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '20', status, category } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    
    // 构建查询条件
    const whereConditions: any = {
      tenantId: req.user!.tenantId,
      key: { startsWith: 'site_' },
    };
    
    if (status) whereConditions.value = { contains: status.toString() };
    if (category) whereConditions.value = { contains: category.toString() };
    
    const sites = await prisma.systemConfig.findMany({
      where: whereConditions,
      skip,
      take: Number(pageSize),
      orderBy: { createdAt: 'desc' },
    });
    
    const totalCount = await prisma.systemConfig.count({ where: whereConditions });
    
    const siteList = sites.map(item => {
      const data = JSON.parse(item.value);
      return {
        id: item.key.replace('site_', ''),
        ...data,
      };
    });
    
    success(res, {
      list: siteList,
      pagination: {
        current: Number(page),
        pageSize: Number(pageSize),
        total: totalCount,
      },
    });
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 创建站点（已有独立站的客户）
router.post('/sites', async (req: Request, res: Response) => {
  try {
    const {
      customerName, customerCompany, customerPhone, customerEmail,
      siteName, siteUrl, siteCategory, description, notes
    } = req.body;
    
    const siteId = `site_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const siteData = {
      customerName,
      customerCompany,
      customerPhone,
      customerEmail,
      siteName,
      siteUrl,
      siteCategory,
      description,
      notes,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await prisma.systemConfig.create({
      data: {
        tenantId: req.user!.tenantId,
        key: `site_${siteId}`,
        value: JSON.stringify(siteData),
      },
    });
    
    success(res, { id: siteId, ...siteData }, '站点创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 更新站点
router.put('/sites/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      customerName, customerCompany, customerPhone, customerEmail,
      siteName, siteUrl, siteCategory, description, notes, status
    } = req.body;
    
    const existingConfig = await prisma.systemConfig.findUnique({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `site_${id}` 
        } 
      },
    });
    
    if (!existingConfig) {
      return notFound(res, '站点不存在');
    }
    
    const existingData = JSON.parse(existingConfig.value);
    const updatedData = {
      ...existingData,
      customerName: customerName !== undefined ? customerName : existingData.customerName,
      customerCompany: customerCompany !== undefined ? customerCompany : existingData.customerCompany,
      customerPhone: customerPhone !== undefined ? customerPhone : existingData.customerPhone,
      customerEmail: customerEmail !== undefined ? customerEmail : existingData.customerEmail,
      siteName: siteName !== undefined ? siteName : existingData.siteName,
      siteUrl: siteUrl !== undefined ? siteUrl : existingData.siteUrl,
      siteCategory: siteCategory !== undefined ? siteCategory : existingData.siteCategory,
      description: description !== undefined ? description : existingData.description,
      notes: notes !== undefined ? notes : existingData.notes,
      status: status !== undefined ? status : existingData.status,
      updatedAt: new Date(),
    };
    
    await prisma.systemConfig.update({
      where: { id: existingConfig.id },
      data: { value: JSON.stringify(updatedData) },
    });
    
    success(res, { id, ...updatedData }, '站点更新成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 删除站点
router.delete('/sites/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await prisma.systemConfig.delete({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `site_${id}` 
        } 
      },
    });
    
    success(res, { id }, '站点删除成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 获取页面列表（推广页面管理）
router.get('/pages', async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '20', status, category, templateType } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    
    // 构建查询条件
    const whereConditions: any = {
      tenantId: req.user!.tenantId,
      key: { startsWith: 'page_' },
    };
    
    if (status) whereConditions.value = { contains: status.toString() };
    if (category) whereConditions.value = { contains: category.toString() };
    if (templateType) whereConditions.value = { contains: templateType.toString() };
    
    const pages = await prisma.systemConfig.findMany({
      where: whereConditions,
      skip,
      take: Number(pageSize),
      orderBy: { createdAt: 'desc' },
    });
    
    const totalCount = await prisma.systemConfig.count({ where: whereConditions });
    
    const pageList = pages.map(item => {
      const data = JSON.parse(item.value);
      return {
        id: item.key.replace('page_', ''),
        ...data,
      };
    });
    
    success(res, {
      list: pageList,
      pagination: {
        current: Number(page),
        pageSize: Number(pageSize),
        total: totalCount,
      },
    });
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 创建推广页面
router.post('/pages', async (req: Request, res: Response) => {
  try {
    const {
      customerName, customerCompany, customerPhone, customerEmail,
      pageName, pageDescription, templateType, content, status
    } = req.body;
    
    const pageId = `page_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const pageData = {
      customerName,
      customerCompany,
      customerPhone,
      customerEmail,
      pageName,
      pageDescription,
      templateType,
      content: content || {},
      status: status || 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await prisma.systemConfig.create({
      data: {
        tenantId: req.user!.tenantId,
        key: `page_${pageId}`,
        value: JSON.stringify(pageData),
      },
    });
    
    success(res, { id: pageId, ...pageData }, '推广页面创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 更新推广页面
router.put('/pages/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      customerName, customerCompany, customerPhone, customerEmail,
      pageName, pageDescription, templateType, content, status
    } = req.body;
    
    const existingConfig = await prisma.systemConfig.findUnique({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `page_${id}` 
        } 
      },
    });
    
    if (!existingConfig) {
      return notFound(res, '推广页面不存在');
    }
    
    const existingData = JSON.parse(existingConfig.value);
    const updatedData = {
      ...existingData,
      customerName: customerName !== undefined ? customerName : existingData.customerName,
      customerCompany: customerCompany !== undefined ? customerCompany : existingData.customerCompany,
      customerPhone: customerPhone !== undefined ? customerPhone : existingData.customerPhone,
      customerEmail: customerEmail !== undefined ? customerEmail : existingData.customerEmail,
      pageName: pageName !== undefined ? pageName : existingData.pageName,
      pageDescription: pageDescription !== undefined ? pageDescription : existingData.pageDescription,
      templateType: templateType !== undefined ? templateType : existingData.templateType,
      content: content !== undefined ? content : existingData.content,
      status: status !== undefined ? status : existingData.status,
      updatedAt: new Date(),
    };
    
    await prisma.systemConfig.update({
      where: { id: existingConfig.id },
      data: { value: JSON.stringify(updatedData) },
    });
    
    success(res, { id, ...updatedData }, '推广页面更新成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 删除推广页面
router.delete('/pages/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await prisma.systemConfig.delete({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `page_${id}` 
        } 
      },
    });
    
    success(res, { id }, '推广页面删除成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 发布推广页面
router.post('/pages/:id/publish', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const existingConfig = await prisma.systemConfig.findUnique({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `page_${id}` 
        } 
      },
    });
    
    if (!existingConfig) {
      return notFound(res, '推广页面不存在');
    }
    
    const existingData = JSON.parse(existingConfig.value);
    existingData.status = 'published';
    existingData.publishedAt = new Date();
    
    await prisma.systemConfig.update({
      where: { id: existingConfig.id },
      data: { value: JSON.stringify(existingData) },
    });
    
    success(res, { id, ...existingData }, '推广页面发布成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 预览推广页面
router.get('/pages/:id/preview', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const config = await prisma.systemConfig.findUnique({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `page_${id}` 
        } 
      },
    });
    
    if (!config) {
      return notFound(res, '推广页面不存在');
    }
    
    const pageData = JSON.parse(config.value);
    
    success(res, pageData, '推广页面预览数据获取成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 生成页面访问链接
router.post('/pages/:id/generate-link', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { customDomain } = req.body;
    
    const config = await prisma.systemConfig.findUnique({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `page_${id}` 
        } 
      },
    });
    
    if (!config) {
      return notFound(res, '推广页面不存在');
    }
    
    const pageData = JSON.parse(config.value);
    
    // 如果页面未发布，则不能生成外网链接
    if (pageData.status !== 'published') {
      return fail(res, '页面必须先发布才能生成外网访问链接');
    }
    
    // 生成页面访问链接
    let pageUrl;
    if (customDomain) {
      // 使用自定义域名
      pageUrl = customDomain.startsWith('http') ? customDomain : `https://${customDomain}`;
    } else {
      // 使用系统默认域名生成规则
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      pageUrl = `${baseUrl}/public/page/${id}`;
    }
    
    // 更新页面数据，添加访问链接
    pageData.pageUrl = pageUrl;
    pageData.publicAccess = true;
    pageData.accessUrl = pageUrl;
    
    await prisma.systemConfig.update({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `page_${id}` 
        } 
      },
      data: { value: JSON.stringify(pageData) }
    });
    
    success(res, { pageUrl }, '页面访问链接生成成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 获取公共页面数据（供外网访问）
router.get('/public/page/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const config = await prisma.systemConfig.findUnique({
      where: { 
        key: `page_${id}` 
      },
    });
    
    if (!config) {
      return notFound(res, '页面不存在');
    }
    
    const pageData = JSON.parse(config.value);
    
    // 检查页面是否已发布且允许公开访问
    if (pageData.status !== 'published' || !pageData.publicAccess) {
      return fail(res, '页面尚未发布或不允许公开访问');
    }
    
    // 返回页面HTML内容
    const htmlContent = generatePageHtml(pageData);
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 生成页面HTML内容的辅助函数
function generatePageHtml(pageData: any): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageData.title || '推广页面'}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { text-align: center; padding: 20px 0; }
    .content { padding: 20px; }
    .footer { text-align: center; padding: 20px 0; margin-top: 40px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${pageData.title || '推广页面'}</h1>
      ${pageData.description ? `<p>${pageData.description}</p>` : ''}
    </div>
    <div class="content">
      ${pageData.content || '<p>页面内容</p>'}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${pageData.customerCompany || 'LTD'} 版权所有</p>
    </div>
  </div>
</body>
</html>
  `;
}

// ===== 数据看板 =====

// 获取数据看板统计
router.get('/dashboard/stats', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    
    // 获取商品总数
    const totalProducts = await prisma.product.count({ where: { tenantId } });
    
    // 获取订单总数
    const totalOrders = await prisma.order.count({ where: { tenantId } });
    
    // 获取会员总数
    const totalMembers = await prisma.member.count({ where: { tenantId } });
    
    // 获取预约总数
    const totalAppointments = await prisma.appointment.count({ where: { tenantId } });
    
    // 获取外部网站总数
    const totalExternalWebsites = await prisma.systemConfig.count({ 
      where: { tenantId, key: { startsWith: 'external_website_' } } 
    });
    
    // 获取内容总数
    const totalContents = await prisma.systemConfig.count({ 
      where: { tenantId, key: { startsWith: 'content_' } } 
    });
    
    // 获取员工任务总数
    const totalEmployeeTasks = await prisma.systemConfig.count({ 
      where: { tenantId, key: { startsWith: 'employee_task_' } } 
    });
    
    // 获取线索总数
    const totalLeads = await prisma.systemConfig.count({ 
      where: { tenantId, key: { startsWith: 'lead_' } } 
    });
    
    // 获取客户总数
    const totalCustomers = await prisma.systemConfig.count({ 
      where: { tenantId, key: { startsWith: 'customer_' } } 
    });
    
    // 获取商机总数
    const totalOpportunities = await prisma.systemConfig.count({ 
      where: { tenantId, key: { startsWith: 'opportunity_' } } 
    });
    
    // 获取站点总数
    const totalSites = await prisma.systemConfig.count({ 
      where: { tenantId, key: { startsWith: 'site_' } } 
    });
    
    // 获取页面总数
    const totalPages = await prisma.systemConfig.count({ 
      where: { tenantId, key: { startsWith: 'page_' } } 
    });
    
    // 获取表单总数
    const totalForms = await prisma.systemConfig.count({ 
      where: { tenantId, key: { startsWith: 'form_' } } 
    });
    
    // 获取本月新增数据
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    
    const monthlyNewProducts = await prisma.product.count({ 
      where: { tenantId, createdAt: { gte: startOfMonth } } 
    });
    
    const monthlyNewOrders = await prisma.order.count({ 
      where: { tenantId, createdAt: { gte: startOfMonth } } 
    });
    
    const monthlyNewMembers = await prisma.member.count({ 
      where: { tenantId, createdAt: { gte: startOfMonth } } 
    });
    
    const monthlyNewLeads = await prisma.systemConfig.count({ 
      where: { tenantId, key: { startsWith: 'lead_' }, value: { contains: startOfMonth.toISOString() } } 
    });
    
    // 获取订单统计
    const orders = await prisma.order.findMany({ where: { tenantId } });
    const totalOrderAmount = orders.reduce((sum, order) => sum + order.payAmount, 0);
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    
    // 获取最近7天的订单趋势
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentOrders = await prisma.order.findMany({ 
      where: { tenantId, createdAt: { gte: sevenDaysAgo } } 
    });
    
    // 按日期聚合订单金额
    const orderTrend: { [key: string]: number } = recentOrders.reduce<{ [key: string]: number }>((acc, order) => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = 0;
      acc[date] += order.payAmount;
      return acc;
    }, {});
    
    const orderTrendData = Object.entries(orderTrend)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    success(res, {
      stats: {
        totalProducts,
        totalOrders,
        totalMembers,
        totalAppointments,
        totalExternalWebsites,
        totalContents,
        totalEmployeeTasks,
        totalLeads,
        totalCustomers,
        totalOpportunities,
        totalSites,
        totalPages,
        totalForms,
        totalOrderAmount,
        completedOrders,
      },
      monthlyStats: {
        monthlyNewProducts,
        monthlyNewOrders,
        monthlyNewMembers,
        monthlyNewLeads,
      },
      orderTrend: orderTrendData,
    });
  } catch (error: any) {
    fail(res, error.message);
  }
});

// ===== 表单管理 =====

// 获取表单列表
router.get('/forms', async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '20', status, category } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    
    // 构建查询条件
    const whereConditions: any = {
      tenantId: req.user!.tenantId,
      key: { startsWith: 'form_' },
    };
    
    if (status) whereConditions.value = { contains: status.toString() };
    if (category) whereConditions.value = { contains: category.toString() };
    
    const forms = await prisma.systemConfig.findMany({
      where: whereConditions,
      skip,
      take: Number(pageSize),
      orderBy: { createdAt: 'desc' },
    });
    
    const totalCount = await prisma.systemConfig.count({ where: whereConditions });
    
    const formList = forms.map(item => {
      const data = JSON.parse(item.value);
      return {
        id: item.key.replace('form_', ''),
        ...data,
      };
    });
    
    success(res, {
      list: formList,
      pagination: {
        current: Number(page),
        pageSize: Number(pageSize),
        total: totalCount,
      },
    });
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 创建表单
router.post('/forms', async (req: Request, res: Response) => {
  try {
    const {
      customerName, customerCompany, customerPhone, customerEmail,
      formName, formType, fields, status, description
    } = req.body;
    
    const formId = `form_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const formData = {
      customerName,
      customerCompany,
      customerPhone,
      customerEmail,
      formName,
      formType,
      fields: fields || [],
      status: status || 'draft',
      description,
      submissions: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await prisma.systemConfig.create({
      data: {
        tenantId: req.user!.tenantId,
        key: `form_${formId}`,
        value: JSON.stringify(formData),
      },
    });
    
    success(res, { id: formId, ...formData }, '表单创建成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 更新表单
router.put('/forms/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      customerName, customerCompany, customerPhone, customerEmail,
      formName, formType, fields, status, description
    } = req.body;
    
    const existingConfig = await prisma.systemConfig.findUnique({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `form_${id}` 
        } 
      },
    });
    
    if (!existingConfig) {
      return notFound(res, '表单不存在');
    }
    
    const existingData = JSON.parse(existingConfig.value);
    const updatedData = {
      ...existingData,
      customerName: customerName !== undefined ? customerName : existingData.customerName,
      customerCompany: customerCompany !== undefined ? customerCompany : existingData.customerCompany,
      customerPhone: customerPhone !== undefined ? customerPhone : existingData.customerPhone,
      customerEmail: customerEmail !== undefined ? customerEmail : existingData.customerEmail,
      formName: formName !== undefined ? formName : existingData.formName,
      formType: formType !== undefined ? formType : existingData.formType,
      fields: fields !== undefined ? fields : existingData.fields,
      status: status !== undefined ? status : existingData.status,
      description: description !== undefined ? description : existingData.description,
      updatedAt: new Date(),
    };
    
    await prisma.systemConfig.update({
      where: { id: existingConfig.id },
      data: { value: JSON.stringify(updatedData) },
    });
    
    success(res, { id, ...updatedData }, '表单更新成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 删除表单
router.delete('/forms/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await prisma.systemConfig.delete({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `form_${id}` 
        } 
      },
    });
    
    success(res, { id }, '表单删除成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 获取表单提交记录
router.get('/form-submissions', async (req: Request, res: Response) => {
  try {
    const { formId, page = '1', pageSize = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    
    // 构建查询条件
    const whereConditions: any = {
      tenantId: req.user!.tenantId,
      key: { startsWith: 'form_submission_' },
    };
    
    if (formId) whereConditions.value = { contains: formId.toString() };
    
    const submissions = await prisma.systemConfig.findMany({
      where: whereConditions,
      skip,
      take: Number(pageSize),
      orderBy: { createdAt: 'desc' },
    });
    
    const totalCount = await prisma.systemConfig.count({ where: whereConditions });
    
    const submissionList = submissions.map(item => {
      const data = JSON.parse(item.value);
      return {
        id: item.key.replace('form_submission_', ''),
        ...data,
      };
    });
    
    success(res, {
      list: submissionList,
      pagination: {
        current: Number(page),
        pageSize: Number(pageSize),
        total: totalCount,
      },
    });
  } catch (error: any) {
    fail(res, error.message);
  }
});

// 提交表单
router.post('/forms/:id/submit', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const formData = req.body;
    
    // 验证表单是否存在且处于活动状态
    const formConfig = await prisma.systemConfig.findUnique({
      where: { 
        tenantId_key: { 
          tenantId: req.user!.tenantId, 
          key: `form_${id}` 
        } 
      },
    });
    
    if (!formConfig) {
      return notFound(res, '表单不存在');
    }
    
    const formDataParsed = JSON.parse(formConfig.value);
    if (formDataParsed.status !== 'active') {
      return fail(res, '表单当前不可提交');
    }
    
    // 保存表单提交记录
    const submissionId = `fs_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const submissionData = {
      formId: id,
      formData,
      submittedAt: new Date(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    };
    
    await prisma.systemConfig.create({
      data: {
        tenantId: req.user!.tenantId,
        key: `form_submission_${submissionId}`,
        value: JSON.stringify(submissionData),
      },
    });
    
    // 更新表单提交次数
    formDataParsed.submissions = (formDataParsed.submissions || 0) + 1;
    await prisma.systemConfig.update({
      where: { id: formConfig.id },
      data: { value: JSON.stringify(formDataParsed) },
    });
    
    success(res, { id: submissionId }, '表单提交成功');
  } catch (error: any) {
    fail(res, error.message);
  }
});

export default router;
