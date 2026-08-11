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
// Vercel Serverless Entry Point
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const error_1 = require("./middleware/error");
const welcome_1 = require("./common/welcome");
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
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/', (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { code: 429, message: '请求过于频繁，请稍后再试', data: null },
}));
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(welcome_1.welcomeHtml);
});
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/auth', admin_auth_routes_1.default);
app.use('/api/v1/cms', cms_routes_1.default);
app.use('/api/v1/scrm', scrm_routes_1.default);
app.use('/api/v1/content', content_routes_1.default);
app.use('/api/v1/mall', mall_routes_1.default);
app.use('/api/v1', dashboard_routes_1.default);
app.use('/api/v1/promotion', promotion_routes_1.default);
app.use('/api/v1/admin', admin_routes_1.adminRouter);
app.use('/api/v1', upload_routes_1.default);
// 静态文件服务
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../../uploads')));
// 短链跳转
app.get('/t/:shortCode', async (req, res) => {
    try {
        const prisma = (await Promise.resolve().then(() => __importStar(require('./common/prisma')))).default;
        const link = await prisma.trackingLink.findUnique({ where: { shortCode: req.params.shortCode } });
        if (link) {
            await prisma.trackingLink.update({ where: { id: link.id }, data: { clickCount: { increment: 1 } } });
            res.redirect(link.targetUrl);
        }
        else {
            res.status(404).send('链接不存在');
        }
    }
    catch {
        res.status(500).send('服务器错误');
    }
});
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});
app.use(error_1.notFoundHandler);
app.use(error_1.errorHandler);
// Vercel serverless export
exports.default = app;
//# sourceMappingURL=vercel-app.js.map