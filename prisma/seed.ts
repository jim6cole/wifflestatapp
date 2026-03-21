// @ts-ignore
const { PrismaClient } = require('@prisma/client');
// @ts-ignore
const bcrypt = require('bcryptjs');

// Using a slightly different variable name (db) prevents the "already declared" error 
// if 'prisma' is used elsewhere in your project's global types.
const db = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('YourSuperSecretPassword123', 10);
  
  const admin = await db.user.upsert({
    where: { email: 'admin@wrc.com' },
    update: {
      password: hashedPassword,
      roleLevel: 3,
    },
    create: {
      email: 'admin@wrc.com',
      password: hashedPassword,
      name: 'Global Admin',
      roleLevel: 3, 
      isApproved: true,
    },
  });

  console.log('-----------------------------------------------');
  console.log('✅ DATABASE SEEDED');
  console.log(`👤 User: ${admin.email}`);
  console.log(`🔑 Role Level: ${admin.roleLevel}`);
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