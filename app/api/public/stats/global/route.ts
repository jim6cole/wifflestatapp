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

    const whereClause: any = { status: 'COMPLETED' };

    // --- UPDATED FILTERING LOGIC ---
    if (seasonIdFilter) {
      whereClause.seasonId = parseInt(seasonIdFilter);
    } else {
      const seasonConditions: any = {};
      
      // Pivot: Filter by the Season.year column instead of scheduledAt date range
      if (yearFilter && yearFilter !== 'all') {
        seasonConditions.year = parseInt(yearFilter);
      }
      
      if (leagueIdFilter && leagueIdFilter !== 'all') {
        seasonConditions.leagueId = parseInt(leagueIdFilter);
      }
      
      if (style === 'fast') {
        seasonConditions.isSpeedRestricted = false;
      } else if (style === 'medium') {
        seasonConditions.isSpeedRestricted = true;
      }

      if (Object.keys(seasonConditions).length > 0) {
        whereClause.season = seasonConditions;
      }
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
    const gamesWithLiveAtBats = new Set(atBats.map(ab => ab.gameId));

    const addToMap = (map: any, id: number, name: string, game: any) => {
      const leagueLabel = game?.season?.league?.shortName || game?.season?.league?.name || 'AWAA';
      const isMed = game?.season?.isSpeedRestricted;
      const speedLimitVal = game?.season?.speedLimit;
      const speedLabel = isMed ? (speedLimitVal ? `MED ${speedLimitVal} mph` : 'MED') : 'FAST';

      if (!map[id]) {
        map[id] = { 
          id, name, ab: 0, h: 0, d: 0, t: 0, hr: 0, rbi: 0, r: 0, bb: 0, k: 0, tb: 0, 
          ipOuts: 0, ph: 0, pr: 0, per: 0, pbb: 0, pk: 0, phr: 0, w: 0, l: 0, sv: 0,
          weighted_per: 0,
          gameIds: new Set<number>(),
          manualGP: 0, // Track Games Played from legacy imports
          leagueDisplay: leagueLabel,
          speedDisplay: speedLabel,
          stylesPlayed: new Set<string>([isMed ? 'MED' : 'FAST'])
        };
      } else {
        map[id].stylesPlayed.add(isMed ? 'MED' : 'FAST');
      }
      return map[id];
    };

    // 1. Process Live Data
    atBats.forEach(ab => {
      const b = addToMap(batterMap, ab.batterId, ab.batter.name, ab.game);
      b.gameIds.add(ab.gameId);
      const res = ab.result?.toUpperCase() || '';
      const isH = ['SINGLE', 'DOUBLE', 'TRIPLE', 'HR', '1B', '2B', '3B', '4B'].some(h => res.includes(h));
      const isWalk = ['WALK', 'BB', 'HBP'].some(w => res.includes(w));
      
      if (isWalk) b.bb++;
      else {
        b.ab++;
        if (res.includes('K')) b.k++;
        if (isH) {
          b.h++;
          const bases = (res.includes('HR') || res.includes('4B')) ? 4 : (res.includes('TRIPLE') || res.includes('3B')) ? 3 : (res.includes('DOUBLE') || res.includes('2B')) ? 2 : 1;
          b.tb += bases;
          if (bases === 2) b.d++; else if (bases === 3) b.t++; else if (bases === 4) b.hr++;
        }
      }
      b.rbi += (ab.rbi || ab.runsScored || 0);
      if (ab.scorerIds) {
        ab.scorerIds.split(',').forEach(sid => { if (batterMap[parseInt(sid)]) batterMap[parseInt(sid)].r++; });
      }

      const p = addToMap(pitcherMap, ab.pitcherId, ab.pitcher.name, ab.game);
      p.gameIds.add(ab.gameId);
      p.ipOuts += (ab.outs || 0);
      if (res.includes('K')) p.pk++;
      if (isH) { p.ph++; if (res.includes('HR') || res.includes('4B')) p.phr++; }
      if (isWalk) p.pbb++;
      
      const standard = (ab.game?.season?.eraStandard === 4 && ab.game?.season?.inningsPerGame !== 4) 
        ? ab.game?.season?.inningsPerGame 
        : (ab.game?.season?.eraStandard || 4);

      if (ab.runsScored > 0) {
        if (ab.runAttribution) {
          ab.runAttribution.split(',').forEach(sid => {
            const pId = parseInt(sid.trim());
            const attributedP = pitcherMap[pId] || addToMap(pitcherMap, pId, "Unknown", ab.game);
            attributedP.pr += 1;
            attributedP.per += 1;
            attributedP.weighted_per += (1 * standard);
          });
        } else {
          p.pr += ab.runsScored;
          p.per += ab.runsScored;
          p.weighted_per += (ab.runsScored * standard);
        }
      }
    });

    // 2. Process Manual Data
    manualLines.forEach((ms: any) => { 
      const p = addToMap(pitcherMap, ms.playerId, ms.player.name, ms.game);
      // Pitching decisions use the updated count fields
      if (ms.winCount) p.w += ms.winCount;
      if (ms.lossCount) p.l += ms.lossCount;
      if (ms.saveCount) p.sv += ms.saveCount;

      if (!gamesWithLiveAtBats.has(ms.gameId)) {
        const b = addToMap(batterMap, ms.playerId, ms.player.name, ms.game);
        
        // --- UPDATED: Batting GP logic ---
        // For legacy seasons, gp might be 12. For manual single games, gp is 1.
        b.manualGP += (ms.gp || 1);
        
        b.ab += ms.ab; b.h += ms.h; b.hr += ms.hr; b.rbi += ms.rbi; b.r += ms.r; b.bb += ms.bb; b.k += ms.k;
        b.d += ms.d2b; b.t += ms.d3b;
        b.tb += (ms.h - ms.d2b - ms.d3b - ms.hr) + (ms.d2b * 2) + (ms.d3b * 3) + (ms.hr * 4);

        p.ipOuts += (Math.floor(ms.ip) * 3) + Math.round((ms.ip % 1) * 10);
        p.pk += ms.pk; p.ph += ms.ph; p.pr += ms.pr; p.per += ms.per; p.pbb += ms.pbb; p.phr += (ms.phr || 0); 

        const standard = (ms.game?.season?.eraStandard === 4 && ms.game?.season?.inningsPerGame !== 4) 
          ? ms.game?.season?.inningsPerGame 
          : (ms.game?.season?.eraStandard || 4);
        p.weighted_per += (ms.per * standard);
      }
    });

    const finalBatters = Object.values(batterMap).map((b: any) => {
      const pa = b.ab + b.bb;
      const speedDisplay = b.stylesPlayed.has('FAST') && b.stylesPlayed.has('MED') ? 'BOTH' : b.speedDisplay;
      
      // --- UPDATED: Final Batting GP ---
      const totalGP = b.gameIds.size + b.manualGP;

      return { 
        ...b, gp: totalGP, pa, speedDisplay, leagueDisplay: b.leagueDisplay,
        avg: b.ab > 0 ? (b.h / b.ab).toFixed(3).replace(/^0/, '') : '.000', 
        obp: pa > 0 ? ((b.h + b.bb) / pa).toFixed(3).replace(/^0/, '') : '.000', 
        ops: b.ab > 0 ? (((b.h + b.bb) / pa) + (b.tb / b.ab)).toFixed(3).replace(/^0/, '') : '.000' 
      };
    });

    const finalPitchers = Object.values(pitcherMap).map((p: any) => {
      const mathIP = p.ipOuts / 3;
      const speedDisplay = p.stylesPlayed.has('FAST') && p.stylesPlayed.has('MED') ? 'BOTH' : p.speedDisplay;
      return { 
        id: p.id, name: p.name, w: p.w, l: p.l, sv: p.sv, gp: p.gameIds.size, speedDisplay, leagueDisplay: p.leagueDisplay,
        ip: `${Math.floor(p.ipOuts / 3)}.${p.ipOuts % 3}`, 
        h: p.ph, r: p.pr, er: p.per, bb: p.pbb, k: p.pk, hr: p.phr,
        era: mathIP > 0 ? (p.weighted_per / mathIP).toFixed(2) : "0.00", 
        whip: mathIP > 0 ? ((p.ph + p.pbb) / mathIP).toFixed(2) : "0.00" 
      };
    });

    return NextResponse.json({ leagues, batters: finalBatters, pitchers: finalPitchers, seasonName: seasonMeta?.name || "Global Stats" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}