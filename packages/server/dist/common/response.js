"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.success = success;
exports.successWithPagination = successWithPagination;
exports.fail = fail;
exports.unauthorized = unauthorized;
exports.forbidden = forbidden;
exports.notFound = notFound;
exports.serverError = serverError;
function success(res, data = null, message = 'success') {
    return res.json({ code: 0, data, message });
}
function successWithPagination(res, data, pagination, message = 'success') {
    return res.json({ code: 0, data, message, pagination });
}
function fail(res, message = '操作失败', code = -1) {
    return res.status(400).json({ code, message, data: null });
}
function unauthorized(res, message = '未授权，请先登录') {
    return res.status(401).json({ code: 401, message, data: null });
}
function forbidden(res, message = '没有权限执行此操作') {
    return res.status(403).json({ code: 403, message, data: null });
}
function notFound(res, message = '资源不存在') {
    return res.status(404).json({ code: 404, message, data: null });
}
function serverError(res, message = '服务器内部错误') {
    return res.status(500).json({ code: 500, message, data: null });
}
//# sourceMappingURL=response.js.map