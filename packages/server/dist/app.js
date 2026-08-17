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
const fs_1 = __importDefault(require("fs"));
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
// 移动端页面路由（通过后端域名访问，避免运营商拦截）
// 使用内联 HTML 方案（所有 JS/CSS 打包到单个 HTML 文件中）
// 优先从 dist 目录读取（Railway 部署后会包含此目录）
const inlineHtmlPath = path_1.default.join(__dirname, 'mobile-pages-inline.html');
let inlineHtmlContent = '';
if (fs_1.default.existsSync(inlineHtmlPath)) {
    inlineHtmlContent = fs_1.default.readFileSync(inlineHtmlPath, 'utf-8');
    console.log('✓ Mobile pages inline HTML loaded successfully from dist (size:', inlineHtmlContent.length, 'bytes)');
}
else {
    // 备用路径：从源码目录读取（本地开发时使用）
    const srcInlineHtmlPath = path_1.default.join(__dirname, '..', '..', 'server', 'mobile-pages-inline.html');
    if (fs_1.default.existsSync(srcInlineHtmlPath)) {
        inlineHtmlContent = fs_1.default.readFileSync(srcInlineHtmlPath, 'utf-8');
        console.log('✓ Mobile pages inline HTML loaded from src (size:', inlineHtmlContent.length, 'bytes)');
    }
    else {
        console.warn(' Warning: Mobile pages inline HTML not found at', inlineHtmlPath, 'or', srcInlineHtmlPath);
    }
}
// 名片扫描页面
app.get('/scan', (req, res) => {
    if (!inlineHtmlContent) {
        return res.status(500).send('Mobile pages not available');
    }
    // 替换标题
    let html = inlineHtmlContent.replace('<title>ST-LTD 运营系统 - FIX20260811-SEO</title>', '<title>名片扫描 - ST-LTD</title>');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
});
// 移动拜访页面
app.get('/mobile-visits', (req, res) => {
    if (!inlineHtmlContent) {
        return res.status(500).send('Mobile pages not available');
    }
    // 替换标题
    let html = inlineHtmlContent.replace('<title>ST-LTD 运营系统 - FIX20260811-SEO</title>', '<title>移动拜访 - ST-LTD</title>');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
});
// 静态资源代理（从 dist/public 文件夹读取）
app.use('/assets/*', async (req, res) => {
    try {
        const assetPath = req.path.replace(/^\/assets\//, '');
        const localPath = path_1.default.join(__dirname, 'public/assets', assetPath);
        if (!fs_1.default.existsSync(localPath)) {
            console.warn(`Asset not found: ${localPath}`);
            return res.status(404).send('Not Found');
        }
        const content = fs_1.default.readFileSync(localPath);
        const contentType = assetPath.endsWith('.js') ? 'application/javascript' :
            assetPath.endsWith('.css') ? 'text/css' : 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.send(content);
    }
    catch (error) {
        console.error('Failed to read asset:', req.path, error);
        res.status(500).send('Internal Server Error');
    }
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
// FC 环境中 NODE_ENV=production 且没有 PORT 环境变量（FC 使用内部端口）
const isServerless = process.env.VERCEL || (process.env.NODE_ENV === 'production' && !process.env.PORT);
if (!isServerless) {
    start();
}
exports.default = app;
//# sourceMappingURL=app.js.map