const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@awaa.com' },
    update: {},
    create: {
      email: 'admin@awaa.com',
      name: 'Global Root',
      password: hashedPassword,
      isGlobalAdmin: true, // The new SaaS Global Admin flag
    },
  });
  console.log('Global Admin seeded:', admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });