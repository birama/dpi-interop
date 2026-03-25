import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: { role: 'ADMIN' },
    data: { mustChangePassword: false },
  });
  console.log(`Admin users updated: ${result.count}`);
}

main()
  .finally(() => prisma.$disconnect());
