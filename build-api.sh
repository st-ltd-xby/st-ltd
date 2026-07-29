#!/bin/bash
# Vercel build script for ST-LTD API

cd packages/server

# Generate Prisma client
npx prisma generate

# Bundle with esbuild (skip type checking)
npx esbuild src/app.ts \
  --bundle \
  --platform=node \
  --target=node18 \
  --outfile=../../dist/server.js \
  --external:@prisma/client \
  --external:bcryptjs \
  --external:swagger-ui-express \
  --external:multer \
  --external:socket.io \
  --external:sqlite3 \
  --external:qrcode \
  --external:nodemailer \
  --packages=external

# Copy prisma schema
mkdir -p ../../dist/prisma
cp prisma/schema.prisma ../../dist/prisma/ 2>/dev/null || true

echo "Build complete!"
