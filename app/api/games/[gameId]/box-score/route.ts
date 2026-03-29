import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const gId = parseInt(gameId);

  try {
    const game = await prisma.game.findUnique({
      where: { id: gId },
      include: { homeTeam: true, awayTeam: true, season: true }
    });

    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
    const eraStandard = game.season?.eraStandard || 4;

    const lineups = await prisma.lineupEntry.findMany({
      where: { gameId: gId },
      include: { player: true },
      orderBy: { battingOrder: 'asc' }
    });

    const gameAtBats = await prisma.atBat.findMany({
      where: { gameId: gId },
      include: { batter: true, pitcher: true },
      orderBy: { id: 'asc' }
    });

    const seasonAtBats = await prisma.atBat.findMany({
      where: { 
        game: { 
          seasonId: game.seasonId, 
          scheduledAt: { lte: game.scheduledAt } 
        } 
      },
      include: { batter: true, pitcher: true },
      orderBy: { id: 'asc' }
    });

    const seasonGames = await prisma.game.findMany({
      where: { 
        seasonId: game.seasonId, 
        status: 'COMPLETED',
        scheduledAt: { lte: game.scheduledAt }
      }
    });

    // --- 1. LINE SCORE & TEAM TOTALS ---
    const maxInning = Math.max(game.season?.inningsPerGame || 5, ...gameAtBats.map(ab => ab.inning));
    const lineScore: Record<number, { away: number, home: number }> = {};
    for (let i = 1; i <= maxInning; i++) { lineScore[i] = { away: 0, home: 0 }; }
    const totals = { awayH: 0, awayE: 0, homeH: 0, homeE: 0 };

    const batters: Record<number, any> = {};
    const pitchers: Record<number, any> = {};
    const hrEvents: any[] = [];
    const seasonHRTracker: Record<number, number> = {};

    lineups.forEach(l => {
      batters[l.playerId] = { 
        id: l.playerId, name: l.player.name, teamId: l.teamId, slot: l.battingOrder, 
        ab: 0, r: 0, h: 0, d: 0, t: 0, hr: 0, rbi: 0, bb: 0, k: 0, 
        season_ab: 0, season_h: 0, season_bb: 0, season_tb: 0 
      };
      if (l.isPitcher || pitchers[l.playerId]) {
        pitchers[l.playerId] = { 
          id: l.playerId, name: l.player.name, teamId: l.teamId, 
          outs: 0, h: 0, r: 0, er: 0, bb: 0, k: 0, hr: 0, 
          season_outs: 0, season_h: 0, season_bb: 0, season_er: 0,
          wins: 0, losses: 0, decision: null,
          totalPitches: 0, totalStrikes: 0, groundOuts: 0, flyOuts: 0, battersFaced: 0
        };
      }
    });

    // --- 2. PITCHER DECISION TRACKER (SEASON HISTORY) ---
    seasonGames.forEach(sg => {
      const sgAbs = seasonAtBats.filter(ab => ab.gameId === sg.id);
      const sgHomeWon = sg.homeScore > sg.awayScore;
      const winTeamId = sgHomeWon ? sg.homeTeamId : sg.awayTeamId;
      const lossTeamId = sgHomeWon ? sg.awayTeamId : sg.homeTeamId;

      const pSummary: Record<number, { outs: number, er: number, teamId: number }> = {};
      sgAbs.forEach(ab => {
        if (!pSummary[ab.pitcherId]) {
           const pTeamId = ab.isTopInning ? sg.homeTeamId : sg.awayTeamId;
           pSummary[ab.pitcherId] = { outs: 0, er: 0, teamId: pTeamId };
        }
        pSummary[ab.pitcherId].outs += ab.outs;
        pSummary[ab.pitcherId].er += ab.runsScored;
      });

      const pArray = Object.entries(pSummary).map(([id, s]) => ({ id: Number(id), ...s }));
      const winner = pArray.filter(p => p.teamId === winTeamId).sort((a,b) => b.outs - a.outs)[0];
      const loser = pArray.filter(p => p.teamId === lossTeamId).sort((a,b) => b.er - a.er)[0];

      if (winner && pitchers[winner.id]) pitchers[winner.id].wins++;
      if (loser && pitchers[loser.id]) pitchers[loser.id].losses++;
      
      if (sg.id === gId) {
        if (winner && pitchers[winner.id]) pitchers[winner.id].decision = 'W';
        if (loser && pitchers[loser.id]) pitchers[loser.id].decision = 'L';
      }
    });

    // --- 3. MAIN STAT ACCUMULATION ---
    seasonAtBats.forEach(ab => {
      const isCurrent = ab.gameId === gId;
      const res = ab.result?.toUpperCase().replace(/\s/g, '_') || '';
      const isWalk = res.includes('WALK') || res === 'BB' || res.includes('HBP');
      const isHit = ['SINGLE', 'DOUBLE', 'TRIPLE', 'HR', '1B', '2B', '3B', '4B'].some(h => res.includes(h));
      const isOut = ['OUT', 'FLY', 'GROUND', 'DP', 'K', 'STRIKEOUT'].some(o => res.includes(o));
      const isAB = isHit || isOut;

      if (isCurrent) {
        if (ab.isTopInning) {
          lineScore[ab.inning].away += ab.runsScored;
          if (isHit) totals.awayH++;
          if (res.includes('ERROR')) totals.awayE++;
        } else {
          lineScore[ab.inning].home += ab.runsScored;
          if (isHit) totals.homeH++;
          if (res.includes('ERROR')) totals.homeE++;
        }
      }

      const b = batters[ab.batterId];
      if (b) {
        if (isAB) { b.season_ab++; if (isCurrent) b.ab++; }
        if (isWalk) { b.season_bb++; if (isCurrent) b.bb++; }
        if (isHit) {
          let bases = 1;
          if (res.includes('DOUBLE') || res.includes('2B')) bases = 2;
          else if (res.includes('TRIPLE') || res.includes('3B')) bases = 3;
          else if (res.includes('HR') || res.includes('4B')) {
            bases = 4;
            seasonHRTracker[ab.batterId] = (seasonHRTracker[ab.batterId] || 0) + 1;
            if (isCurrent) {
              hrEvents.push({
                batterName: ab.batter.name, pitcherName: ab.pitcher.name,
                inning: ab.inning, side: ab.isTopInning ? 'TOP' : 'BOT',
                teamId: ab.isTopInning ? game.awayTeamId : game.homeTeamId,
                seasonTotal: seasonHRTracker[ab.batterId],
                runnersOn: (ab as any).runnersOn || 0,
                outs: (ab as any).outsAtStart || 0
              });
              b.hr++;
            }
          }
          b.season_h++; b.season_tb += bases;
          if (isCurrent) { b.h++; if (bases === 2) b.d++; if (bases === 3) b.t++; }
        }
        if (isCurrent) {
          if (res.includes('K')) b.k++;
          b.rbi += ab.rbi || ab.runsScored;
          if (ab.scorerIds) ab.scorerIds.split(',').map(Number).forEach(sid => { if (batters[sid]) batters[sid].r++; });
        }
      }

      const p = pitchers[ab.pitcherId];
      if (p) {
        p.season_outs += ab.outs;
        if (isHit) p.season_h++;
        if (isWalk) p.season_bb++;
        if (isCurrent) {
          p.battersFaced++; p.outs += ab.outs;
          if (isHit) p.h++; if (isWalk) p.bb++; if (res.includes('K')) p.k++; if (res.includes('HR')) p.hr++;
          if (res.includes('GROUND')) p.groundOuts += (ab.outs > 1 ? 2 : 1);
          if (res.includes('FLY')) p.flyOuts += (ab.outs > 1 ? 2 : 1);
          p.totalPitches += (ab.balls + ab.strikes + 1);
          p.totalStrikes += (ab.strikes + (isWalk ? 0 : 1));
          p.r += ab.runsScored; p.er += ab.runsScored;
        }
      }
    });

    const formatB = (b: any) => ({
      ...b,
      avg: b.season_ab > 0 ? (b.season_h / b.season_ab).toFixed(3).replace(/^0/, '') : '.000',
      ops: (b.season_ab + b.season_bb) > 0 ? (((b.season_h + b.season_bb) / (b.season_ab + b.season_bb)) + (b.season_tb / b.season_ab)).toFixed(3).replace(/^0/, '') : '.000'
    });

    const formatP = (p: any) => {
      const ipDec = p.season_outs / 3;
      return {
        ...p,
        ip: `${Math.floor(p.outs / 3)}.${p.outs % 3}`,
        whip: ipDec > 0 ? ((p.season_h + p.season_bb) / ipDec).toFixed(2) : '0.00',
        era: ipDec > 0 ? ((p.season_er * eraStandard) / ipDec).toFixed(2) : '0.00',
        record: `${p.wins}-${p.losses}`
      };
    };

    return NextResponse.json({
      lineScore: Object.entries(lineScore).map(([inn, runs]) => ({ inning: inn, ...runs })),
      totals,
      away: {
        batters: Object.values(batters).filter(b => b.teamId === game.awayTeamId).map(formatB),
        pitchers: Object.values(pitchers).filter(p => p.teamId === game.awayTeamId).map(formatP)
      },
      home: {
        batters: Object.values(batters).filter(b => b.teamId === game.homeTeamId).map(formatB),
        pitchers: Object.values(pitchers).filter(p => p.teamId === game.homeTeamId).map(formatP)
      },
      hrEvents
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}