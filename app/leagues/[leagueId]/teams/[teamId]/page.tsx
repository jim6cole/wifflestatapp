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

    const gameWhere: any = { 
      status: 'COMPLETED',
      OR: [{ homeTeamId: tId }, { awayTeamId: tId }]
    };

    if (seasonIdFilter) gameWhere.seasonId = parseInt(seasonIdFilter);
    if (eventIdFilter) gameWhere.eventId = parseInt(eventIdFilter);
    if (yearFilter && yearFilter !== 'all') {
      gameWhere.season = { year: parseInt(yearFilter) };
    }

    const [team, games, atBats, manualLines, lineups, atBatGames] = await Promise.all([
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
      prisma.lineupEntry.findMany({
         where: { teamId: tId, game: gameWhere },
         include: { player: { select: { name: true } }, game: { include: { season: true } } }
      }),
      prisma.atBat.groupBy({ by: ['gameId'] })
    ]);

    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

    const gamesWithLiveAtBats = new Set(atBatGames.map(g => g.gameId));

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
            weighted_per: 0, gameIds: new Set<number>(), importedGp: 0
        };
      }
      return map[id];
    };

    lineups.forEach(l => {
        // ⚡ FIX: Do NOT blindly award batting GP from lineups if the game was manually overridden!
        if (l.game?.isManualOverride) return;
        
        const b = initPlayer(batterMap, l.playerId, l.player.name);
        b.gameIds.add(l.gameId);
    });

    const liveGamesTracker = new Map();

    atBats.forEach(ab => {
      if (ab.game?.isManualOverride) return;

      if (!liveGamesTracker.has(ab.gameId)) {
          liveGamesTracker.set(ab.gameId, { gameObj: ab.game, homeRuns: 0, awayRuns: 0, homePitcher: null, awayPitcher: null, pitcherOfRecordW: null, pitcherOfRecordL: null, homePitcherEntryLead: 0, awayPitcherEntryLead: 0, lastHomePitcher: null, lastAwayPitcher: null });
      }
      const trk = liveGamesTracker.get(ab.gameId);

      if (ab.isTopInning) { 
          if (trk.homePitcher !== ab.pitcherId) {
              trk.homePitcher = ab.pitcherId;
              trk.homePitcherEntryLead = trk.homeRuns - trk.awayRuns;
              if (trk.pitcherOfRecordW === null && trk.homeRuns > trk.awayRuns) trk.pitcherOfRecordW = ab.pitcherId;
          }
          trk.lastHomePitcher = ab.pitcherId;
          const oldAwayRuns = trk.awayRuns;
          trk.awayRuns += (ab.runsScored || 0);

          if (trk.awayRuns > trk.homeRuns && oldAwayRuns <= trk.homeRuns) {
              trk.pitcherOfRecordW = trk.awayPitcher;
              trk.pitcherOfRecordL = trk.homePitcher;
          }
      } else { 
          if (trk.awayPitcher !== ab.pitcherId) {
              trk.awayPitcher = ab.pitcherId;
              trk.awayPitcherEntryLead = trk.awayRuns - trk.homeRuns;
              if (trk.pitcherOfRecordW === null && trk.awayRuns > trk.homeRuns) trk.pitcherOfRecordW = ab.pitcherId;
          }
          trk.lastAwayPitcher = ab.pitcherId;
          const oldHomeRuns = trk.homeRuns;
          trk.homeRuns += (ab.runsScored || 0);

          if (trk.homeRuns > trk.awayRuns && oldHomeRuns <= trk.awayRuns) {
              trk.pitcherOfRecordW = trk.homePitcher;
              trk.pitcherOfRecordL = trk.awayPitcher;
          }
      }

      const isBatterOnThisTeam = ab.game.lineups.some((l:any) => l.playerId === ab.batterId && l.teamId === tId);
      const isPitcherOnThisTeam = ab.game.lineups.some((l:any) => l.playerId === ab.pitcherId && l.teamId === tId);

      const res = ab.result?.toUpperCase().replace(/\s/g, '_') || '';
      const isManualOut = res === 'MANUAL_OUT';
      
      const isK = res === 'K' || res === 'STRIKEOUT';
      const isWalk = ['WALK', 'BB', 'HBP'].some(w => res.includes(w));
      const isOut = ['OUT', 'FLY', 'GROUND', 'DP', 'DOUBLE_PLAY', 'TRIPLE_PLAY'].some(o => res.includes(o)) || isK;
      const isHit = !isOut && !isWalk && !isManualOut && ['SINGLE', 'DOUBLE', 'TRIPLE', 'HR', '1B', '2B', '3B', '4B'].some(h => res.includes(h) && !res.includes('PLAY'));

      if (!isManualOut && ab.batterId && ab.batter && isBatterOnThisTeam) {
        const b = initPlayer(batterMap, ab.batterId, ab.batter.name);
        b.gameIds.add(ab.gameId);
        
        if (isWalk) b.bb++;
        else if (isHit || isOut) {
            b.ab++;
            if (isK) b.k++;
            if (isHit) {
                b.h++;
                const bases = res.includes('HR') || res.includes('4B') ? 4 : res.includes('TRIPLE') || res.includes('3B') ? 3 : res.includes('DOUBLE') || res.includes('2B') ? 2 : 1;
                b.tb += bases;
                if (bases === 2) b.d++; else if (bases === 3) b.t++; else if (bases === 4) b.hr++;
            }
        }
        b.rbi += (ab.rbi || ab.runsScored || 0);
      }

      if (ab.scorerIds) {
        ab.scorerIds.split(',').forEach(sid => { 
            const sIdNum = parseInt(sid);
            if (!isNaN(sIdNum)) {
                const isRunnerOnTeam = ab.game.lineups.some((l:any) => l.playerId === sIdNum && l.teamId === tId);
                if (isRunnerOnTeam) {
                    const runner = batterMap[sIdNum] || initPlayer(batterMap, sIdNum, "Unknown");
                    runner.r++;
                    runner.gameIds.add(ab.gameId);
                }
            }
        });
      }

      if (ab.pitcherId && ab.pitcher && isPitcherOnThisTeam) {
        const p = initPlayer(pitcherMap, ab.pitcherId, ab.pitcher.name);
        p.gameIds.add(ab.gameId);
        p.ipOuts += (ab.outs || 0);
        
        if (isK) p.pk++;
        if (isHit) { p.ph++; if (res.includes('HR') || res.includes('4B')) p.phr++; }
        if (isWalk) p.pbb++;
        
        const standard = (ab.game?.season?.eraStandard === 4 && ab.game?.season?.inningsPerGame !== 4) 
            ? ab.game?.season?.inningsPerGame : (ab.game?.season?.eraStandard || 4);
        
        if (ab.runsScored > 0) {
            let chargedRuns = 0;
            if (ab.runAttribution) {
                const attrIds = ab.runAttribution.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
                chargedRuns = attrIds.filter(id => id === ab.pitcherId).length;
            } else {
                chargedRuns = ab.runsScored;
            }
            p.pr += chargedRuns; p.per += chargedRuns; p.weighted_per += (chargedRuns * standard);
        }
      }
    });

    liveGamesTracker.forEach((trk) => {
        const homeWinner = trk.homeRuns > trk.awayRuns;
        let wId = trk.pitcherOfRecordW;
        let lId = trk.pitcherOfRecordL;

        if (!wId && homeWinner) wId = trk.lastHomePitcher;
        if (!wId && !homeWinner && trk.awayRuns > trk.homeRuns) wId = trk.lastAwayPitcher;

        let closerId = null;
        let isSave = false;

        if (homeWinner) {
            closerId = trk.lastHomePitcher;
            if (closerId && closerId !== wId && trk.homePitcherEntryLead >= 1 && trk.homePitcherEntryLead <= 3) isSave = true;
        } else if (trk.awayRuns > trk.homeRuns) {
            closerId = trk.lastAwayPitcher;
            if (closerId && closerId !== wId && trk.awayPitcherEntryLead >= 1 && trk.awayPitcherEntryLead <= 3) isSave = true;
        }

        const isOnTeam = (pid: number) => trk.gameObj.lineups.some((l:any) => l.playerId === pid && l.teamId === tId);

        if (wId && isOnTeam(Number(wId)) && pitcherMap[Number(wId)]) pitcherMap[Number(wId)].w++;
        if (lId && isOnTeam(Number(lId)) && pitcherMap[Number(lId)]) pitcherMap[Number(lId)].l++;
        if (isSave && closerId && isOnTeam(Number(closerId)) && pitcherMap[Number(closerId)]) pitcherMap[Number(closerId)].sv++;
    });

    manualLines.forEach(ms => {
        const isOverridden = ms.game?.isManualOverride;
        const hasNoAtBats = !gamesWithLiveAtBats.has(ms.gameId);

        if (!isOverridden && !hasNoAtBats) return;

        // ⚡ FIX: Determine if they actually earned stats to warrant a Game Played (GP)
        const hasBatting = (ms.ab > 0 || ms.bb > 0 || ms.r > 0 || ms.h > 0 || ms.k > 0 || ms.rbi > 0 || ms.d2b > 0 || ms.d3b > 0 || ms.hr > 0);
        const hasPitching = ((ms.ip || 0) > 0 || (ms.pk || 0) > 0 || (ms.pbb || 0) > 0 || (ms.ph || 0) > 0 || (ms.pr || 0) > 0 || (ms.per || 0) > 0 || (ms.winCount || 0) > 0 || (ms.lossCount || 0) > 0 || (ms.saveCount || 0) > 0 || (ms.phr || 0) > 0);

        if (hasBatting || (ms.gp && ms.gp > 1)) {
            const b = initPlayer(batterMap, ms.playerId, ms.player.name);
            
            if (ms.gp && ms.gp > 1) {
                b.importedGp += ms.gp;
            } else if (hasBatting) {
                b.gameIds.add(ms.gameId);
            }

            b.ab += ms.ab; b.h += ms.h; b.hr += ms.hr; b.rbi += ms.rbi; b.r += ms.r; b.bb += ms.bb; b.k += ms.k;
            b.d += ms.d2b; b.t += ms.d3b;
            b.tb += (ms.h - ms.d2b - ms.d3b - ms.hr) + (ms.d2b * 2) + (ms.d3b * 3) + (ms.hr * 4);
        }

        if (hasPitching || (ms.gp && ms.gp > 1 && hasPitching)) {
            const p = initPlayer(pitcherMap, ms.playerId, ms.player.name);
            
            if (ms.gp && ms.gp > 1 && hasPitching) {
                p.importedGp += ms.gp;
            } else if (hasPitching) {
                p.gameIds.add(ms.gameId);
            }

            p.ipOuts += (Math.floor(ms.ip) * 3) + Math.round((ms.ip % 1) * 10);
            p.pk += ms.pk; p.ph += ms.ph; p.pr += ms.pr; p.per += ms.per; p.pbb += ms.pbb; p.phr += (ms.phr || 0);
            if (ms.winCount) p.w += ms.winCount; if (ms.lossCount) p.l += ms.lossCount; if (ms.saveCount) p.sv += ms.saveCount;
            
            const standard = (ms.game?.season?.eraStandard === 4 && ms.game?.season?.inningsPerGame !== 4) 
                ? ms.game?.season?.inningsPerGame : (ms.game?.season?.eraStandard || 4);
            p.weighted_per += (ms.per * standard);
        }
    });

    const batters = Object.values(batterMap).map((b: any) => {
        const pa = b.ab + b.bb;
        const obp = pa > 0 ? (b.h + b.bb) / pa : 0;
        const slg = b.ab > 0 ? b.tb / b.ab : 0;
        return {
            ...b, 
            gp: b.gameIds.size + b.importedGp, 
            pa,
            gameIds: Array.from(b.gameIds),
            avg: b.ab > 0 ? (b.h / b.ab).toFixed(3).replace(/^0/, '') : '.000',
            obp: pa > 0 ? obp.toFixed(3).replace(/^0/, '') : '.000',
            slg: b.ab > 0 ? slg.toFixed(3).replace(/^0/, '') : '.000',
            ops: (pa > 0 || b.ab > 0) ? (obp + slg).toFixed(3).replace(/^0/, '') : '.000'
        };
    });

    const pitchers = Object.values(pitcherMap).map((p: any) => {
        const mathIP = p.ipOuts / 3;
        return {
            ...p, 
            gp: p.gameIds.size + p.importedGp, 
            ip: `${Math.floor(p.ipOuts / 3)}.${p.ipOuts % 3}`,
            gameIds: Array.from(p.gameIds),
            era: mathIP > 0 ? (p.weighted_per / mathIP).toFixed(2) : "0.00",
            whip: mathIP > 0 ? ((p.ph + p.pbb) / mathIP).toFixed(2) : "0.00"
        };
    });

    return NextResponse.json({
      teamName: team.name,
      record: { w, l, t, rf, ra, pct: (w+l+t) > 0 ? ((w + (t*0.5))/(w+l+t)).toFixed(3).replace(/^0/, '') : '.000' },
      batters, pitchers,
      seasons: team.league.seasons,
      years: Array.from(new Set(team.league.seasons.map((s:any) => s.year))).sort((a:any, b:any) => b-a)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}