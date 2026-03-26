import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const playerId = parseInt(id);

    // 1. Fetch Player + Manual Stats + Lineups
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        lineups: { include: { team: true } },
        manualStats: {
          include: { game: { include: { season: { include: { league: true } } } } }
        }
      }
    });

    if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    // 2. Fetch Live At-Bats
    const atBats = await prisma.atBat.findMany({
      where: { OR: [ { batterId: playerId }, { pitcherId: playerId } ] },
      include: { game: { include: { season: { include: { league: true } } } } }
    });

    const yearlySplits: Record<string, any> = {};
    const teams = new Set(player.lineups.map(l => l.team.name));

    // Helper to initialize or get a split bucket
    const getSplit = (game: any) => {
      const year = new Date(game.scheduledAt).getFullYear().toString();
      let lName = game.season.league.shortName || game.season.league.name;
      if (lName.toUpperCase() === 'MID ATLANTIC WIFFLE') lName = 'MAW';
      
      const style = game.season.isSpeedRestricted ? 'MED' : 'FAST';
      const splitKey = `${year}-${lName}-${style}`;

      if (!yearlySplits[splitKey]) {
        yearlySplits[splitKey] = {
          year, leagueName: lName, style,
          batting: { ab: 0, h: 0, d: 0, t: 0, hr: 0, rbi: 0, bb: 0, k: 0, tb: 0 },
          pitching: { outs: 0, h: 0, r: 0, er: 0, bb: 0, k: 0, hr: 0, faced: 0 },
          gameIds: new Set<number>() // For GP calculation
        };
      }
      return yearlySplits[splitKey];
    };

    // 3. Process Live Data
    atBats.forEach(ab => {
      const split = getSplit(ab.game);
      split.gameIds.add(ab.gameId);
      const res = ab.result?.toUpperCase() || '';
      const isHit = ['SINGLE', 'DOUBLE', 'TRIPLE', 'HR', '1B', '2B', '3B', '4B'].some(h => res.includes(h));
      const isOut = ['K', 'OUT', 'FLY', 'GROUND', 'DP'].some(o => res.includes(o));
      const isWalk = ['WALK', 'BB', 'HBP'].some(w => res.includes(w));

      if (ab.batterId === playerId) {
        if (isWalk) split.batting.bb++;
        else if (isHit || isOut) {
          split.batting.ab++;
          if (res.includes('K')) split.batting.k++;
          if (isHit) {
            split.batting.h++;
            if (res.includes('DOUBLE') || res.includes('2B')) { split.batting.d++; split.batting.tb += 2; }
            else if (res.includes('TRIPLE') || res.includes('3B')) { split.batting.t++; split.batting.tb += 3; }
            else if (res.includes('HR') || res.includes('4B')) { split.batting.hr++; split.batting.tb += 4; }
            else split.batting.tb += 1;
          }
        }
        split.batting.rbi += (ab.rbi || 0);
      }

      if (ab.pitcherId === playerId) {
        split.pitching.faced++;
        split.pitching.outs += ab.outs || (isOut ? 1 : 0);
        if (isHit) split.pitching.h++;
        if (isWalk) split.pitching.bb++;
        if (res.includes('K')) split.pitching.k++;
        if (res.includes('HR')) split.pitching.hr++;
        split.pitching.r += (ab.runsScored || 0);
        split.pitching.er += (ab.runsScored || 0);
      }
    });

    // 4. Process Manual Data
    player.manualStats.forEach(ms => {
      const split = getSplit(ms.game);
      split.gameIds.add(ms.gameId);
      
      split.batting.ab += ms.ab; split.batting.h += ms.h; split.batting.hr += ms.hr;
      split.batting.rbi += ms.rbi; split.batting.bb += ms.bb; split.batting.k += ms.k;
      split.batting.d += ms.d2b; split.batting.t += ms.d3b;
      split.batting.tb += (ms.h - ms.d2b - ms.d3b - ms.hr) + (ms.d2b * 2) + (ms.d3b * 3) + (ms.hr * 4);

      if (ms.ip > 0 || ms.pk > 0) {
        split.pitching.outs += (Math.floor(ms.ip) * 3) + (Math.round((ms.ip % 1) * 10));
        split.pitching.h += ms.ph; split.pitching.bb += ms.pbb; split.pitching.k += ms.pk;
        split.pitching.r += ms.pr; split.pitching.er += ms.per;
      }
    });

    // 5. Final Formatting
    const formattedSplits = Object.values(yearlySplits).map((s: any) => {
      const pa = s.batting.ab + s.batting.bb;
      const obp = pa > 0 ? (s.batting.h + s.batting.bb) / pa : 0;
      const slg = s.batting.ab > 0 ? s.batting.tb / s.batting.ab : 0;
      const mathIP = s.pitching.outs / 3;

      return {
        ...s,
        gp: s.gameIds.size,
        batting: {
          ...s.batting,
          pa,
          avg: s.batting.ab > 0 ? (s.batting.h / s.batting.ab).toFixed(3).replace(/^0/, '') : '.000',
          ops: (obp + slg).toFixed(3).replace(/^0/, '')
        },
        pitching: {
          ...s.pitching,
          ip: `${Math.floor(s.pitching.outs / 3)}.${s.pitching.outs % 3}`,
          era: mathIP > 0 ? ((s.pitching.er * 6) / mathIP).toFixed(2) : '0.00',
          whip: mathIP > 0 ? ((s.pitching.h + s.pitching.bb) / mathIP).toFixed(2) : '0.00'
        }
      };
    }).sort((a, b) => parseInt(b.year) - parseInt(a.year));

    // Calculate Career Totals for Top Boxes
    const careerBat = formattedSplits.reduce((acc, s) => ({
      ab: acc.ab + s.batting.ab, h: acc.h + s.batting.h, hr: acc.hr + s.batting.hr, 
      rbi: acc.rbi + s.batting.rbi, bb: acc.bb + s.batting.bb, tb: acc.tb + s.batting.tb
    }), { ab: 0, h: 0, hr: 0, rbi: 0, bb: 0, tb: 0 });

    const careerPA = careerBat.ab + careerBat.bb;
    const careerOBP = careerPA > 0 ? (careerBat.h + careerBat.bb) / careerPA : 0;
    const careerSLG = careerBat.ab > 0 ? careerBat.tb / careerBat.ab : 0;

    return NextResponse.json({
      player: { id: player.id, name: player.name, teams: Array.from(teams) },
      career: {
        avg: careerBat.ab > 0 ? (careerBat.h / careerBat.ab).toFixed(3).replace(/^0/, '') : '.000',
        hr: careerBat.hr,
        rbi: careerBat.rbi,
        ops: (careerOBP + careerSLG).toFixed(3).replace(/^0/, '')
      },
      splits: formattedSplits
    });
  } catch (error) {
    console.error("Player Card API Error:", error);
    return NextResponse.json({ error: "Failed to load player stats" }, { status: 500 });
  }
}