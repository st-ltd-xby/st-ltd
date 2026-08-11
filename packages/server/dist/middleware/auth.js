"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.authorizeRole = authorizeRole;
exports.optionalAuth = optionalAuth;
exports.generateToken = generateToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const response_1 = require("../common/response");
const JWT_SECRET = process.env.JWT_SECRET || 'ltd-hub-jwt-secret-key-2026';
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return (0, response_1.unauthorized)(res);
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        return (0, response_1.unauthorized)(res, 'Token 已过期，请重新登录');
    }
}
// 授权角色中间件
function authorizeRole(allowedRoles) {
    return function (req, res, next) {
        if (!req.user) {
            return (0, response_1.unauthorized)(res, '未授权访问');
        }
        if (!allowedRoles.includes(req.user.role)) {
            return (0, response_1.unauthorized)(res, '权限不足');
        }
        next();
    };
}
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.substring(7);
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            req.user = decoded;
        }
        catch { }
    }
    next();
}
function generateToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
}
function generateRefreshToken(payload) {
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_REFRESH_SECRET || 'ltd-hub-refresh', {
        expiresIn: '30d',
    });
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, JWT_SECRET);
}
//# sourceMappingURL=auth.js.map