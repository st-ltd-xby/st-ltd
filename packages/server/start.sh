#!/bin/sh
cd /app/packages/server
npx prisma@5.22.0 db push --force-reset
exec npx tsx src/app.ts
