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

  const passwordHash = await bcrypt.hash(TEST_USER.password, 12);

  const existing = await prisma.user.findUnique({
    where: { email: TEST_USER.email },
  });

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: TEST_USER.name,
          emailVerified: true,
          isActive: true,
          isBlocked: false,
        },
      })
    : await prisma.user.create({
        data: {
          name: TEST_USER.name,
          email: TEST_USER.email,
          emailVerified: true,
        },
      });

  await prisma.account.upsert({
    where: {
      providerId_accountId: {
        providerId: 'credential',
        accountId: user.id,
      },
    },
    update: { password: passwordHash },
    create: {
      id: `credential_${user.id}`,
      accountId: user.id,
      providerId: 'credential',
      userId: user.id,
      password: passwordHash,
    },
  });

  console.log(existing ? '[SEED] Test user updated!\n' : '[SEED] Test user created successfully!\n');
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
