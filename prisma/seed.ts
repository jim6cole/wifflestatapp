const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const db = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('YourSuperSecretPassword123', 10);

  const admin = await db.user.upsert({
    where: { email: 'admin@wrc.com' },
    update: {
      password: hashedPassword,
      isGlobalAdmin: true, // Replaces roleLevel: 3
    },
    create: {
      email: 'admin@wrc.com',
      password: hashedPassword,
      name: 'Global Admin',
      isGlobalAdmin: true, // Replaces roleLevel and isApproved
    },
  });

  console.log('-----------------------------------------------');
  console.log('  DATABASE SEEDED');
  console.log(`  User: ${admin.email}`);
  console.log(`  Root Admin: ${admin.isGlobalAdmin}`);
  console.log('-----------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });