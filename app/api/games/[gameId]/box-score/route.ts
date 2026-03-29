import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ gameId: string }> }) {
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

    // Load season at-bats including names for the HR log and stats for the math
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

    // Load all completed games in this season to calculate W-L records
    const seasonGames = await prisma.game.findMany({
      where: { 
        seasonId: game.seasonId, 
        status: 'COMPLETED',
        scheduledAt: { lte: game.scheduledAt }
      }
    });

    const maxInning = Math.max(game.season?.inningsPerGame || 5, ...seasonAtBats.filter(ab => ab.gameId === gId).map(ab => ab.inning));
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
          // NEW DETAILS
          totalPitches: 0, totalStrikes: 0, groundOuts: 0, flyOuts: 0, battersFaced: 0
        };
      }
    });

    // --- DECISION TRACKER FOR ALL GAMES ---
    seasonGames.forEach(sg => {
      const sgAbs = seasonAtBats.filter(ab => ab.gameId === sg.id);
      const sgHomeWon = sg.homeScore > sg.awayScore;
      const winTeamId = sgHomeWon ? sg.homeTeamId : sg.awayTeamId;
      const lossTeamId = sgHomeWon ? sg.awayTeamId : sg.homeTeamId;

      const pSummary: Record<number, { outs: number, er: number, teamId: number }> = {};
      sgAbs.forEach(ab => {
        const pId = ab.pitcherId;
        if (!pSummary[pId]) {
           const pTeamId = ab.isTopInning ? sg.homeTeamId : sg.awayTeamId;
           pSummary[pId] = { outs: 0, er: 0, teamId: pTeamId };
        }
        pSummary[pId].outs += ab.outs;
        pSummary[pId].er += ab.runsScored;
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

    seasonAtBats.forEach(ab => {
      const isCurrentGame = ab.gameId === gId;
      const res = ab.result?.toUpperCase().replace(/\s/g, '_') || '';
      
      const isWalk = res.includes('WALK') || res === 'BB' || res.includes('HBP');
      const isHit = ['SINGLE', 'DOUBLE', 'TRIPLE', 'HR', '1B', '2B', '3B', '4B'].some(h => res.includes(h));
      const isError = res.includes('ERROR');
      const isK = res.includes('K') || res.includes('STRIKEOUT');
      const isOut = ['OUT', 'FLY', 'GROUND', 'DP'].some(o => res.includes(o)) || isK;
      const isAB = isHit || isOut;

      if (isCurrentGame) {
        if (ab.isTopInning) {
          lineScore[ab.inning].away += ab.runsScored;
          if (isHit) totals.awayH++;
          if (isError) totals.awayE++;
        } else {
          lineScore[ab.inning].home += ab.runsScored;
          if (isHit) totals.homeH++;
          if (isError) totals.homeE++;
        }
      }

      const b = batters[ab.batterId];
      if (b) {
        if (isAB) { b.season_ab++; if (isCurrentGame) b.ab++; }
        if (isWalk) { b.season_bb++; if (isCurrentGame) b.bb++; }
        
        if (isHit) {
          let bases = 1;
          if (res.includes('DOUBLE') || res.includes('2B')) bases = 2;
          else if (res.includes('TRIPLE') || res.includes('3B')) bases = 3;
          else if (res.includes('HR') || res.includes('4B')) {
            bases = 4;
            seasonHRTracker[ab.batterId] = (seasonHRTracker[ab.batterId] || 0) + 1;
            if (isCurrentGame) {
              hrEvents.push({
                batterName: ab.batter.name, pitcherName: ab.pitcher.name,
                inning: ab.inning, side: ab.isTopInning ? 'TOP' : 'BOT',
                teamId: ab.isTopInning ? game.awayTeamId : game.homeTeamId,
                seasonTotal: seasonHRTracker[ab.batterId],
                runnersOn: ab.runnersOn || 0, outs: ab.outsAtStart || 0
              });
              b.hr++;
            }
          }
          
          b.season_h++;
          b.season_tb += bases;
          if (isCurrentGame) {
            b.h++;
            if (bases === 2) b.d++;
            if (bases === 3) b.t++;
          }
        }

        if (isCurrentGame) {
          if (isK) b.k++;
          b.rbi += ab.rbi || ab.runsScored;
          if (ab.scorerIds) ab.scorerIds.split(',').map(Number).forEach(sid => { if (batters[sid]) batters[sid].r++; });
        }
      }

      const p = pitchers[ab.pitcherId];
      if (p) {
        p.season_outs += ab.outs;
        if (isHit) p.season_h++;
        if (isWalk) p.season_bb++;

        if (isCurrentGame) {
          p.battersFaced++;
          p.outs += ab.outs;
          if (isHit) p.h++;
          if (isWalk) p.bb++;
          if (isK) p.k++;
          if (res.includes('HR')) p.hr++;
          
          // Categorize Outs for Details Section
          if (res.includes('GROUND')) p.groundOuts += (ab.outs > 1 ? 2 : 1);
          if (res.includes('FLY')) p.flyOuts += (ab.outs > 1 ? 2 : 1);

          // Calculate Pitches (Balls + Strikes + 1 for the final pitch)
          p.totalPitches += (ab.balls + ab.strikes + 1);
          p.totalStrikes += (ab.strikes + (isWalk && !res.includes('HBP') ? 0 : 1));
          
          if (ab.runAttribution) {
            ab.runAttribution.split(',').forEach(pid => { if (Number(pid) === p.id) p.season_er++; });
            if (ab.runAttribution.split(',').includes(String(p.id))) { p.r++; p.er++; }
          } else {
            p.season_er += ab.runsScored;
            p.r += ab.runsScored; p.er += ab.runsScored;
          }
        }
      }
    });

    const formatB = (b: any) => {
      const avg = b.season_ab > 0 ? (b.season_h / b.season_ab) : 0;
      const obp = (b.season_ab + b.season_bb) > 0 ? (b.season_h + b.season_bb) / (b.season_ab + b.season_bb) : 0;
      const slg = b.season_ab > 0 ? (b.season_tb / b.season_ab) : 0;
      return { ...b, avg: avg.toFixed(3).replace(/^0/, ''), ops: (obp + slg).toFixed(3).replace(/^0/, '') };
    };

    const formatP = (p: any) => {
      const ipDecimal = p.season_outs / 3;
      return {
        ...p,
        ip: `${Math.floor(p.outs / 3)}.${p.outs % 3}`,
        whip: ipDecimal > 0 ? ((p.season_h + p.season_bb) / ipDecimal).toFixed(2) : '0.00',
        era: ipDecimal > 0 ? ((p.season_er * eraStandard) / ipDecimal).toFixed(2) : '0.00',
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
    console.error("BOX SCORE API ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}