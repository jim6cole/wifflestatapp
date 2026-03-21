import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      where: {
        status: "UPCOMING", // Only show games that haven't started
      },
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
        season: { select: { name: true, id: true } }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    return NextResponse.json(games);
  } catch (error: any) {
    console.error("Active Games Fetch Error:", error.message);
    return NextResponse.json({ error: "Failed to load active games" }, { status: 500 });
  }
}