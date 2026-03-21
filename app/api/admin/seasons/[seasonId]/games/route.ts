import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch all scheduled games for this season
export async function GET(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const resolvedParams = await params;
    const seasonId = parseInt(resolvedParams.seasonId);

    const games = await prisma.game.findMany({
      where: { seasonId: seasonId },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    return NextResponse.json(games);
  } catch (error) {
    console.error("Fetch Games Error:", error);
    return NextResponse.json({ error: "Failed to load schedule" }, { status: 500 });
  }
}

// POST: Schedule a new game
export async function POST(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const resolvedParams = await params;
    const seasonId = parseInt(resolvedParams.seasonId);
    
    const { homeTeamId, awayTeamId, scheduledAt } = await request.json();

    if (!homeTeamId || !awayTeamId || !scheduledAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (homeTeamId === awayTeamId) {
      return NextResponse.json({ error: "Home and Away teams cannot be the same" }, { status: 400 });
    }

    const newGame = await prisma.game.create({
      data: {
        seasonId: seasonId,
        homeTeamId: parseInt(homeTeamId),
        awayTeamId: parseInt(awayTeamId),
        scheduledAt: new Date(scheduledAt),
        status: "UPCOMING"
      },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } }
      }
    });

    return NextResponse.json(newGame);
  } catch (error) {
    console.error("Create Game Error:", error);
    return NextResponse.json({ error: "Failed to schedule game" }, { status: 500 });
  }
}