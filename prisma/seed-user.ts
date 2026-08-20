import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

const TEST_USERS = [
  {
    name: 'Baishali',
    email: 'baishalimukherjee2004@gmail.com',
    password: 'Baishali1234',
  },
  {
    name: 'Mir Saif Ali',
    email: 'mirsaifali@gmail.com',
    password: 'Mir1234',
  },
  {
    name: 'Akash Laha',
    email: 'akashlaha48@gmail.com',
    password: 'Akash1234',
  },
] as const;

async function seedUser(testUser: (typeof TEST_USERS)[number]) {
  console.log(`\n[SEED] Creating ${testUser.email}...\n`);

  const passwordHash = hashSync(testUser.password, 12);

  const existing = await prisma.user.findUnique({
    where: { email: testUser.email },
  });

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: testUser.name,
          emailVerified: true,
          isActive: true,
          isBlocked: false,
        },
      })
    : await prisma.user.create({
        data: {
          name: testUser.name,
          email: testUser.email,
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

  console.log(existing ? '[SEED] Test user updated!\n' : '[SEED] Test user created!\n');
  console.log(`  ID:       ${user.id}`);
  console.log(`  Email:    ${testUser.email}`);
  console.log(`  Password: ${testUser.password}`);
  console.log(`  Status:   Email verified, ready to login\n`);
}

Promise.all(TEST_USERS.map(seedUser))
  .catch((e) => {
    console.error('[SEED] Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
