import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { name, email, password, leagueId, requestedRole } = await request.json();

    if (!email || !password || !name || !leagueId) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // 1. Check if the user already exists
    const existingUser = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase() } 
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered. Please log in to request access." }, { status: 400 });
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create the user AND their pending membership in one step
    const newUser = await prisma.user.create({
      data: { 
        name: name.trim(), 
        email: email.toLowerCase().trim(), 
        password: hashedPassword,
        memberships: {
          create: {
            leagueId: parseInt(leagueId),
            roleLevel: parseInt(requestedRole) || 1, // 1 = Scorekeeper, 2 = Assistant Commish
            isApproved: false                        // MUST wait for Commissioner approval!
          }
        }
      }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Join Registration Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}