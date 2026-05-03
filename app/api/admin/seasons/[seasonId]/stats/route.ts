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

    // ⚡ FIX 1: Fetch manual overrides for the season explicitly
    const manualStats = await prisma.manualStatLine.findMany({
      where: { game: { seasonId: sId, status: 'COMPLETED' } },
      include: { player: { select: { name: true } } }
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
      const isOverridden = game.isManualOverride;
      const hasAtBats = game.atBats && game.atBats.length > 0;

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

      // ⚡ FIX 1: Use AtBats ONLY if NOT overridden
      if (!isOverridden && hasAtBats) {
          game.atBats.forEach(ab => {
            const res = ab.result?.toUpperCase().replace(/\s/g, '_') || '';
            
            const isManualOut = res === 'MANUAL_OUT';
            
            // ⚡ FIX 2: Strict match for Strikeout
            const isK = res === 'K' || res === 'STRIKEOUT';
            
            const isBB = res === 'WALK' || res === 'BB' || res.includes('HBP');
            const isOtherOut = ['FLY_OUT', 'GROUND_OUT', 'OUT', 'DP', 'FIELDERS_CHOICE', 'TRIPLE_PLAY'].some(o => res.startsWith(o)) && !isManualOut;
            const isH = !isK && !isBB && !isManualOut && !isOtherOut && ['SINGLE', 'CLEAN_SINGLE', 'DOUBLE', 'CLEAN_DOUBLE', 'GROUND_RULE_DOUBLE', 'TRIPLE', 'HR'].some(hit => res.startsWith(hit)) && !res.includes('PLAY');
            const isHR = res.startsWith('HR');
            
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

            if (ab.batterId && !isManualOut) {
              initBatter(ab.batterId, ab.batter?.name || "Unknown"); 
              const b = batterMap[ab.batterId];
              b.gamesSet.add(game.id);
              b.rbi += (ab.rbi || ab.runsScored || 0);
              b.pa++;
              
              if (isH) { b.h++; b.ab++; }
              if (res.includes('DOUBLE') && !res.includes('PLAY')) b.double++;
              if (res.includes('TRIPLE') && !res.includes('PLAY')) b.triple++;
              if (isHR) { b.hr++; b.tb += 4; }
              if (isBB) b.bb++; 
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
              if (isK) p.k++; 
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
      } else {
          // ⚡ FIX 1: Use Manual Stats ONLY for overridden games
          const mStats = manualStats.filter(ms => ms.gameId === game.id);
          mStats.forEach(ms => {
             if (ms.ab > 0 || ms.bb > 0 || ms.r > 0 || ms.h > 0) {
                initBatter(ms.playerId, ms.player?.name || "Unknown");
                const b = batterMap[ms.playerId];
                b.gamesSet.add(game.id);
                b.pa += (ms.ab + ms.bb); 
                b.ab += ms.ab; 
                b.h += ms.h; 
                b.double += ms.d2b; 
                b.triple += ms.d3b; 
                b.hr += ms.hr;
                b.tb += (ms.h - ms.d2b - ms.d3b - ms.hr) + (ms.d2b * 2) + (ms.d3b * 3) + (ms.hr * 4);
                b.bb += ms.bb; 
                b.k += ms.k; 
                b.rbi += ms.rbi;
             }

             if (ms.ip > 0 || ms.ph > 0 || ms.pbb > 0 || ms.pk > 0) {
                initPitcher(ms.playerId, ms.player?.name || "Unknown");
                const p = pitcherMap[ms.playerId];
                p.gamesSet.add(game.id);
                p.outs += (Math.floor(ms.ip) * 3) + Math.round((ms.ip % 1) * 10);
                p.r += ms.pr; 
                p.er += ms.per; 
                p.h += ms.ph; 
                p.bb += ms.pbb; 
                p.k += ms.pk; 
                p.hr += ms.phr || 0;
                p.w += ms.winCount || 0; 
                p.l += ms.lossCount || 0; 
                p.sv += ms.saveCount || 0;
             }
          });
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