import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // Allow Level 2 and Level 3 to register new leagues
    if (!session || (session.user as any).role < 2) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, fullName, location, description } = await request.json();

    const newLeague = await prisma.league.create({
      data: { name, fullName, location, description }
    });

    return NextResponse.json(newLeague);
  } catch (error: any) {
    return NextResponse.json({ error: "Creation failed" }, { status: 500 });
  }
}