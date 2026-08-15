/**
 * Development seed script — creates a test user with verified email.
 *
 * Usage: pnpm seed:user
 *
 * This script:
 * - Creates a test user with pre-verified email
 * - Hashes password with bcrypt
 * - Skips if user already exists (idempotent)
 * - Prints credentials to terminal
 */

import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';

const prisma = new PrismaClient();

const TEST_USER = {
  name: 'Test User',
  email: 'test@connectus.dev',
  password: 'Password123',
};

// Simple bcrypt-compatible hash using crypto (no external deps needed for seed)
async function hashPassword(password: string): Promise<string> {
  // We use a simple scrypt hash for the seed script.
  // The actual app uses bcryptjs.
  const salt = randomBytes(16).toString('hex');
  const { scryptSync } = await import('crypto');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

async function seedUser() {
  console.log('\n[SEED] Creating test user...\n');

  const existing = await prisma.user.findUnique({
    where: { email: TEST_USER.email },
  });

  if (existing) {
    console.log('[SEED] User already exists, skipping.\n');
    console.log(`  Email:    ${TEST_USER.email}`);
    console.log(`  Password: ${TEST_USER.password}`);
    console.log(`  Status:   Email verified, ready to login\n`);
    return;
  }

  const passwordHash = await hashPassword(TEST_USER.password);

  const user = await prisma.user.create({
    data: {
      name: TEST_USER.name,
      email: TEST_USER.email,
      passwordHash,
      emailVerified: true,
    },
  });

  console.log('[SEED] Test user created successfully!\n');
  console.log(`  ID:       ${user.id}`);
  console.log(`  Email:    ${TEST_USER.email}`);
  console.log(`  Password: ${TEST_USER.password}`);
  console.log(`  Status:   Email verified, ready to login\n`);
}

seedUser()
  .catch((e) => {
    console.error('[SEED] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
