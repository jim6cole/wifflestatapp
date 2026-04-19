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
    
    // ⚡ FIX: Extract ALL fields sent from the frontend, including speed and location
    const { 
      homeTeamId, 
      awayTeamId, 
      scheduledAt, 
      isPlayoff, 
      fieldNumber, 
      eventId,
      status,
      location,
      isSpeedRestricted,
      speedLimit
    } = await request.json();

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
        // ⚡ FIX: Use the status from the frontend (SCHEDULED) instead of hardcoding UPCOMING
        status: status || "SCHEDULED",
        isPlayoff: isPlayoff || false,
        fieldNumber: fieldNumber ? Number(fieldNumber) : null,
        eventId: eventId ? parseInt(eventId) : null,
        // ⚡ FIX: Map the newly added fields to the database
        location: location || null,
        isSpeedRestricted: isSpeedRestricted !== undefined ? isSpeedRestricted : null,
        speedLimit: speedLimit ? Number(speedLimit) : null
      },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } }
      }
    });

    return NextResponse.json(newGame);
  } catch (error) {
    console.error(error); // Helpful for terminal debugging
    return NextResponse.json({ error: "Failed to schedule game" }, { status: 500 });
  }
}