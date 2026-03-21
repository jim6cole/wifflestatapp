const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  // You can change this password to whatever you want
  const hashedPassword = await bcrypt.hash('CommishPassword123', 10);
  
  const commish = await prisma.user.upsert({
    where: { email: 'commish@wrc.com' },
    update: {},
    create: {
      email: 'commish@wrc.com',
      name: 'Test Commish',
      password: hashedPassword,
      roleLevel: 2,       // Level 2 = League Commissioner
      isApproved: true,   // Instantly approve them
      leagueId: 1,        // CRITICAL: This ties them to League #1
    },
  });
  console.log('Level 2 Commish Created:', commish.email);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());