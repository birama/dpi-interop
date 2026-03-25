import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.user.updateMany({ data: { mustChangePassword: false } });
  console.log(`All users updated: ${result.count} (mustChangePassword=false)`);
}
main().finally(() => prisma.$disconnect());
