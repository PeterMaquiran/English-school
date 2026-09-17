import { config as loadEnv } from 'dotenv';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

const prisma = new PrismaClient();

const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@school.local').toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
const name = process.env.SEED_ADMIN_NAME ?? 'School Admin';

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: Role.admin },
    create: {
      name,
      email,
      passwordHash,
      role: Role.admin,
    },
  });
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
