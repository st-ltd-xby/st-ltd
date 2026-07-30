// Cloudflare Workers entry point
import app from './packages/server/src/app.ts';

export default {
  async fetch(request, env, ctx) {
    // Set environment variables from Workers vars
    process.env.NODE_ENV = env.NODE_ENV || 'production';
    process.env.JWT_SECRET = env.JWT_SECRET;
    process.env.JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET;
    process.env.JWT_EXPIRES_IN = env.JWT_EXPIRES_IN;
    process.env.DATABASE_URL = env.DATABASE_URL;

    return app(request);
  },
};
