FROM node:20-slim
WORKDIR /app
COPY packages/server/package.json packages/server/package-lock.json* ./packages/server/
RUN cd packages/server && npm install --omit=dev
COPY packages/server/ ./packages/server/
COPY packages/server/prisma/ ./packages/server/prisma/
RUN cd packages/server && npx prisma@5.22.0 generate
EXPOSE 8080
CMD cd packages/server && npx prisma@5.22.0 db push --skip-generate && node dist/app.js
