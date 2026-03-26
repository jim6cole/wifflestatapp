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

    // Fetch all completed games chronologically to accurately calculate streaks
    const games = await prisma.game.findMany({
      where: { seasonId: sId, status: 'COMPLETED' },
      orderBy: { scheduledAt: 'asc' },
      include: {
        awayTeam: { select: { id: true, name: true } },
        homeTeam: { select: { id: true, name: true } }
      }
    });

    const season = await prisma.season.findUnique({
      where: { id: sId },
      select: { name: true, leagueId: true }
    });

    const teams: Record<number, any> = {};

    // Helper to setup a team profile
    const initTeam = (id: number, name: string) => {
      if (!teams[id]) {
        teams[id] = { id, name, w: 0, l: 0, t: 0, rf: 0, ra: 0, streakList: [] };
      }
    };

    // Crunch the game data
    games.forEach(g => {
      if (!g.awayTeam || !g.homeTeam) return;

      initTeam(g.awayTeamId, g.awayTeam.name);
      initTeam(g.homeTeamId, g.homeTeam.name);

      const away = teams[g.awayTeamId];
      const home = teams[g.homeTeamId];

      const awayScore = g.awayScore || 0;
      const homeScore = g.homeScore || 0;

      // Add runs to totals
      away.rf += awayScore;
      away.ra += homeScore;
      home.rf += homeScore;
      home.ra += awayScore;

      // Determine Winner/Loser
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

    // Format the final standings array
    const standings = Object.values(teams).map((t: any) => {
      const gp = t.w + t.l + t.t;
      // Wiffleball standard: Ties count as a half-win for percentage
      const pct = gp > 0 ? (t.w + (t.t * 0.5)) / gp : 0;
      
      // Calculate Current Streak
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
        id: t.id,
        name: t.name,
        gp,
        w: t.w,
        l: t.l,
        t: t.t,
        pct: pct === 1 ? '1.000' : pct.toFixed(3).replace(/^0/, ''),
        pctValue: pct,
        rf: t.rf,
        ra: t.ra,
        rd: t.rf - t.ra,
        streak: currentStreak
      };
    });

    // Final Sort: Wins -> PCT -> Run Diff
    standings.sort((a, b) => {
      if (b.w !== a.w) return b.w - a.w;
      if (b.pctValue !== a.pctValue) return b.pctValue - a.pctValue;
      return b.rd - a.rd;
    });

    return NextResponse.json({ 
      seasonName: season?.name || 'Season Standings', 
      leagueId: season?.leagueId, 
      standings 
    });
  } catch (error: any) {
    console.error("Standings API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}