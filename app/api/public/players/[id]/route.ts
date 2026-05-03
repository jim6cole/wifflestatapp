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

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        lineups: { include: { team: true, game: { include: { season: { include: { league: true } } } } } },
        manualStats: {
          include: { game: { include: { season: { include: { league: true } } } } }
        }
      }
    });

    if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    const atBats = await prisma.atBat.findMany({
      where: { OR: [ { batterId: playerId }, { pitcherId: playerId } ] },
      include: { game: { include: { season: { include: { league: true } } } } }
    });

    const yearlySplits: Record<string, any> = {};
    const teams = new Set(player.lineups.map(l => l.team.name));

    const getSplit = (game: any) => {
      const year = game?.season?.year?.toString() || new Date(game.scheduledAt).getFullYear().toString();
      let lName = game?.season?.league?.shortName || game?.season?.league?.name || 'AWAA';
      if (lName.toUpperCase() === 'MID ATLANTIC WIFFLE') lName = 'MAW';
      
      const isRestricted = game.isSpeedRestricted ?? game.season?.isSpeedRestricted;
      const speedLim = game.speedLimit ?? game.season?.speedLimit ?? 60;
      const style = isRestricted ? `MED (${speedLim}mph)` : 'FAST';
      const splitKey = `${year}-${lName}-${style}`;

      if (!yearlySplits[splitKey]) {
        yearlySplits[splitKey] = {
          year, leagueName: lName, style,
          batting: { ab: 0, h: 0, d: 0, t: 0, hr: 0, rbi: 0, bb: 0, k: 0, tb: 0 },
          pitching: { w: 0, l: 0, sv: 0, outs: 0, h: 0, r: 0, er: 0, bb: 0, k: 0, hr: 0, faced: 0, weighted_er: 0 },
          liveGameIds: new Set<number>(),
          manualGameIds: new Set<number>(),
          importedGp: 0
        };
      }
      return yearlySplits[splitKey];
    };

    const gamesWithLiveAtBats = new Set(atBats.map(ab => ab.gameId));

    player.lineups.forEach(l => {
      if (!l.game) return;
      const split = getSplit(l.game);
      split.liveGameIds.add(l.gameId);
    });

    // ⚡ FIX: Add Live Games W/L/SV Tracker Map
    const liveGamesTracker = new Map();

    atBats.forEach(ab => {
      if (ab.game?.isManualOverride) return;

      if (!liveGamesTracker.has(ab.gameId)) {
          liveGamesTracker.set(ab.gameId, { gameObj: ab.game, homeRuns: 0, awayRuns: 0, homePitcher: null, awayPitcher: null, pitcherOfRecordW: null, pitcherOfRecordL: null, homePitcherEntryLead: 0, awayPitcherEntryLead: 0, lastHomePitcher: null, lastAwayPitcher: null });
      }
      const trk = liveGamesTracker.get(ab.gameId);

      // LEAD TRACKER
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

      const split = getSplit(ab.game);
      split.liveGameIds.add(ab.gameId);
      
      const res = ab.result?.toUpperCase().replace(/\s/g, '_') || '';
      const isManualOut = res === 'MANUAL_OUT';
      
      const isK = res === 'K' || res === 'STRIKEOUT';
      const isWalk = ['WALK', 'BB', 'HBP'].some(w => res.includes(w));
      const isOut = ['OUT', 'FLY', 'GROUND', 'DP', 'DOUBLE_PLAY', 'TRIPLE_PLAY'].some(o => res.includes(o)) || isK;
      const isHit = !isOut && !isWalk && !isManualOut && ['SINGLE', 'DOUBLE', 'TRIPLE', 'HR', '1B', '2B', '3B', '4B'].some(h => res.includes(h) && !res.includes('PLAY'));

      if (!isManualOut && ab.batterId === playerId) {
        if (isWalk) split.batting.bb++;
        else if (isHit || isOut) {
          split.batting.ab++;
          if (isK) split.batting.k++;
          if (isHit) {
            split.batting.h++;
            const bases = (res.includes('HR') || res.includes('4B')) ? 4 : (res.includes('TRIPLE') || res.includes('3B')) ? 3 : (res.includes('DOUBLE') || res.includes('2B')) ? 2 : 1;
            split.batting.tb += bases;
            if (bases === 2) split.batting.d++;
            else if (bases === 3) split.batting.t++;
            else if (bases === 4) split.batting.hr++;
          }
        }
        split.batting.rbi += (ab.rbi || ab.runsScored || 0);
      }

      if (ab.pitcherId === playerId) {
        const standard = (ab.game?.season?.eraStandard === 4 && ab.game?.season?.inningsPerGame !== 4) 
          ? ab.game?.season?.inningsPerGame 
          : (ab.game?.season?.eraStandard || 4);

        split.pitching.faced++;
        split.pitching.outs += (ab.outs || 0);
        if (isHit) split.pitching.h++;
        if (isWalk) split.pitching.bb++;
        if (isK) split.pitching.k++;
        if (res.includes('HR') || res.includes('4B')) split.pitching.hr++;
        
        let chargedRuns = 0;
        if (ab.runsScored > 0) {
            if (ab.runAttribution) {
                const attributionIds = ab.runAttribution.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
                chargedRuns = attributionIds.filter(id => id === playerId).length;
            } else {
                chargedRuns = ab.runsScored;
            }
        }
        split.pitching.r += chargedRuns;
        split.pitching.er += chargedRuns;
        split.pitching.weighted_er += (chargedRuns * standard);
      }
    });

    liveGamesTracker.forEach((trk) => {
        const homeWinner = trk.homeRuns > trk.awayRuns;
        
        let wId = trk.pitcherOfRecordW;
        let lId = trk.pitcherOfRecordL;

        if (!wId && homeWinner) wId = trk.lastHomePitcher;
        if (!wId && !homeWinner && trk.awayRuns > trk.homeRuns) wId = trk.lastAwayPitcher;

        const split = getSplit(trk.gameObj);

        if (Number(wId) === playerId) split.pitching.w++;
        if (Number(lId) === playerId) split.pitching.l++;

        let closerId = null;
        let isSave = false;

        if (homeWinner) {
            closerId = trk.lastHomePitcher;
            if (closerId && closerId !== wId && trk.homePitcherEntryLead >= 1 && trk.homePitcherEntryLead <= 3) isSave = true;
        } else if (trk.awayRuns > trk.homeRuns) {
            closerId = trk.lastAwayPitcher;
            if (closerId && closerId !== wId && trk.awayPitcherEntryLead >= 1 && trk.awayPitcherEntryLead <= 3) isSave = true;
        }

        if (isSave && Number(closerId) === playerId) split.pitching.sv++;
    });

    player.manualStats.forEach(ms => {
      const split = getSplit(ms.game);
      
      if (ms.gp && ms.gp > 1) {
        split.importedGp += ms.gp;
      } else {
        split.manualGameIds.add(ms.gameId);
      }
      
      if (ms.winCount && ms.winCount > 0) split.pitching.w += ms.winCount;
      if (ms.lossCount && ms.lossCount > 0) split.pitching.l += ms.lossCount;
      if (ms.saveCount && ms.saveCount > 0) split.pitching.sv += ms.saveCount;

      const isOverridden = ms.game?.isManualOverride;
      const hasNoAtBats = !gamesWithLiveAtBats.has(ms.gameId);

      if (!isOverridden && !hasNoAtBats) return;

      split.batting.ab += ms.ab || 0; 
      split.batting.h += ms.h || 0; 
      split.batting.hr += ms.hr || 0;
      split.batting.rbi += ms.rbi || 0; 
      split.batting.bb += ms.bb || 0; 
      split.batting.k += ms.k || 0;
      split.batting.d += ms.d2b || 0; 
      split.batting.t += ms.d3b || 0;
      
      const d2b = ms.d2b || 0;
      const d3b = ms.d3b || 0;
      const hr = ms.hr || 0;
      const h = ms.h || 0;
      split.batting.tb += (h - d2b - d3b - hr) + (d2b * 2) + (d3b * 3) + (hr * 4);

      if ((ms.ip || 0) > 0 || (ms.pk || 0) > 0) {
        const standard = (ms.game?.season?.eraStandard === 4 && ms.game?.season?.inningsPerGame !== 4) 
          ? ms.game?.season?.inningsPerGame 
          : (ms.game?.season?.eraStandard || 4);

        const mOuts = (Math.floor(ms.ip || 0) * 3) + (Math.round(((ms.ip || 0) % 1) * 10));
        split.pitching.outs += mOuts;
        split.pitching.h += ms.ph || 0; 
        split.pitching.bb += ms.pbb || 0; 
        split.pitching.k += ms.pk || 0;
        split.pitching.r += ms.pr || 0; 
        split.pitching.er += ms.per || 0;
        split.pitching.hr += ms.phr || 0;
        split.pitching.weighted_er += ((ms.per || 0) * standard);
      }
    });

    const rawSplits = Object.values(yearlySplits);

    const formattedSplits = rawSplits.map((s: any) => {
      const pa = s.batting.ab + s.batting.bb;
      const obp = pa > 0 ? (s.batting.h + s.batting.bb) / pa : 0;
      const slg = s.batting.ab > 0 ? s.batting.tb / s.batting.ab : 0;
      const mathIP = s.pitching.outs / 3;

      const uniqueSingleGames = new Set([...s.liveGameIds, ...s.manualGameIds]).size;
      const totalGp = uniqueSingleGames + s.importedGp;

      return {
        ...s,
        gp: totalGp,
        batting: {
          ...s.batting, pa,
          avg: s.batting.ab > 0 ? (s.batting.h / s.batting.ab).toFixed(3).replace(/^0/, '') : '.000',
          ops: (obp + slg).toFixed(3).replace(/^0/, '')
        },
        pitching: {
          ...s.pitching,
          ip: `${Math.floor(s.pitching.outs / 3)}.${s.pitching.outs % 3}`,
          era: mathIP > 0 ? (s.pitching.weighted_er / mathIP).toFixed(2) : '0.00',
          whip: mathIP > 0 ? ((s.pitching.h + s.pitching.bb) / mathIP).toFixed(2) : '0.00'
        }
      };
    }).sort((a, b) => parseInt(b.year) - parseInt(a.year));

    const careerTotals = rawSplits.reduce((acc, s) => ({
      ab: acc.ab + s.batting.ab, h: acc.h + s.batting.h, hr: acc.hr + s.batting.hr, 
      rbi: acc.rbi + s.batting.rbi, bb: acc.bb + s.batting.bb, tb: acc.tb + s.batting.tb,
      w: acc.w + s.pitching.w, l: acc.l + s.pitching.l, sv: acc.sv + s.pitching.sv,
      k: acc.k + s.pitching.k, outs: acc.outs + s.pitching.outs, 
      weighted_er: acc.weighted_er + s.pitching.weighted_er, faced: acc.faced + s.pitching.faced,
      ph: acc.ph + s.pitching.h, pbb: acc.pbb + s.pitching.bb
    }), { ab: 0, h: 0, hr: 0, rbi: 0, bb: 0, tb: 0, w: 0, l: 0, sv: 0, k: 0, outs: 0, weighted_er: 0, faced: 0, ph: 0, pbb: 0 });

    const careerMathIP = careerTotals.outs / 3;
    const careerPA = careerTotals.ab + careerTotals.bb;
    const careerOBP = careerPA > 0 ? (careerTotals.h + careerTotals.bb) / careerPA : 0;
    const careerSLG = careerTotals.ab > 0 ? careerTotals.tb / careerTotals.ab : 0;

    return NextResponse.json({
      player: { id: player.id, name: player.name, teams: Array.from(teams) },
      career: {
        rates: {
          avg: careerTotals.ab > 0 ? (careerTotals.h / careerTotals.ab).toFixed(3).replace(/^0/, '') : '.000',
          ops: (careerOBP + careerSLG).toFixed(3).replace(/^0/, ''),
          era: careerMathIP > 0 ? (careerTotals.weighted_er / careerMathIP).toFixed(2) : '0.00',
          ip: `${Math.floor(careerTotals.outs / 3)}.${careerTotals.outs % 3}`,
          whip: careerMathIP > 0 ? ((careerTotals.ph + careerTotals.pbb) / careerMathIP).toFixed(2) : '0.00'
        },
        batting: { hr: careerTotals.hr, rbi: careerTotals.rbi },
        pitching: { k: careerTotals.k, faced: careerTotals.faced, sv: careerTotals.sv, w: careerTotals.w, l: careerTotals.l, record: `${careerTotals.w}-${careerTotals.l}` }
      },
      splits: formattedSplits
    });
  } catch (error) {
    console.error("Player Card API Error:", error);
    return NextResponse.json({ error: "Failed to load player stats" }, { status: 500 });
  }
}