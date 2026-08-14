const { execSync } = require('child_process');

// Change to server directory
process.chdir('/app/packages/server');

// Run Prisma db push
console.log('Running Prisma db push...');
execSync('npx prisma@5.22.0 db push --force-reset', { stdio: 'inherit' });

// Start the server
console.log('Starting server...');
execSync('npx tsx src/app.ts', { stdio: 'inherit' });
