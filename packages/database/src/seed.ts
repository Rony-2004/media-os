/**
 * Main database seed script.
 * Seeds development data for testing.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('[SEED] Starting database seed...\n');

  // Run the user seed
  await import('./seed-user');

  console.log('[SEED] Database seeding complete.\n');
}

seed()
  .catch((e) => {
    console.error('[SEED] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
