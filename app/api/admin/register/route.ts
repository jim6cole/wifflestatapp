import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = await prisma.user.create({
      data: { 
        name: name.trim(), 
        email: email.toLowerCase().trim(), 
        password: hashedPassword,
        verificationToken
      }
    });

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    await resend.emails.send({
      from: 'Wiff+ <commissioner@wiffplus.com>',
      to: newUser.email,
      subject: 'Verify your Wiff+ Clearance',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #001d3d; color: white; padding: 40px; border: 8px solid #c1121f;">
          <h1 style="color: #ffd60a; font-style: italic; text-transform: uppercase;">Clearance Required</h1>
          <p style="font-size: 16px; line-height: 1.5;">Commissioner ${newUser.name},</p>
          <p style="font-size: 16px; line-height: 1.5;">Your profile has been generated. To initialize your access to Wiff+, you must verify your identity by clicking the secure link below.</p>
          <a href="${verifyUrl}" style="display: inline-block; background-color: #c1121f; color: white; padding: 15px 25px; text-decoration: none; font-weight: bold; text-transform: uppercase; margin-top: 20px; border: 2px solid white;">Verify Identity</a>
        </div>
      `,
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