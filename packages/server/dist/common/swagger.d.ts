declare const swaggerDocument: {
    openapi: string;
    info: {
        title: string;
        description: string;
        version: string;
        contact: {
            name: string;
        };
    };
    servers: {
        url: string;
        description: string;
    }[];
    components: {
        securitySchemes: {
            bearerAuth: {
                type: string;
                scheme: string;
                bearerFormat: string;
                description: string;
            };
        };
        schemas: {
            LoginRequest: {
                type: string;
                required: string[];
                properties: {
                    email: {
                        type: string;
                        example: string;
                    };
                    password: {
                        type: string;
                        example: string;
                    };
                };
            };
            RegisterRequest: {
                type: string;
                required: string[];
                properties: {
                    name: {
                        type: string;
                        example: string;
                    };
                    email: {
                        type: string;
                        example: string;
                    };
                    password: {
                        type: string;
                        example: string;
                    };
                    phone: {
                        type: string;
                        example: string;
                    };
                };
            };
            LeadCreate: {
                type: string;
                required: string[];
                properties: {
                    name: {
                        type: string;
                        example: string;
                    };
                    phone: {
                        type: string;
                        example: string;
                    };
                    email: {
                        type: string;
                        example: string;
                    };
                    company: {
                        type: string;
                        example: string;
                    };
                    source: {
                        type: string;
                        example: string;
                    };
                    note: {
                        type: string;
                        example: string;
                    };
                };
            };
            CustomerCreate: {
                type: string;
                required: string[];
                properties: {
                    name: {
                        type: string;
                        example: string;
                    };
                    industry: {
                        type: string;
                        example: string;
                    };
                    level: {
                        type: string;
                        example: string;
                    };
                    contactName: {
                        type: string;
                        example: string;
                    };
                    contactPhone: {
                        type: string;
                        example: string;
                    };
                };
            };
            ArticleCreate: {
                type: string;
                required: string[];
                properties: {
                    title: {
                        type: string;
                        example: string;
                    };
                    summary: {
                        type: string;
                        example: string;
                    };
                    content: {
                        type: string;
                        example: string;
                    };
                    type: {
                        type: string;
                        example: string;
                    };
                    tags: {
                        type: string;
                        example: string;
                    };
                };
            };
            ProductCreate: {
                type: string;
                required: string[];
                properties: {
                    name: {
                        type: string;
                        example: string;
                    };
                    description: {
                        type: string;
                        example: string;
                    };
                    price: {
                        type: string;
                        example: number;
                    };
                    category: {
                        type: string;
                        example: string;
                    };
                    stock: {
                        type: string;
                        example: number;
                    };
                    images: {
                        type: string;
                        example: string;
                    };
                    tags: {
                        type: string;
                        example: string;
                    };
                };
            };
            ErrorResponse: {
                type: string;
                properties: {
                    code: {
                        type: string;
                        example: number;
                    };
                    message: {
                        type: string;
                        example: string;
                    };
                    data: {
                        type: string;
                    };
                };
            };
            SuccessResponse: {
                type: string;
                properties: {
                    code: {
                        type: string;
                        example: number;
                    };
                    message: {
                        type: string;
                        example: string;
                    };
                    data: {
                        type: string;
                    };
                };
            };
        };
    };
    security: {
        bearerAuth: any[];
    }[];
    paths: {
        '/api/v1/auth/login': {
            post: {
                tags: string[];
                summary: string;
                description: string;
                security: any[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        code: {
                                            type: string;
                                            example: number;
                                        };
                                        data: {
                                            type: string;
                                            properties: {
                                                token: {
                                                    type: string;
                                                };
                                                refreshToken: {
                                                    type: string;
                                                };
                                                user: {
                                                    type: string;
                                                    properties: {
                                                        id: {
                                                            type: string;
                                                        };
                                                        name: {
                                                            type: string;
                                                        };
                                                        email: {
                                                            type: string;
                                                        };
                                                        role: {
                                                            type: string;
                                                        };
                                                    };
                                                };
                                                tenant: {
                                                    type: string;
                                                    properties: {
                                                        id: {
                                                            type: string;
                                                        };
                                                        name: {
                                                            type: string;
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/auth/register': {
            post: {
                tags: string[];
                summary: string;
                description: string;
                security: any[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                    };
                    400: {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/auth/me': {
            get: {
                tags: string[];
                summary: string;
                responses: {
                    200: {
                        description: string;
                    };
                    401: {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/cms/sites': {
            get: {
                tags: string[];
                summary: string;
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
            post: {
                tags: string[];
                summary: string;
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    name: {
                                        type: string;
                                        example: string;
                                    };
                                    type: {
                                        type: string;
                                        example: string;
                                    };
                                    domain: {
                                        type: string;
                                        example: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/scrm/leads': {
            get: {
                tags: string[];
                summary: string;
                parameters: {
                    name: string;
                    in: string;
                    schema: {
                        type: string;
                    };
                    description: string;
                }[];
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
            post: {
                tags: string[];
                summary: string;
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/scrm/customers': {
            get: {
                tags: string[];
                summary: string;
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
            post: {
                tags: string[];
                summary: string;
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/scrm/opportunities': {
            get: {
                tags: string[];
                summary: string;
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
            post: {
                tags: string[];
                summary: string;
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    customerId: {
                                        type: string;
                                    };
                                    title: {
                                        type: string;
                                        example: string;
                                    };
                                    amount: {
                                        type: string;
                                        example: number;
                                    };
                                    stage: {
                                        type: string;
                                        example: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/content/articles': {
            get: {
                tags: string[];
                summary: string;
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
            post: {
                tags: string[];
                summary: string;
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/mall/products': {
            get: {
                tags: string[];
                summary: string;
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
            post: {
                tags: string[];
                summary: string;
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/mall/orders': {
            get: {
                tags: string[];
                summary: string;
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/dashboard': {
            get: {
                tags: string[];
                summary: string;
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
        '/api/v1/dashboard/funnel': {
            get: {
                tags: string[];
                summary: string;
                responses: {
                    200: {
                        description: string;
                    };
                };
            };
        };
    };
};
export default swaggerDocument;
//# sourceMappingURL=swagger.d.ts.map