import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Await the params before using them (Next.js 15 requirement)
    const { id } = await params;
    
    // 2. Parse the ID as a number
    const teamId = parseInt(id);

    if (isNaN(teamId)) {
      return NextResponse.json({ error: "Invalid Team ID" }, { status: 400 });
    }

    // 3. Fetch the players
    const players = await prisma.player.findMany({
      where: { teamId: teamId },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(players);
  } catch (error: any) {
    console.error("DEBUG ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}