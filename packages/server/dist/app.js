"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const error_1 = require("./middleware/error");
const swagger_1 = __importDefault(require("./common/swagger"));
const welcome_1 = require("./common/welcome");
const seed_1 = require("./common/seed");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const cms_routes_1 = __importDefault(require("./modules/cms/cms.routes"));
const scrm_routes_1 = __importDefault(require("./modules/scrm/scrm.routes"));
const content_routes_1 = __importDefault(require("./modules/content/content.routes"));
const mall_routes_1 = __importDefault(require("./modules/mall/mall.routes"));
const dashboard_routes_1 = __importDefault(require("./modules/dashboard/dashboard.routes"));
const promotion_routes_1 = __importDefault(require("./modules/promotion/promotion.routes"));
const admin_routes_1 = require("./modules/admin/admin.routes");
const admin_auth_routes_1 = __importDefault(require("./modules/admin/admin.auth.routes"));
const upload_routes_1 = __importDefault(require("./modules/upload/upload.routes"));
const agent_routes_1 = __importDefault(require("./modules/agent/agent.routes"));
const ai_tools_routes_1 = __importDefault(require("./modules/ai-tools/ai-tools.routes"));
const visitor_routes_1 = __importDefault(require("./modules/visitor/visitor.routes"));
const public_routes_1 = __importDefault(require("./modules/public/public.routes"));
const ocr_routes_1 = __importDefault(require("./modules/ocr/ocr.routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// 健康检查（必须在最前面）
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0', aiTools: 'registered' });
});
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(welcome_1.welcomeHtml);
});
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default, {
    customSiteTitle: 'ST-LTD',
    customCss: '.swagger-ui .topbar { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }',
}));
app.use('/api/v1/auth', auth_routes_1.default);
// 管理员认证路由（必须在dashboardRoutes之前）
app.use('/api/v1/admin-auth', admin_auth_routes_1.default);
// OCR路由（公开接口，必须在dashboardRoutes之前）
app.use('/api/v1/ocr', ocr_routes_1.default);
app.use('/api/v1/agent', agent_routes_1.default);
app.use('/api/v1/ai', ai_tools_routes_1.default);
app.use('/api/v1/cms', cms_routes_1.default);
app.use('/api/v1/scrm', scrm_routes_1.default);
app.use('/api/v1/content', content_routes_1.default);
app.use('/api/v1/mall', mall_routes_1.default);
app.use('/api/v1', visitor_routes_1.default);
app.use('/api/v1', dashboard_routes_1.default);
app.use('/api/v1/promotion', promotion_routes_1.default);
app.use('/api/v1/admin', admin_routes_1.adminRouter);
app.use('/api/v1', upload_routes_1.default);
app.use('/api/v1/public', public_routes_1.default);
// 静态文件服务 - 上传目录
app.use('/uploads', express_1.default.static(path_1.default.resolve(process.cwd(), 'uploads')));
// 短链跳转（公开接口）- 支持 JSON 解析和直接跳转
app.get('/t/:shortCode', async (req, res) => {
    try {
        const prisma = (await Promise.resolve().then(() => __importStar(require('./common/prisma')))).default;
        const link = await prisma.trackingLink.findUnique({ where: { shortCode: req.params.shortCode } });
        if (link) {
            await prisma.trackingLink.update({ where: { id: link.id }, data: { clickCount: { increment: 1 } } });
            // 在目标URL上追加 promo 追踪参数
            const separator = link.targetUrl.includes('?') ? '&' : '?';
            const redirectUrl = `${link.targetUrl}${separator}promo=${link.shortCode}`;
            if (req.headers.accept?.includes('application/json') || req.query.resolve === 'true') {
                res.json({ code: 0, data: { targetUrl: redirectUrl, shortCode: link.shortCode } });
            }
            else {
                res.redirect(redirectUrl);
            }
        }
        else {
            res.status(404).send('链接不存在');
        }
    }
    catch {
        res.status(500).send('服务器错误');
    }
});
// 临时调试端点 - 确认AI路由是否注册
app.get('/api/v1/ai/test', (req, res) => {
    res.json({ code: 0, message: 'AI routes are working!', timestamp: new Date().toISOString() });
});
app.use(error_1.notFoundHandler);
app.use(error_1.errorHandler);
async function start() {
    // 先启动服务器，让健康检查立即可用
    app.listen(PORT, () => {
        console.log('LTD API Server started on port ' + PORT);
    });
    // 后台执行数据初始化（不阻塞启动）
    (0, seed_1.autoSeed)().catch(e => console.error('autoSeed error:', e));
}
// 仅在本地开发环境自动启动（Vercel / 阿里云 FC 等 Serverless 环境不启动）
if (!process.env.VERCEL && !process.env.FC_FUNCTION_NAME) {
    start();
}
exports.default = app;
//# sourceMappingURL=app.js.map