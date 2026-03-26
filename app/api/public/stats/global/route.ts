import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const style = searchParams.get('style'); 
    const seasonIdFilter = searchParams.get('seasonId');
    const leagueIdFilter = searchParams.get('leagueId');
    const yearFilter = searchParams.get('year');

    const currentYear = new Date().getFullYear();
    const targetYear = yearFilter ? parseInt(yearFilter) : currentYear;
    
    const startOfYear = new Date(Date.UTC(targetYear, 0, 1));
    const endOfYear = new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59, 999));

    const whereClause: any = { status: 'COMPLETED' };

    if (seasonIdFilter) {
      whereClause.seasonId = parseInt(seasonIdFilter);
    } else {
      whereClause.scheduledAt = { gte: startOfYear, lte: endOfYear };
      const seasonConditions: any = {};
      if (leagueIdFilter && leagueIdFilter !== 'all') seasonConditions.leagueId = parseInt(leagueIdFilter);
      if (style === 'fast') seasonConditions.isSpeedRestricted = false;
      else if (style === 'medium') seasonConditions.isSpeedRestricted = true;
      if (Object.keys(seasonConditions).length > 0) whereClause.season = seasonConditions;
    }

    const [atBats, manualLines, leagues, seasonMeta] = await Promise.all([
      prisma.atBat.findMany({
        where: { game: whereClause },
        include: {
          batter: { select: { name: true } },
          pitcher: { select: { name: true } },
          game: { include: { season: { include: { league: true } } } }
        },
      }),
      prisma.manualStatLine.findMany({
        where: { game: whereClause },
        include: {
          player: { select: { name: true } },
          game: { include: { season: { include: { league: true } } } }
        }
      }),
      prisma.league.findMany({ select: { id: true, name: true, shortName: true } }),
      seasonIdFilter ? prisma.season.findUnique({ where: { id: parseInt(seasonIdFilter) } }) : null
    ]);

    const batterMap: Record<number, any> = {};
    const pitcherMap: Record<number, any> = {};

    const addToMap = (map: any, id: number, name: string, game: any) => {
      const leagueLabel = game?.season?.league?.shortName || game?.season?.league?.name || 'AWAA';
      
      const isMed = game?.season?.isSpeedRestricted;
      const speedLimitVal = game?.season?.speedLimit;
      // ADDED "mph" unit here
      const speedLabel = isMed ? (speedLimitVal ? `MED ${speedLimitVal} mph` : 'MED') : 'FAST';

      if (!map[id]) {
        map[id] = { 
          id, name, ab: 0, h: 0, d: 0, t: 0, hr: 0, rbi: 0, bb: 0, k: 0, tb: 0, 
          ipOuts: 0, ph: 0, pr: 0, per: 0, pbb: 0, pk: 0, phr: 0, w: 0, l: 0, sv: 0,
          gameIds: new Set<number>(),
          leagueDisplay: leagueLabel,
          speedDisplay: speedLabel,
          stylesPlayed: new Set<string>([isMed ? 'MED' : 'FAST'])
        };
      } else {
        map[id].stylesPlayed.add(isMed ? 'MED' : 'FAST');
        if (isMed && speedLimitVal && map[id].speedDisplay === 'MED') {
            map[id].speedDisplay = `MED ${speedLimitVal} mph`;
        }
      }
      return map[id];
    };

    atBats.forEach(ab => {
      addToMap(batterMap, ab.batterId, ab.batter.name, ab.game);
      const b = batterMap[ab.batterId];
      b.gameIds.add(ab.gameId);
      const res = ab.result?.toUpperCase() || '';
      if (['WALK', 'BB'].some(w => res.includes(w))) b.bb++;
      else {
        b.ab++;
        if (res.includes('K')) b.k++;
        if (['SINGLE', '1B', 'DOUBLE', '2B', 'TRIPLE', '3B', 'HR', '4B'].some(h => res.includes(h))) {
          b.h++;
          if (res.includes('DOUBLE') || res.includes('2B')) { b.d++; b.tb += 2; }
          else if (res.includes('TRIPLE') || res.includes('3B')) { b.t++; b.tb += 3; }
          else if (res.includes('HR') || res.includes('4B')) { b.hr++; b.tb += 4; }
          else b.tb += 1;
        }
      }
      b.rbi += (ab.rbi || 0);

      addToMap(pitcherMap, ab.pitcherId, ab.pitcher.name, ab.game);
      const p = pitcherMap[ab.pitcherId];
      p.gameIds.add(ab.gameId);
      p.ipOuts += ab.outs || (['K', 'OUT'].some(o => res.includes(o)) ? 1 : 0);
      if (res.includes('K')) p.pk++;
      if (['SINGLE', 'DOUBLE', 'TRIPLE', 'HR'].some(h => res.includes(h))) { p.ph++; if (res.includes('HR')) p.phr++; }
      p.pbb += (['WALK', 'BB'].some(w => res.includes(w)) ? 1 : 0);
      p.pr += ab.runsScored || 0;
      p.per += ab.runsScored || 0; 
    });

    manualLines.forEach((ms: any) => { 
      addToMap(batterMap, ms.playerId, ms.player.name, ms.game);
      const b = batterMap[ms.playerId];
      b.gameIds.add(ms.gameId);
      b.ab += ms.ab; b.h += ms.h; b.hr += ms.hr; b.rbi += ms.rbi; b.bb += ms.bb; b.k += ms.k;
      b.d += ms.d2b; b.t += ms.d3b;
      b.tb += (ms.h - ms.d2b - ms.d3b - ms.hr) + (ms.d2b * 2) + (ms.d3b * 3) + (ms.hr * 4);

      const isPitcher = ms.ip > 0 || ms.pk > 0 || ms.pbb > 0 || ms.ph > 0 || ms.pr > 0 || ms.win || ms.loss || ms.save;
      if (isPitcher) {
        addToMap(pitcherMap, ms.playerId, ms.player.name, ms.game);
        const p = pitcherMap[ms.playerId];
        p.gameIds.add(ms.gameId);
        p.ipOuts += (Math.floor(ms.ip) * 3) + (Math.round((ms.ip % 1) * 10));
        p.pk += ms.pk; p.ph += ms.ph; p.pr += ms.pr; p.per += ms.per; p.pbb += ms.pbb; p.phr += (ms.phr || 0); 
        p.w += ms.win ? 1 : 0; p.l += ms.loss ? 1 : 0; p.sv += ms.save ? 1 : 0;
      }
    });

    const finalBatters = Object.values(batterMap).map((b: any) => {
      const pa = b.ab + b.bb;
      return { 
        ...b, gp: b.gameIds.size, pa,
        speedDisplay: b.stylesPlayed.has('FAST') && b.stylesPlayed.has('MED') ? 'BOTH' : b.speedDisplay,
        avg: b.ab > 0 ? (b.h / b.ab).toFixed(3).replace(/^0/, '') : '.000', 
        obp: pa > 0 ? ((b.h + b.bb) / pa).toFixed(3).replace(/^0/, '') : '.000', 
        ops: (b.ab > 0 && pa > 0) ? (((b.h + b.bb) / pa) + (b.tb / b.ab)).toFixed(3).replace(/^0/, '') : '.000' 
      };
    });

    const finalPitchers = Object.values(pitcherMap).map((p: any) => {
      const mathIP = p.ipOuts / 3;
      return { 
        ...p, gp: p.gameIds.size,
        speedDisplay: p.stylesPlayed.has('FAST') && p.stylesPlayed.has('MED') ? 'BOTH' : p.speedDisplay,
        ip: `${Math.floor(p.ipOuts / 3)}.${p.ipOuts % 3}`, 
        era: mathIP > 0 ? ((p.per * 4) / mathIP).toFixed(2) : "0.00", 
        whip: mathIP > 0 ? ((p.ph + p.pbb) / mathIP).toFixed(2) : "0.00" 
      };
    });

    return NextResponse.json({ leagues, batters: finalBatters, pitchers: finalPitchers, year: targetYear, seasonName: seasonMeta?.name || `${targetYear} Global Stats` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}