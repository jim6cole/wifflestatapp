import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase() } 
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a clean user profile. No memberships yet!
    const newUser = await prisma.user.create({
      data: { 
        name: name.trim(), 
        email: email.toLowerCase().trim(), 
        password: hashedPassword
      }
    });

    return NextResponse.json({ 
      success: true, 
      user: { id: newUser.id, email: newUser.email, name: newUser.name } 
    });

  } catch (error: any) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}