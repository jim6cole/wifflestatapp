import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const { seasonId } = await params;
    const sId = parseInt(seasonId);

    if (isNaN(sId)) {
      return NextResponse.json({ error: "Invalid Season ID" }, { status: 400 });
    }

    const games = await prisma.game.findMany({
      where: { seasonId: sId },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        // Grabs the single most recent play to power the Live Scorebug
        atBats: {
          orderBy: { id: 'desc' },
          take: 1,
        }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    return NextResponse.json(games);
  } catch (error) {
    console.error("Games API Error:", error);
    return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
  }
}