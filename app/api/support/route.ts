import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Make sure process.env.RESEND_API_KEY is configured in your environment
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      // We use your existing verified domain for sending
      from: 'WIFF+ Ground Crew <noreply@wiffplus.com>', 
      // It sends TO your actual support inbox
      to: ['support@wiffplus.com'],
      // When you click 'reply' in your email client, it goes to the user
      replyTo: email,
      subject: `WIFF+ Ticket: New Support Request from ${name}`,
      text: `Incoming Support Request\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    if (error) {
      console.error("Resend Error:", error);
      return NextResponse.json({ error: "Email provider rejected the request." }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Support API Error:", err);
    return NextResponse.json({ error: "Internal server error. Failed to process ticket." }, { status: 500 });
  }
}