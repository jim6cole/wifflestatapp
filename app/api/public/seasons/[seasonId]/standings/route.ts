import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const { seasonId } = await params;
    const sId = parseInt(seasonId);
    
    // NEW: Get eventId from search params
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    // Build Game Filter: Only completed games in this season
    const gameWhere: any = { seasonId: sId, status: 'COMPLETED' };
    // If an event is selected, only look at games from that event
    if (eventId) {
      gameWhere.eventId = parseInt(eventId);
    }

    const [games, season, events] = await Promise.all([
      prisma.game.findMany({
        where: gameWhere,
        orderBy: { scheduledAt: 'asc' },
        include: {
          awayTeam: { select: { id: true, name: true } },
          homeTeam: { select: { id: true, name: true } }
        }
      }),
      prisma.season.findUnique({
        where: { id: sId },
        select: { name: true, leagueId: true }
      }),
      // Fetch ALL events for the season to populate the UI dropdown
      prisma.event.findMany({
        where: { seasonId: sId },
        orderBy: { id: 'asc' },
        select: { id: true, name: true, status: true, winnerId: true }
      })
    ]);

    // Count up the tournament wins (stars)
    // If we are filtered by event, we only show winners for that specific event
    const tournamentWinsCount: Record<number, number> = {};
    events.filter(e => e.status === 'COMPLETED' && e.winnerId).forEach(event => {
      if (eventId && event.id !== parseInt(eventId)) return; // Skip if filtered
      if (event.winnerId) {
        tournamentWinsCount[event.winnerId] = (tournamentWinsCount[event.winnerId] || 0) + 1;
      }
    });

    const teams: Record<number, any> = {};

    const initTeam = (id: number, name: string) => {
      if (!teams[id]) {
        teams[id] = { id, name, w: 0, l: 0, t: 0, rf: 0, ra: 0, streakList: [], tournamentWins: tournamentWinsCount[id] || 0 };
      }
    };

    games.forEach(g => {
      if (!g.awayTeam || !g.homeTeam) return;
      initTeam(g.awayTeamId, g.awayTeam.name);
      initTeam(g.homeTeamId, g.homeTeam.name);

      const away = teams[g.awayTeamId];
      const home = teams[g.homeTeamId];
      const awayScore = g.awayScore || 0;
      const homeScore = g.homeScore || 0;

      away.rf += awayScore; away.ra += homeScore;
      home.rf += homeScore; home.ra += awayScore;

      if (awayScore > homeScore) {
        away.w += 1; away.streakList.push('W');
        home.l += 1; home.streakList.push('L');
      } else if (homeScore > awayScore) {
        home.w += 1; home.streakList.push('W');
        away.l += 1; away.streakList.push('L');
      } else {
        away.t += 1; away.streakList.push('T');
        home.t += 1; home.streakList.push('T');
      }
    });

    const standings = Object.values(teams).map((t: any) => {
      const gp = t.w + t.l + t.t;
      const pct = gp > 0 ? (t.w + (t.t * 0.5)) / gp : 0;
      
      let currentStreak = '-';
      if (t.streakList.length > 0) {
        let count = 0;
        const lastResult = t.streakList[t.streakList.length - 1];
        for (let i = t.streakList.length - 1; i >= 0; i--) {
          if (t.streakList[i] === lastResult) count++;
          else break;
        }
        currentStreak = `${lastResult}${count}`;
      }

      return {
        id: t.id, name: t.name, gp, w: t.w, l: t.l, t: t.t,
        pct: pct === 1 ? '1.000' : pct.toFixed(3).replace(/^0/, ''),
        pctValue: pct, rf: t.rf, ra: t.ra, rd: t.rf - t.ra,
        streak: currentStreak, tournamentWins: t.tournamentWins
      };
    });

    standings.sort((a, b) => {
      if (b.w !== a.w) return b.w - a.w;
      if (b.pctValue !== a.pctValue) return b.pctValue - a.pctValue;
      return b.rd - a.rd;
    });

    return NextResponse.json({ 
      seasonName: season?.name || 'Season Standings', 
      leagueId: season?.leagueId, 
      standings,
      events // Pass the events list back to the frontend
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}