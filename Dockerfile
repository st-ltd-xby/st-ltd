FROM node:20-slim
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY packages/server/package.json packages/server/package-lock.json* ./packages/server/
RUN cd packages/server && npm install --omit=dev && npm install -D prisma@5.22.0
COPY packages/server/ ./packages/server/
COPY packages/server/prisma/ ./packages/server/prisma/
RUN cd packages/server && npx prisma generate
EXPOSE 8080
CMD cd packages/server && npx prisma db push --skip-generate && node dist/app.js
