import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const eId = parseInt(eventId);

    // 1. Fetch Event Details & Games
    const event = await prisma.event.findUnique({
      where: { id: eId },
      include: {
        games: {
          include: { homeTeam: true, awayTeam: true },
          orderBy: { scheduledAt: 'asc' }
        }
      }
    });

    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    // 2. Identify the Live Game (if any)
    const liveGame = event.games.find(g => g.status === 'LIVE');

    // 3. Calculate Standings
    const standingsMap: Record<number, any> = {};
    
    event.games.forEach(game => {
      [game.homeTeam, game.awayTeam].forEach(team => {
        if (!standingsMap[team.id]) {
          standingsMap[team.id] = { id: team.id, name: team.name, w: 0, l: 0, rs: 0, ra: 0, diff: 0 };
        }
      });

      if (game.status === 'COMPLETED') {
        const home = standingsMap[game.homeTeamId];
        const away = standingsMap[game.awayTeamId];

        home.rs += game.homeScore;
        home.ra += game.awayScore;
        away.rs += game.awayScore;
        away.ra += game.homeScore;

        if (game.homeScore > game.awayScore) home.w++;
        else if (game.awayScore > game.homeScore) away.w++;
        else { /* Handle Ties if applicable */ }

        home.diff = home.rs - home.ra;
        away.diff = away.rs - away.ra;
      }
    });

    const standings = Object.values(standingsMap).sort((a, b) => b.w - a.w || b.diff - a.diff);

    return NextResponse.json({
      eventName: event.name,
      liveGame: liveGame ? {
        homeTeam: liveGame.homeTeam,
        awayTeam: liveGame.awayTeam,
        homeScore: liveGame.homeScore,
        awayScore: liveGame.awayScore,
        inning: "Top 3", // We will pull this from the last AtBat later
        lastPlay: "Single to Center"
      } : null,
      schedule: event.games.map(g => ({
        id: g.id,
        time: new Date(g.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        homeTeam: g.homeTeam,
        awayTeam: g.awayTeam,
        homeScore: g.homeScore,
        awayScore: g.awayScore,
        status: g.status,
        field: g.fieldNumber || 1
      })),
      standings
    });

  } catch (error) {
    console.error("Gameday API Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}