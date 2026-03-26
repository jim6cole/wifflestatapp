// promote-jim.mjs
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function promote() {
  const email = "jim6cole@gmail.com";
  
  console.log(`⚾ Scouting report: Looking for ${email}...`);

  try {
    const user = await prisma.user.update({
      where: { email: email },
      data: { isGlobalAdmin: true },
    });

    console.log(`✅ CALL UP SUCCESSFUL!`);
    console.log(`User: ${user.name}`);
    console.log(`Status: GLOBAL ADMIN ACTIVATED`);
  } catch (error) {
    console.error("❌ ERROR: User not found in database.");
    console.error("Make sure you have officially REGISTERED on the website first!");
  } finally {
    await prisma.$disconnect();
  }
}

promote();