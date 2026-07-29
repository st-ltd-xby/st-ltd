import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[Error]', err.message || err);

  if (err.name === 'ZodError') {
    return res.status(400).json({
      code: 400,
      message: '请求参数校验失败',
      data: err.errors,
    });
  }

  if (err.code === 'P2002') {
    return res.status(400).json({
      code: 400,
      message: '数据已存在 (唯一约束冲突)',
      data: null,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      code: 404,
      message: '记录不存在',
      data: null,
    });
  }

  const status = err.status || 500;
  const message = err.message || '服务器内部错误';

  res.status(status).json({ code: status, message, data: null });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    code: 404,
    message: `路由 ${req.method} ${req.path} 不存在`,
    data: null,
  });
}
