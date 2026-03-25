import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventName, seasonId, schedule } = body;

    if (!eventName || !seasonId || !schedule || schedule.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // We use a Prisma Transaction to ensure the Event AND the Games are created together.
    // If one fails, the whole thing rolls back so you don't get corrupted half-tournaments.
    const result = await prisma.$transaction(async (tx) => {
      
      // 1. Create the Event Container
      const event = await tx.event.create({
        data: {
          name: eventName,
          status: 'UPCOMING',
          seasonId: parseInt(seasonId)
        }
      });

      // 2. Format the games to link to the new Event
      // 2. Format the games to link to the new Event
      const gamesData = schedule.map((game: any) => ({
        eventId: event.id,
        seasonId: parseInt(seasonId),
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId,
        fieldNumber: game.fieldNumber,
        status: 'UPCOMING',
        
        // This now reads the exact date and time the frontend generated
        scheduledAt: new Date(game.scheduledAt), 
      }));

      // 3. Bulk insert the games
      await tx.game.createMany({
        data: gamesData
      });

      return event;
    });

    return NextResponse.json({ success: true, eventId: result.id });

  } catch (error: any) {
    console.error("Generator API Error:", error);
    return NextResponse.json({ error: "Failed to generate tournament" }, { status: 500 });
  }
}