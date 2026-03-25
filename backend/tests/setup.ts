import { beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Ensure database connection
  await prisma.$connect();
  console.log('Test database connected');
});

afterAll(async () => {
  await prisma.$disconnect();
  console.log('Test database disconnected');
});
