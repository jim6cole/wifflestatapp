import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventId, eventName, seasonId, schedule } = body;

    if (!seasonId || !schedule || schedule.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!eventId && !eventName) {
      return NextResponse.json({ error: "Must provide either an existing event ID or a new event name" }, { status: 400 });
    }

    // We use a Prisma Transaction to ensure the Event AND the Games are created together.
    const result = await prisma.$transaction(async (tx) => {
      
      let targetEventId = eventId ? parseInt(eventId) : null;
      
      // 1. Create the Event Container if we are NOT using an existing one
      if (!targetEventId) {
        const event = await tx.event.create({
          data: {
            name: eventName,
            status: 'UPCOMING',
            seasonId: parseInt(seasonId),
            startDate: new Date(schedule[0].scheduledAt) // Auto-set date to the first pitch
          }
        });
        targetEventId = event.id;
      }

      // 2. Format the games to link to the Target Event
      const gamesData = schedule.map((game: any) => ({
        eventId: targetEventId,
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

      return { id: targetEventId };
    });

    return NextResponse.json({ success: true, eventId: result.id });

  } catch (error: any) {
    console.error("Generator API Error:", error);
    return NextResponse.json({ error: "Failed to generate tournament" }, { status: 500 });
  }
}