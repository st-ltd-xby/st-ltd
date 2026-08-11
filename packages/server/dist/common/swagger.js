"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'ST-LTD 运营管理平台 API',
        description: 'ST-LTD 运营管理平台 - 世贸搜途跨境产业云平台\n\n## 快速开始\n1. 使用 `/api/v1/auth/login` 接口登录获取 Token\n2. 点击右上角 "Authorize" 按钮，输入 Token\n3. 即可测试所有接口\n\n## 测试账号\n- 管理员：admin@ltd.com / admin123\n- 员工：zhangsan@ltd.com / employee123',
        version: '1.0.0',
        contact: {
            name: 'ST-LTD',
        },
    },
    servers: [
        {
            url: 'http://localhost:3000',
            description: '本地开发环境',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: '登录成功后返回的 Token',
            },
        },
        schemas: {
            LoginRequest: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', example: 'admin@ltd.com' },
                    password: { type: 'string', example: 'admin123' },
                },
            },
            RegisterRequest: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                    name: { type: 'string', example: '测试企业' },
                    email: { type: 'string', example: 'admin@company.com' },
                    password: { type: 'string', example: 'password123' },
                    phone: { type: 'string', example: '13800138000' },
                },
            },
            LeadCreate: {
                type: 'object',
                required: ['name', 'source'],
                properties: {
                    name: { type: 'string', example: '张先生' },
                    phone: { type: 'string', example: '13900139000' },
                    email: { type: 'string', example: 'zhang@example.com' },
                    company: { type: 'string', example: '某某公司' },
                    source: { type: 'string', example: 'baidu' },
                    note: { type: 'string', example: '通过百度搜索联系我们' },
                },
            },
            CustomerCreate: {
                type: 'object',
                required: ['name'],
                properties: {
                    name: { type: 'string', example: '某某科技有限公司' },
                    industry: { type: 'string', example: '互联网' },
                    level: { type: 'string', example: 'A' },
                    contactName: { type: 'string', example: '李总' },
                    contactPhone: { type: 'string', example: '13800138000' },
                },
            },
            ArticleCreate: {
                type: 'object',
                required: ['title'],
                properties: {
                    title: { type: 'string', example: '如何提升营销转化率' },
                    summary: { type: 'string', example: '本文介绍...' },
                    content: { type: 'string', example: '<p>正文内容</p>' },
                    type: { type: 'string', example: 'article' },
                    tags: { type: 'string', example: '营销,转化' },
                },
            },
            ProductCreate: {
                type: 'object',
                required: ['name', 'price'],
                properties: {
                    name: { type: 'string', example: '企业咨询服务' },
                    description: { type: 'string', example: '专业营销咨询' },
                    price: { type: 'number', example: 9999 },
                    category: { type: 'string', example: '服务' },
                    stock: { type: 'integer', example: 100 },
                    images: { type: 'string', example: '' },
                    tags: { type: 'string', example: '咨询,营销' },
                },
            },
            ErrorResponse: {
                type: 'object',
                properties: {
                    code: { type: 'integer', example: 400 },
                    message: { type: 'string', example: '请求参数错误' },
                    data: { type: 'null' },
                },
            },
            SuccessResponse: {
                type: 'object',
                properties: {
                    code: { type: 'integer', example: 0 },
                    message: { type: 'string', example: 'success' },
                    data: { type: 'object' },
                },
            },
        },
    },
    security: [
        {
            bearerAuth: [],
        },
    ],
    paths: {
        '/api/v1/auth/login': {
            post: {
                tags: ['认证'],
                summary: '用户登录',
                description: '使用邮箱和密码登录，返回 JWT Token',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/LoginRequest' },
                        },
                    },
                },
                responses: {
                    200: {
                        description: '登录成功',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        code: { type: 'integer', example: 0 },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                token: { type: 'string' },
                                                refreshToken: { type: 'string' },
                                                user: {
                                                    type: 'object',
                                                    properties: {
                                                        id: { type: 'string' },
                                                        name: { type: 'string' },
                                                        email: { type: 'string' },
                                                        role: { type: 'string' },
                                                    },
                                                },
                                                tenant: {
                                                    type: 'object',
                                                    properties: {
                                                        id: { type: 'string' },
                                                        name: { type: 'string' },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: '邮箱或密码错误' },
                },
            },
        },
        '/api/v1/auth/register': {
            post: {
                tags: ['认证'],
                summary: '用户注册',
                description: '注册新租户和管理员账号',
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/RegisterRequest' },
                        },
                    },
                },
                responses: {
                    200: { description: '注册成功' },
                    400: { description: '参数错误' },
                },
            },
        },
        '/api/v1/auth/me': {
            get: {
                tags: ['认证'],
                summary: '获取当前用户信息',
                responses: {
                    200: { description: '成功' },
                    401: { description: '未授权' },
                },
            },
        },
        '/api/v1/cms/sites': {
            get: {
                tags: ['CMS 建站'],
                summary: '获取站点列表',
                responses: { 200: { description: '成功' } },
            },
            post: {
                tags: ['CMS 建站'],
                summary: '创建站点',
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['name', 'type'],
                                properties: {
                                    name: { type: 'string', example: '企业官网' },
                                    type: { type: 'string', example: 'pc' },
                                    domain: { type: 'string', example: 'https://example.com' },
                                },
                            },
                        },
                    },
                },
                responses: { 200: { description: '成功' } },
            },
        },
        '/api/v1/scrm/leads': {
            get: {
                tags: ['SCRM 客户管理'],
                summary: '获取线索列表',
                parameters: [
                    { name: 'status', in: 'query', schema: { type: 'string' }, description: '状态筛选' },
                    { name: 'source', in: 'query', schema: { type: 'string' }, description: '来源筛选' },
                    { name: 'page', in: 'query', schema: { type: 'integer' }, description: '页码' },
                    { name: 'pageSize', in: 'query', schema: { type: 'integer' }, description: '每页数量' },
                ],
                responses: { 200: { description: '成功' } },
            },
            post: {
                tags: ['SCRM 客户管理'],
                summary: '创建线索',
                requestBody: {
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/LeadCreate' },
                        },
                    },
                },
                responses: { 200: { description: '成功' } },
            },
        },
        '/api/v1/scrm/customers': {
            get: {
                tags: ['SCRM 客户管理'],
                summary: '获取客户列表',
                responses: { 200: { description: '成功' } },
            },
            post: {
                tags: ['SCRM 客户管理'],
                summary: '创建客户',
                requestBody: {
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CustomerCreate' },
                        },
                    },
                },
                responses: { 200: { description: '成功' } },
            },
        },
        '/api/v1/scrm/opportunities': {
            get: {
                tags: ['SCRM 客户管理'],
                summary: '获取商机列表',
                responses: { 200: { description: '成功' } },
            },
            post: {
                tags: ['SCRM 客户管理'],
                summary: '创建商机',
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['customerId', 'title', 'amount'],
                                properties: {
                                    customerId: { type: 'string' },
                                    title: { type: 'string', example: 'XX公司CRM系统采购' },
                                    amount: { type: 'number', example: 50000 },
                                    stage: { type: 'string', example: 'demand' },
                                },
                            },
                        },
                    },
                },
                responses: { 200: { description: '成功' } },
            },
        },
        '/api/v1/content/articles': {
            get: {
                tags: ['内容营销'],
                summary: '获取文章列表',
                responses: { 200: { description: '成功' } },
            },
            post: {
                tags: ['内容营销'],
                summary: '发布文章',
                requestBody: {
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ArticleCreate' },
                        },
                    },
                },
                responses: { 200: { description: '成功' } },
            },
        },
        '/api/v1/mall/products': {
            get: {
                tags: ['商城管理'],
                summary: '获取商品列表',
                responses: { 200: { description: '成功' } },
            },
            post: {
                tags: ['商城管理'],
                summary: '发布商品',
                requestBody: {
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ProductCreate' },
                        },
                    },
                },
                responses: { 200: { description: '成功' } },
            },
        },
        '/api/v1/mall/orders': {
            get: {
                tags: ['商城管理'],
                summary: '获取订单列表',
                responses: { 200: { description: '成功' } },
            },
        },
        '/api/v1/dashboard': {
            get: {
                tags: ['数据看板'],
                summary: '获取看板统计数据',
                responses: { 200: { description: '成功' } },
            },
        },
        '/api/v1/dashboard/funnel': {
            get: {
                tags: ['数据看板'],
                summary: '获取转化漏斗数据',
                responses: { 200: { description: '成功' } },
            },
        },
    },
};
exports.default = swaggerDocument;
//# sourceMappingURL=swagger.js.map