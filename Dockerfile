FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY packages/server/package.json packages/server/package-lock.json* ./packages/server/
RUN cd packages/server && npm install
COPY packages/server/ ./packages/server/
RUN cd packages/server && npx prisma@5.22.0 generate && npx tsc --skipLibCheck || true
EXPOSE 8080
CMD cd packages/server && npx prisma@5.22.0 db push --skip-generate && node dist/app.js
