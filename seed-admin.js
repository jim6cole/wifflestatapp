const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('YourSuperSecretPassword123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@wrc.com' },
    update: {},
    create: {
      email: 'admin@wrc.com',
      name: 'Jum',
      password: hashedPassword,
      roleLevel: 3,
      isApproved: true,
    },
  });
  console.log('Global Admin Created:', admin.email);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());