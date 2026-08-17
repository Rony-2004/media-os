import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';

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
          password: hashSync(TEST_USER.password, 12),
        },
      });
    }

    console.log('[SEED] User already exists, skipping.\n');
    console.log(`  Email:    ${TEST_USER.email}`);
    console.log(`  Password: ${TEST_USER.password}`);
    console.log(`  Status:   Email verified, ready to login\n`);
    return;
  }

  const passwordHash = hashSync(TEST_USER.password, 12);

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

  console.log('[SEED] Test user created!\n');
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
  .finally(() => prisma.$disconnect());
