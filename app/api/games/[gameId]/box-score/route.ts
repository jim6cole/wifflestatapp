import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const gId = parseInt(gameId);

  try {
    const currentGame = await prisma.game.findUnique({
      where: { id: gId },
      select: { seasonId: true, scheduledAt: true, homeTeamId: true, awayTeamId: true }
    });

    if (!currentGame) return NextResponse.json({ error: "Game not found" }, { status: 404 });

    const lineups = await prisma.lineupEntry.findMany({
      where: { gameId: gId },
      include: { player: true }
    });

    const batterStats: Record<string, any> = {};
    const pitcherStats: Record<number, any> = {};
    const hrEvents: any[] = [];
    const seasonHRTracker: Record<number, number> = {};
    const playerLookup: Record<number, { name: string, teamId: number, position: string }> = {};

    lineups.forEach(entry => {
      playerLookup[entry.playerId] = { 
        name: entry.player.name, 
        teamId: entry.teamId,
        position: entry.position 
      };

      if (!pitcherStats[entry.playerId]) {
        pitcherStats[entry.playerId] = {
          id: entry.playerId, name: entry.player.name, teamId: entry.teamId,
          outs: 0, k: 0, h: 0, bb: 0, hr: 0, r: 0, er: 0,
          season_outs: 0, season_er: 0, season_h: 0, season_bb: 0, faced: 0
        };
      }
    });

    const seasonAtBats = await prisma.atBat.findMany({
      where: {
        game: { seasonId: currentGame.seasonId, scheduledAt: { lte: currentGame.scheduledAt } }
      },
      include: {
        batter: { select: { name: true } },
        pitcher: { select: { name: true } },
        game: { select: { id: true, homeTeamId: true, awayTeamId: true, scheduledAt: true } }
      },
      orderBy: [{ game: { scheduledAt: 'asc' } }, { id: 'asc' }]
    });

    seasonAtBats.forEach((ab) => {
      const isCurrent = ab.gameId === gId;
      const res = ab.result?.toUpperCase() || '';
      const isHR = res.includes('HR') || res.includes('4B');

      if (isHR) {
        seasonHRTracker[ab.batterId] = (seasonHRTracker[ab.batterId] || 0) + 1;
        if (isCurrent) {
          const batterTeamId = ab.isTopInning ? ab.game.awayTeamId : ab.game.homeTeamId;
          hrEvents.push({
            batterName: ab.batter.name,
            pitcherName: ab.pitcher.name,
            inning: ab.inning,
            teamId: batterTeamId,
            seasonTotal: seasonHRTracker[ab.batterId],
            // Casting to 'any' stops the red squiggles and lets the code run
            runnersOn: (ab as any).runnersOn || 0,
            outs: (ab as any).outsAtStart || 0
          });
        }
      }

      // --- STAT AGGREGATION ---
      const isHit = ['SINGLE', 'CLEAN_SINGLE', 'DOUBLE', 'CLEAN_DOUBLE', 'GROUND_RULE_DOUBLE', 'TRIPLE', 'HR', '1B', '2B', '3B', '4B'].some(h => res.includes(h));
      const isOut = ['K', 'STRIKEOUT', 'FLY_OUT', 'GROUND_OUT', 'OUT', 'DP', 'TAG UP', 'SAC FLY'].some(o => res.includes(o));
      const isWalk = res.includes('WALK') || res.includes('BB') || res.includes('HBP');

      const bKey = `${ab.batterId}-${ab.slot}`;
      const playerData = playerLookup[ab.batterId];
      if (playerData && (isCurrent || ab.gameId !== gId)) {
        if (!batterStats[bKey]) {
          batterStats[bKey] = {
            id: ab.batterId, name: playerData.name, teamId: playerData.teamId, slot: ab.slot, position: playerData.position,
            ab: 0, r: 0, h: 0, d: 0, t: 0, hr: 0, rbi: 0, bb: 0, k: 0, tb: 0,
            season_ab: 0, season_h: 0, season_bb: 0, season_tb: 0, playedInThisGame: false
          };
        }
        const b = batterStats[bKey];
        if (isCurrent) { 
          b.playedInThisGame = true;
          const rbiVal = ab.rbi > 0 ? ab.rbi : (ab.runsScored || 0); 
          b.rbi += rbiVal; b.r += ab.runsScored || 0; 
        }
        if (isWalk) { b.season_bb++; if (isCurrent) b.bb++; }
        else if (isHit || isOut) {
          b.season_ab++;
          if (isCurrent) { b.ab++; if (res.includes('K')) b.k++; }
          if (isHit) {
            let bases = 1;
            if (res.includes('DOUBLE')) { bases = 2; if (isCurrent) b.d++; }
            else if (res.includes('TRIPLE')) { bases = 3; if (isCurrent) b.t++; }
            else if (isHR) { bases = 4; if (isCurrent) b.hr++; }
            b.season_h++; b.season_tb += bases;
            if (isCurrent) { b.h++; b.tb += bases; }
          }
        }
      }

      const p = pitcherStats[ab.pitcherId];
      if (p) {
        p.season_outs += ab.outs;
        if (isCurrent) {
          p.faced++; p.outs += ab.outs;
          if (isHit) p.h++; if (isWalk) p.bb++; if (res.includes('K')) p.k++; if (isHR) p.hr++;
        }
      }
      
      // Earned Runs logic
      if (ab.runAttribution) {
        ab.runAttribution.split(',').forEach(pid => {
          const rp = pitcherStats[parseInt(pid)];
          if (rp) rp.season_er++;
          if (isCurrent && rp) { rp.r++; rp.er++; }
        });
      } else {
        const rp = pitcherStats[ab.pitcherId];
        if (rp) {
            rp.season_er += ab.runsScored;
            if (isCurrent) { rp.r += ab.runsScored; rp.er += ab.runsScored; }
        }
      }
    });

    const mapRow = (s: any) => ({
      ...s,
      avg: s.season_ab > 0 ? (s.season_h / s.season_ab).toFixed(3).replace(/^0/, '') : '.000',
      ops: (s.season_ab + s.season_bb) === 0 ? '.000' : ((s.season_h + s.season_bb) / (s.season_ab + s.season_bb) + (s.season_tb / s.season_ab)).toFixed(3).replace(/^0/, '')
    });

    return NextResponse.json({
      batters: Object.values(batterStats).filter(b => b.playedInThisGame).map(mapRow).sort((a, b) => a.slot - b.slot),
      pitchers: Object.values(pitcherStats).filter(p => p.faced > 0 || p.r > 0).map(p => ({
        ...p, ip: `${Math.floor(p.outs / 3)}.${p.outs % 3}`,
        era: (p.season_outs > 0 ? (p.season_er * 4) / (p.season_outs / 3) : 0).toFixed(2),
        whip: (p.season_outs > 0 ? (p.season_h + p.season_bb) / (p.season_outs / 3) : 0).toFixed(2)
      })),
      hrEvents
    });
  } catch (error: any) {
    console.error("API CRASHED:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}