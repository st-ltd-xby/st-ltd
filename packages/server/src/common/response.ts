import { Response } from 'express';

interface PaginationData {
  page: number;
  pageSize: number;
  total: number;
}

export function success(res: Response, data: any = null, message = 'success') {
  return res.json({ code: 0, data, message });
}

export function successWithPagination(
  res: Response,
  data: any[],
  pagination: PaginationData,
  message = 'success'
) {
  return res.json({ code: 0, data, message, pagination });
}

export function fail(res: Response, message = '操作失败', code = -1) {
  return res.status(400).json({ code, message, data: null });
}

export function unauthorized(res: Response, message = '未授权，请先登录') {
  return res.status(401).json({ code: 401, message, data: null });
}

export function forbidden(res: Response, message = '没有权限执行此操作') {
  return res.status(403).json({ code: 403, message, data: null });
}

export function notFound(res: Response, message = '资源不存在') {
  return res.status(404).json({ code: 404, message, data: null });
}

export function serverError(res: Response, message = '服务器内部错误') {
  return res.status(500).json({ code: 500, message, data: null });
}
