import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); 

    await prisma.user.update({
      where: { email },
      data: { resetToken, resetTokenExpiry },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    await resend.emails.send({
      from: 'Wiff+ Security <security@wiffplus.com>',
      to: email,
      subject: 'Wiff+: Password Reset',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #001d3d; color: white; padding: 40px; border: 8px solid #c1121f;">
          <h1 style="color: #ffd60a; font-style: italic; text-transform: uppercase;">Identity Recovery</h1>
          <p style="font-size: 16px; line-height: 1.5;">A request to reset your access key for Wiff+ has been initiated.</p>
          <p style="font-size: 16px; line-height: 1.5;">If you made this request, click the secure link below to establish a new key. This link will self-destruct in 1 hour.</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #c1121f; color: white; padding: 15px 25px; text-decoration: none; font-weight: bold; text-transform: uppercase; margin-top: 20px; border: 2px solid white;">Reset Access Key</a>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}