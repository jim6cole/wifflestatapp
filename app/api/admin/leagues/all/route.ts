import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role < 3) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const leagues = await prisma.league.findMany({
    include: {
      _count: {
        select: { seasons: true, teams: true }
      }
    }
  });

  return NextResponse.json(leagues);
}