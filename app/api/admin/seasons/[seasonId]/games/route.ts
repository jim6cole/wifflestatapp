import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
    return NextResponse.json({ error: "Failed to load schedule" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const resolvedParams = await params;
    const seasonId = parseInt(resolvedParams.seasonId);
    
    // Extract the fieldNumber AND eventId from the request
    const { homeTeamId, awayTeamId, scheduledAt, isPlayoff, fieldNumber, eventId } = await request.json();

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
        status: "UPCOMING",
        isPlayoff: isPlayoff || false,
        fieldNumber: fieldNumber ? Number(fieldNumber) : null,
        
        // NEW: Link the game to the Tournament if one was selected
        eventId: eventId ? parseInt(eventId) : null
      },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } }
      }
    });

    return NextResponse.json(newGame);
  } catch (error) {
    return NextResponse.json({ error: "Failed to schedule game" }, { status: 500 });
  }
}