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

    const season = await prisma.season.findUnique({
      where: { id: sId },
      select: { eraStandard: true }
    });
    const eraStandard = season?.eraStandard || 4;

    const games = await prisma.game.findMany({
      where: { seasonId: sId, status: 'COMPLETED' },
      include: { 
        lineups: { 
          include: { player: { select: { name: true } } } 
        },
        atBats: {
          include: {
            batter: { select: { name: true } },
            pitcher: { select: { name: true } }
          }
        } 
      }
    });

    const batterMap: Record<number, any> = {};
    const pitcherMap: Record<number, any> = {};

    const initBatter = (id: number, name: string) => {
      if (!batterMap[id]) {
        batterMap[id] = { 
          id, name, g: 0, gamesSet: new Set(), pa: 0, ab: 0, h: 0, 
          double: 0, triple: 0, hr: 0, rbi: 0, bb: 0, k: 0, tb: 0 
        };
      }
    };

    const initPitcher = (id: number, name: string) => {
      if (!pitcherMap[id]) {
        pitcherMap[id] = { id, name, g: 0, gamesSet: new Set(), w: 0, l: 0, sho: 0, sv: 0, outs: 0, h: 0, r: 0, er: 0, hr: 0, bb: 0, k: 0 };
      }
    };

    games.forEach(game => {
      const homePitcherOuts: Record<number, number> = {};
      const awayPitcherOuts: Record<number, number> = {};
      let homeRuns = 0;
      let awayRuns = 0;
      let lastAwayPitcher = 0;
      let lastHomePitcher = 0;

      game.lineups.forEach(l => {
         initBatter(l.playerId, l.player?.name || "Unknown");
         batterMap[l.playerId].gamesSet.add(game.id);
      });

      game.atBats.forEach(ab => {
        const res = ab.result?.toUpperCase().replace(/\s/g, '_') || '';
        
        // ⚡ STRICT CHECKS
        const isK = res === 'K' || res === 'STRIKEOUT';
        const isBB = res === 'WALK' || res === 'BB' || res.includes('HBP');
        const isH = !isK && !isBB && ['SINGLE', 'CLEAN_SINGLE', 'DOUBLE', 'CLEAN_DOUBLE', 'GROUND_RULE_DOUBLE', 'TRIPLE', 'HR'].some(hit => res.startsWith(hit));
        const isHR = res.startsWith('HR');
        const isOtherOut = ['FLY_OUT', 'GROUND_OUT', 'OUT', 'DP', 'FIELDERS_CHOICE'].some(o => res.startsWith(o));
        
        if (ab.isTopInning) {
          awayRuns += ab.runsScored;
          if (ab.pitcherId) {
            homePitcherOuts[ab.pitcherId] = (homePitcherOuts[ab.pitcherId] || 0) + ab.outs;
            lastHomePitcher = ab.pitcherId;
          }
        } else {
          homeRuns += ab.runsScored;
          if (ab.pitcherId) {
            awayPitcherOuts[ab.pitcherId] = (awayPitcherOuts[ab.pitcherId] || 0) + ab.outs;
            lastAwayPitcher = ab.pitcherId;
          }
        }

        if (ab.batterId) {
          initBatter(ab.batterId, ab.batter?.name || "Unknown"); 
          const b = batterMap[ab.batterId];
          b.gamesSet.add(game.id);
          b.rbi += (ab.rbi || ab.runsScored || 0);
          b.pa++;
          
          if (isH) { b.h++; b.ab++; }
          if (res.includes('DOUBLE')) b.double++;
          if (res.includes('TRIPLE')) b.triple++;
          if (isHR) { b.hr++; b.tb += 4; }
          if (isBB) b.bb++; // Adds to PA, not AB
          if (isK) { b.k++; b.ab++; }
          if (isOtherOut) b.ab++;
        }

        if (ab.pitcherId) {
          initPitcher(ab.pitcherId, ab.pitcher?.name || "Unknown");
          const p = pitcherMap[ab.pitcherId];
          p.gamesSet.add(game.id);
          p.outs += ab.outs;
          p.r += ab.runsScored;
          p.er += ab.runsScored; 
          
          if (isH) p.h++;
          if (isHR) p.hr++;
          if (isBB) p.bb++;
          if (isK) p.k++; // ⚡ Now protected from walks
        }
      });

      const homeWinner = homeRuns > awayRuns;
      
      const getPitcherWithMostOuts = (outsDict: Record<number, number>) => {
          const keys = Object.keys(outsDict);
          if (keys.length === 0) return 0;
          return keys.reduce((a, b) => outsDict[Number(a)] > outsDict[Number(b)] ? a : b);
      };

      const winningPitcherId = homeWinner ? getPitcherWithMostOuts(homePitcherOuts) : getPitcherWithMostOuts(awayPitcherOuts);
      const losingPitcherId = homeWinner ? getPitcherWithMostOuts(awayPitcherOuts) : getPitcherWithMostOuts(homePitcherOuts);

      if (winningPitcherId && pitcherMap[Number(winningPitcherId)]) {
        pitcherMap[Number(winningPitcherId)].w++;
        if ((homeWinner && awayRuns === 0) || (!homeWinner && homeRuns === 0)) {
          pitcherMap[Number(winningPitcherId)].sho++;
        }
      }
      if (losingPitcherId && pitcherMap[Number(losingPitcherId)]) {
          pitcherMap[Number(losingPitcherId)].l++;
      }

      const closerId = homeWinner ? lastHomePitcher : lastAwayPitcher;
      if (closerId && closerId !== Number(winningPitcherId) && Math.abs(homeRuns - awayRuns) <= 3) {
        if (pitcherMap[closerId]) pitcherMap[closerId].sv++;
      }
    });

    const batters = Object.values(batterMap).map(b => ({
      ...b,
      g: b.gamesSet.size,
      avg: b.ab > 0 ? (b.h / b.ab).toFixed(3).replace(/^0/, '') : '.000',
      obp: b.pa > 0 ? ((b.h + b.bb) / b.pa).toFixed(3).replace(/^0/, '') : '.000',
      ops: b.pa > 0 ? (((b.h + b.bb) / b.pa) + (b.tb / b.ab || 0)).toFixed(3).replace(/^0/, '') : '.000'
    }));

    const pitchers = Object.values(pitcherMap).map(p => {
      const ip = (p.outs / 3);
      return {
        ...p,
        g: p.gamesSet.size,
        ip: `${Math.floor(p.outs / 3)}.${p.outs % 3}`,
        era: ip > 0 ? ((p.er * eraStandard) / ip).toFixed(2) : '0.00',
        whip: ip > 0 ? ((p.bb + p.h) / ip).toFixed(2) : '0.00',
        bbpg: ip > 0 ? ((p.bb * eraStandard) / ip).toFixed(2) : '0.00',
        kpg: ip > 0 ? ((p.k * eraStandard) / ip).toFixed(2) : '0.00'
      };
    });

    return NextResponse.json({ batters, pitchers });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json({ error: "Stats failure" }, { status: 500 });
  }
}