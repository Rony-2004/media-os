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
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TEST_USER = {
  name: 'Test User',
  email: 'test@connectus.dev',
  password: 'Password123',
};

async function seedUser() {
  console.log('\n[SEED] Creating test user...\n');

  const existing = await prisma.user.findUnique({
    where: { email: TEST_USER.email },
  });

  if (existing) {
    const credentialAccount = await prisma.account.findFirst({
      where: { userId: existing.id, providerId: 'credential' },
    });

    if (!credentialAccount) {
      await prisma.account.create({
        data: {
          id: `credential_${existing.id}`,
          accountId: existing.id,
          providerId: 'credential',
          userId: existing.id,
          password: await bcrypt.hash(TEST_USER.password, 12),
        },
      });
    }

    console.log('[SEED] User already exists, skipping.\n');
    console.log(`  Email:    ${TEST_USER.email}`);
    console.log(`  Password: ${TEST_USER.password}`);
    console.log(`  Status:   Email verified, ready to login\n`);
    return;
  }

  const passwordHash = await bcrypt.hash(TEST_USER.password, 12);

  const user = await prisma.user.create({
    data: {
      name: TEST_USER.name,
      email: TEST_USER.email,
      emailVerified: true,
    },
  });

  await prisma.account.create({
    data: {
      id: `credential_${user.id}`,
      accountId: user.id,
      providerId: 'credential',
      userId: user.id,
      password: passwordHash,
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
