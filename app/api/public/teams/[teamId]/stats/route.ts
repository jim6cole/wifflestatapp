import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const tId = parseInt(teamId);
    const { searchParams } = new URL(request.url);
    
    const yearFilter = searchParams.get('year');
    const seasonIdFilter = searchParams.get('seasonId');
    const eventIdFilter = searchParams.get('eventId');

    // --- 1. BUILD GAME FILTER ---
    // Look for completed games where this team was either Home or Away
    const gameWhere: any = { 
      status: 'COMPLETED',
      OR: [{ homeTeamId: tId }, { awayTeamId: tId }]
    };

    if (seasonIdFilter) gameWhere.seasonId = parseInt(seasonIdFilter);
    if (eventIdFilter) gameWhere.eventId = parseInt(eventIdFilter);
    if (yearFilter && yearFilter !== 'all') {
      gameWhere.season = { year: parseInt(yearFilter) };
    }

    // --- 2. FETCH CORE DATA ---
    // Replace the Promise.all with this:
    const [team, games, atBats, manualLines, lineups] = await Promise.all([
      prisma.team.findUnique({ 
        where: { id: tId },
        include: { 
            league: { 
                include: { 
                    seasons: { 
                        include: { events: { orderBy: { id: 'desc' } } }, 
                        orderBy: { year: 'desc' } 
                    } 
                } 
            }
        }
      }),
      prisma.game.findMany({ where: gameWhere }),
      prisma.atBat.findMany({
        where: { game: gameWhere },
        include: { 
            batter: { select: { name: true } }, 
            pitcher: { select: { name: true } }, 
            game: { include: { lineups: true, season: true } } 
        }
      }),
      prisma.manualStatLine.findMany({
        where: { teamId: tId, game: gameWhere },
        include: { 
            player: { select: { name: true } }, 
            game: { include: { season: true } } 
        }
      }),
      // ⚡ FETCH LINEUPS TO SECURE GP FOR FIELDERS
      prisma.lineupEntry.findMany({
         where: { teamId: tId, game: gameWhere },
         include: { player: { select: { name: true } }, game: { include: { season: true } } }
      })
    ]);

    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

    // --- 3. CALCULATE FRANCHISE RECORD ---
    let w = 0, l = 0, t = 0, rf = 0, ra = 0;
    games.forEach(g => {
      const isHome = g.homeTeamId === tId;
      const tScore = isHome ? g.homeScore : g.awayScore;
      const oScore = isHome ? g.awayScore : g.homeScore;
      rf += tScore; ra += oScore;
      if (tScore > oScore) w++; else if (oScore > tScore) l++; else t++;
    });

    const batterMap: Record<number, any> = {};
    const pitcherMap: Record<number, any> = {};

    const initPlayer = (map: any, id: number, name: string) => {
      if (!map[id]) {
        map[id] = { 
            id, name, ab: 0, h: 0, d: 0, t: 0, hr: 0, rbi: 0, r: 0, bb: 0, k: 0, tb: 0, 
            ipOuts: 0, ph: 0, pr: 0, per: 0, pbb: 0, pk: 0, phr: 0, w: 0, l: 0, sv: 0, 
            weighted_per: 0, gp: new Set<number>() 
        };
      }
      return map[id];
    };

    // ⚡ SEED FIELDERS WITH GP CREDITS
    lineups.forEach(l => {
        const b = initPlayer(batterMap, l.playerId, l.player.name);
        b.gp.add(l.gameId);
    });

    // ... continue to Process Live Data

    // --- 4. PROCESS LIVE DATA (Filtered by Team Membership) ---
    atBats.forEach(ab => {
      // Only attribute the stat if the player was on THIS team during this specific game
      const isBatterOnThisTeam = ab.game.lineups.some(l => l.playerId === ab.batterId && l.teamId === tId);
      const isPitcherOnThisTeam = ab.game.lineups.some(l => l.playerId === ab.pitcherId && l.teamId === tId);

      const res = ab.result?.toUpperCase() || '';
      const isH = ['SINGLE', 'DOUBLE', 'TRIPLE', 'HR', '1B', '2B', '3B', '4B'].some(h => res.includes(h));
      const isWalk = ['WALK', 'BB', 'HBP'].some(w => res.includes(w));

      if (isBatterOnThisTeam) {
        const b = initPlayer(batterMap, ab.batterId, ab.batter.name);
        b.gp.add(ab.gameId);
        if (isWalk) b.bb++;
        else {
            b.ab++;
            if (res.includes('K')) b.k++;
            if (isH) {
                b.h++;
                const bases = res.includes('HR') ? 4 : res.includes('TRIPLE') ? 3 : res.includes('DOUBLE') ? 2 : 1;
                b.tb += bases;
                if (bases === 2) b.d++; else if (bases === 3) b.t++; else if (bases === 4) b.hr++;
            }
        }
        b.rbi += (ab.rbi || ab.runsScored || 0);
        // Runs logic
        if (ab.scorerIds) {
            ab.scorerIds.split(',').forEach(sid => {
                const sIdNum = parseInt(sid);
                if (sIdNum === ab.batterId) b.r++;
            });
        }
      }

      if (isPitcherOnThisTeam) {
        const p = initPlayer(pitcherMap, ab.pitcherId, ab.pitcher.name);
        p.gp.add(ab.gameId);
        p.ipOuts += (ab.outs || 0);
        if (res.includes('K')) p.pk++;
        if (isH) { p.ph++; if (res.includes('HR')) p.phr++; }
        if (isWalk) p.pbb++;
        
        const standard = (ab.game?.season?.eraStandard === 4 && ab.game?.season?.inningsPerGame !== 4) 
            ? ab.game?.season?.inningsPerGame : (ab.game?.season?.eraStandard || 4);
        
        if (ab.runsScored > 0) {
            p.pr += ab.runsScored; p.per += ab.runsScored; p.weighted_per += (ab.runsScored * standard);
        }
      }
    });

    // --- 5. PROCESS MANUAL DATA ---
    manualLines.forEach(ms => {
        const b = initPlayer(batterMap, ms.playerId, ms.player.name);
        b.gp.add(ms.gameId);
        b.ab += ms.ab; b.h += ms.h; b.hr += ms.hr; b.rbi += ms.rbi; b.r += ms.r; b.bb += ms.bb; b.k += ms.k;
        b.d += ms.d2b; b.t += ms.d3b;
        b.tb += (ms.h - ms.d2b - ms.d3b - ms.hr) + (ms.d2b * 2) + (ms.d3b * 3) + (ms.hr * 4);

        const p = initPlayer(pitcherMap, ms.playerId, ms.player.name);
        p.gp.add(ms.gameId);
        p.ipOuts += (Math.floor(ms.ip) * 3) + Math.round((ms.ip % 1) * 10);
        p.pk += ms.pk; p.ph += ms.ph; p.pr += ms.pr; p.per += ms.per; p.pbb += ms.pbb; p.phr += (ms.phr || 0);
        if (ms.winCount) p.w += ms.winCount; if (ms.lossCount) p.l += ms.lossCount; if (ms.saveCount) p.sv += ms.saveCount;
        
        const standard = (ms.game?.season?.eraStandard === 4 && ms.game?.season?.inningsPerGame !== 4) 
            ? ms.game?.season?.inningsPerGame : (ms.game?.season?.eraStandard || 4);
        p.weighted_per += (ms.per * standard);
    });

    // --- 6. FINAL CALCULATIONS ---
    const batters = Object.values(batterMap).map((b: any) => ({
        ...b, gp: b.gp.size, pa: b.ab + b.bb,
        gameIds: Array.from(b.gp), // Safe serialization
        avg: b.ab > 0 ? (b.h / b.ab).toFixed(3).replace(/^0/, '') : '.000',
        ops: b.ab > 0 ? (((b.h + b.bb) / (b.ab + b.bb)) + (b.tb / b.ab)).toFixed(3).replace(/^0/, '') : '.000'
    }));

    const pitchers = Object.values(pitcherMap).map((p: any) => {
        const mathIP = p.ipOuts / 3;
        return {
            ...p, gp: p.gp.size, ip: `${Math.floor(p.ipOuts / 3)}.${p.ipOuts % 3}`,
            gameIds: Array.from(p.gp), // Safe serialization
            era: mathIP > 0 ? (p.weighted_per / mathIP).toFixed(2) : "0.00",
            whip: mathIP > 0 ? ((p.ph + p.pbb) / mathIP).toFixed(2) : "0.00"
        };
    });

    return NextResponse.json({
      teamName: team.name,
      record: { w, l, t, rf, ra, pct: (w+l+t) > 0 ? ((w + (t*0.5))/(w+l+t)).toFixed(3).replace(/^0/, '') : '.000' },
      batters, pitchers,
      seasons: team.league.seasons,
      years: Array.from(new Set(team.league.seasons.map(s => s.year))).sort((a,b) => b-a)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}