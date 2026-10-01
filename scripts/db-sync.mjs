import { execSync } from 'child_process';

const dbUrl =
  process.env.DATABASE_URL ||
  process.env.DATABASE_POSTGRES_PRISMA_URL ||
  process.env.DATABASE_POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.PRISMA_DATABASE_URL ||
  process.env.DATABASE_POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING;

if (dbUrl) {
  process.env.DATABASE_URL = dbUrl;
}

const directUrl =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL_NON_POOLING ||
  dbUrl;

if (directUrl) {
  process.env.DATABASE_URL_UNPOOLED = directUrl;
}

if (dbUrl && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1')) {
  console.log('🔄 Syncing Cloud PostgreSQL Database Schema with Prisma...');
  try {
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log('✅ Cloud Database Schema sync completed successfully.');
  } catch (err) {
    console.warn('⚠️ Warning during DB push (will proceed with build):', err.message);
  }
} else {
  console.log('ℹ️ Local or missing remote DATABASE_URL, skipping cloud schema sync.');
}

