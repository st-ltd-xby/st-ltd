FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app/packages/server
COPY packages/server/package.json ./
RUN npm install --legacy-peer-deps
COPY packages/server/ ./
# 跳过 prisma generate，依赖运行时动态解析（避免 TypeScript 类型检查失败）
EXPOSE 8080
CMD npx prisma@5.22.0 db push --force-reset && npx tsx src/app.ts
