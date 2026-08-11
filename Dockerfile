FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app/packages/server
COPY packages/server/package.json ./
RUN npm install --legacy-peer-deps
COPY packages/server/ ./
RUN npx prisma@5.22.0 generate
EXPOSE 8080
CMD npx prisma@5.22.0 db push --skip-generate && npx tsx src/app.ts
