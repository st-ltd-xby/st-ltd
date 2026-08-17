FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app/packages/server
COPY packages/server/package.json ./
RUN npm install --legacy-peer-deps
# 复制本地已编译的 dist 文件夹（避免在 Railway 上重新编译 TypeScript）
COPY packages/server/dist/ ./dist/
COPY packages/server/prisma/ ./prisma/
COPY packages/server/mobile-pages-inline.html ./mobile-pages-inline.html
EXPOSE 8080
CMD npx prisma@5.22.0 db push --force-reset && node dist/app.js
