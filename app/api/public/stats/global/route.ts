import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const style = searchParams.get('style'); 
    const seasonIdFilter = searchParams.get('seasonId');
    const eventIdFilter = searchParams.get('eventId');
    const leagueIdFilter = searchParams.get('leagueId');
    const yearFilter = searchParams.get('year');

    const whereClause: any = { status: 'COMPLETED' };

    if (seasonIdFilter) {
      whereClause.seasonId = parseInt(seasonIdFilter);
      if (eventIdFilter) {
        whereClause.eventId = parseInt(eventIdFilter);
      }
    } else {
      const seasonConditions: any = {};
      if (yearFilter && yearFilter !== 'all') seasonConditions.year = parseInt(yearFilter);
      if (leagueIdFilter && leagueIdFilter !== 'all') seasonConditions.leagueId = parseInt(leagueIdFilter);
      
      if (style === 'fast') seasonConditions.isSpeedRestricted = false;
      else if (style === 'medium') seasonConditions.isSpeedRestricted = true;

      if (Object.keys(seasonConditions).length > 0) {
        whereClause.season = seasonConditions;
      }
    }

    const [atBats, manualLines, leagues, metadata, lineups] = await Promise.all([
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
      leagueIdFilter ? prisma.league.findUnique({
        where: { id: parseInt(leagueIdFilter) },
        include: {
          seasons: {
            orderBy: { year: 'desc' },
            include: { events: { orderBy: { id: 'desc' } } }
          }
        }
      }) : (seasonIdFilter ? prisma.season.findUnique({ 
          where: { id: parseInt(seasonIdFilter) },
          include: { events: { orderBy: { id: 'desc' } } }
        }) : null),
      prisma.lineupEntry.findMany({
        where: { game: whereClause },
        include: {
          player: { select: { name: true } },
          game: { include: { season: { include: { league: true } } } }
        }
      })
    ]);

    const batterMap: Record<number, any> = {};
    const pitcherMap: Record<number, any> = {};
    const gamesWithLiveAtBats = new Set(atBats.map(ab => ab.gameId));

    const addToMap = (map: any, id: number, name: string, game: any) => {
      const leagueLabel = game?.season?.league?.shortName || game?.season?.league?.name || 'AWAA';
      const isMed = game?.season?.isSpeedRestricted;
      const speedLimit = game?.season?.speedLimit;
      const speedLabel = isMed ? (speedLimit ? `MED ${speedLimit}` : 'MED') : 'FAST';

      if (!map[id]) {
        map[id] = { 
          id, name, ab: 0, h: 0, d: 0, t: 0, hr: 0, rbi: 0, r: 0, bb: 0, k: 0, tb: 0, 
          ipOuts: 0, ph: 0, pr: 0, per: 0, pbb: 0, pk: 0, phr: 0, w: 0, l: 0, sv: 0,
          weighted_per: 0, 
          gameIds: new Set<number>(),
          manualGP: 0,
          leaguesPlayed: new Set<string>([leagueLabel]),
          stylesPlayed: new Set<string>([speedLabel])
        };
      } else {
        map[id].leaguesPlayed.add(leagueLabel);
        map[id].stylesPlayed.add(speedLabel);
      }
      return map[id];
    };

    lineups.forEach(l => {
       const b = addToMap(batterMap, l.playerId, l.player.name, l.game);
       b.gameIds.add(l.gameId);
    });

    atBats.forEach(ab => {
      const b = addToMap(batterMap, ab.batterId, ab.batter.name, ab.game);
      b.gameIds.add(ab.gameId);
      
      const res = ab.result?.toUpperCase().replace(/\s/g, '_') || '';
      
      // ⚡ STRICT CHECKS
      const isK = res === 'K' || res === 'STRIKEOUT';
      const isWalk = res === 'WALK' || res === 'BB' || res.includes('HBP');
      const isH = !isK && !isWalk && ['SINGLE', 'DOUBLE', 'TRIPLE', 'HR', '1B', '2B', '3B', '4B'].some(h => res.includes(h) && !res.includes('PLAY'));
      
      if (isWalk) b.bb++;
      else {
        b.ab++;
        if (isK) b.k++;
        if (isH) {
          b.h++;
          const bases = (res.includes('HR') || res.includes('4B')) ? 4 : (res.includes('TRIPLE') || res.includes('3B')) ? 3 : (res.includes('DOUBLE') || res.includes('2B')) ? 2 : 1;
          b.tb += bases;
          if (bases === 2) b.d++; else if (bases === 3) b.t++; else if (bases === 4) b.hr++;
        }
      }
      
      b.rbi += (ab.rbi || ab.runsScored || 0);
      if (ab.scorerIds) {
        ab.scorerIds.split(',').forEach(sid => { 
            const sIdNum = parseInt(sid);
            if (!isNaN(sIdNum)) {
                const runner = batterMap[sIdNum] || addToMap(batterMap, sIdNum, "Unknown", ab.game);
                runner.r++;
                runner.gameIds.add(ab.gameId);
            }
        });
      }

      const p = addToMap(pitcherMap, ab.pitcherId, ab.pitcher.name, ab.game);
      p.gameIds.add(ab.gameId);
      p.ipOuts += (ab.outs || 0);
      
      // ⚡ STRICT PITCHER CHECKS
      if (isK) p.pk++;
      if (isH) { p.ph++; if (res.includes('HR') || res.includes('4B')) p.phr++; }
      if (isWalk) p.pbb++;
      
      const standard = (ab.game?.season?.eraStandard === 4 && ab.game?.season?.inningsPerGame !== 4) 
        ? ab.game?.season?.inningsPerGame 
        : (ab.game?.season?.eraStandard || 4);

      if (ab.runsScored > 0) {
        p.pr += ab.runsScored; p.per += ab.runsScored; p.weighted_per += (ab.runsScored * standard);
      }
    });

    manualLines.forEach((ms: any) => { 
      const p = addToMap(pitcherMap, ms.playerId, ms.player.name, ms.game);
      if (ms.winCount) p.w += ms.winCount;
      if (ms.lossCount) p.l += ms.lossCount;
      if (ms.saveCount) p.sv += ms.saveCount;

      if (!gamesWithLiveAtBats.has(ms.gameId)) {
        const b = addToMap(batterMap, ms.playerId, ms.player.name, ms.game);
        b.manualGP += (ms.gp || 1);
        b.ab += ms.ab; b.h += ms.h; b.hr += ms.hr; b.rbi += ms.rbi; b.r += ms.r; b.bb += ms.bb; b.k += ms.k;
        b.d += ms.d2b; b.t += ms.d3b;
        b.tb += (ms.h - ms.d2b - ms.d3b - ms.hr) + (ms.d2b * 2) + (ms.d3b * 3) + (ms.hr * 4);
        p.ipOuts += (Math.floor(ms.ip) * 3) + Math.round((ms.ip % 1) * 10);
        p.pk += ms.pk; p.ph += ms.ph; p.pr += ms.pr; p.per += ms.per; p.pbb += ms.pbb; p.phr += (ms.phr || 0); 
        const standard = (ms.game?.season?.eraStandard === 4 && ms.game?.season?.inningsPerGame !== 4) ? ms.game?.season?.inningsPerGame : (ms.game?.season?.eraStandard || 4);
        p.weighted_per += (ms.per * standard);
      }
    });

    const getDisplays = (item: any) => {
      const styles = Array.from(item.stylesPlayed) as string[];
      const hasFast = styles.includes('FAST');
      const hasMed = styles.some(s => s.startsWith('MED'));

      let speedDisplay = "";
      if (hasFast && hasMed) {
        speedDisplay = "BOTH";
      } else {
        speedDisplay = styles.sort().join(' / ');
      }

      return {
        leagueDisplay: Array.from(item.leaguesPlayed).join(' / '),
        speedDisplay
      };
    };

    const finalBatters = Object.values(batterMap).map((b: any) => {
      const pa = b.ab + b.bb;
      const displays = getDisplays(b);
      return { 
        ...b, 
        gp: b.gameIds.size + b.manualGP, 
        pa,
        gameIds: Array.from(b.gameIds), 
        leagueDisplay: displays.leagueDisplay,
        speedDisplay: displays.speedDisplay,
        avg: b.ab > 0 ? (b.h / b.ab).toFixed(3).replace(/^0/, '') : '.000', 
        obp: pa > 0 ? ((b.h + b.bb) / pa).toFixed(3).replace(/^0/, '') : '.000', 
        ops: b.ab > 0 ? (((b.h + b.bb) / pa) + (b.tb / b.ab)).toFixed(3).replace(/^0/, '') : '.000' 
      };
    });

    const finalPitchers = Object.values(pitcherMap).map((p: any) => {
      const mathIP = p.ipOuts / 3;
      const displays = getDisplays(p);
      return { 
        id: p.id, name: p.name, w: p.w, l: p.l, sv: p.sv, gp: p.gameIds.size,
        leagueDisplay: displays.leagueDisplay,
        speedDisplay: displays.speedDisplay,
        ip: `${Math.floor(p.ipOuts / 3)}.${p.ipOuts % 3}`, 
        h: p.ph, r: p.pr, er: p.per, bb: p.pbb, k: p.pk, hr: p.phr,
        era: mathIP > 0 ? (p.weighted_per / mathIP).toFixed(2) : "0.00", 
        whip: mathIP > 0 ? ((p.ph + p.pbb) / mathIP).toFixed(2) : "0.00" 
      };
    });

    const meta = metadata as any;
    let seasons: any[] = [];
    let years: number[] = [];
    let events: any[] = [];

    if (leagueIdFilter && meta?.seasons) {
        seasons = meta.seasons;
        years = Array.from(new Set(seasons.map((s: any) => s.year))).sort((a: any, b: any) => b - a);
        if (seasonIdFilter) {
            events = seasons.find((s: any) => s.id === parseInt(seasonIdFilter))?.events || [];
        }
    } else if (seasonIdFilter && meta) {
        events = meta.events || [];
    }

    return NextResponse.json({ 
      leagues, batters: finalBatters, pitchers: finalPitchers, 
      leagueName: leagueIdFilter ? meta?.name : "Global Stats",
      years, seasons, events
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}