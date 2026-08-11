import { Response } from 'express';
interface PaginationData {
    page: number;
    pageSize: number;
    total: number;
}
export declare function success(res: Response, data?: any, message?: string): Response<any, Record<string, any>>;
export declare function successWithPagination(res: Response, data: any[], pagination: PaginationData, message?: string): Response<any, Record<string, any>>;
export declare function fail(res: Response, message?: string, code?: number): Response<any, Record<string, any>>;
export declare function unauthorized(res: Response, message?: string): Response<any, Record<string, any>>;
export declare function forbidden(res: Response, message?: string): Response<any, Record<string, any>>;
export declare function notFound(res: Response, message?: string): Response<any, Record<string, any>>;
export declare function serverError(res: Response, message?: string): Response<any, Record<string, any>>;
export {};
//# sourceMappingURL=response.d.ts.map