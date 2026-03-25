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

    // 1. Fetch the lineup.
    const lineups = await prisma.lineupEntry.findMany({
      where: { gameId: gId },
      include: { player: true }
    });

    const batterStats: Record<string, any> = {};
    const pitcherStats: Record<number, any> = {};
    
    // Create a map to quickly find a player's team, name, and POSITION from the lineup
    const playerLookup: Record<number, { name: string, teamId: number, position: string }> = {};

    lineups.forEach(entry => {
      playerLookup[entry.playerId] = { 
        name: entry.player.name, 
        teamId: entry.teamId,
        position: entry.position // <-- NEW: Grab position
      };

      if (!pitcherStats[entry.playerId]) {
        pitcherStats[entry.playerId] = {
          id: entry.playerId, name: entry.player.name, teamId: entry.teamId,
          outs: 0, k: 0, h: 0, bb: 0, hr: 0, r: 0, er: 0,
          season_outs: 0, season_er: 0, season_h: 0, season_bb: 0, faced: 0
        };
      }
    });

    // 2. Fetch all AtBats
    const seasonAtBats = await prisma.atBat.findMany({
      where: {
        game: { seasonId: currentGame.seasonId, scheduledAt: { lte: currentGame.scheduledAt } }
      }
    });

    seasonAtBats.forEach((ab) => {
      const isCurrent = ab.gameId === gId;
      const res = ab.result?.toUpperCase() || '';
      
      const isHit = ['SINGLE', 'CLEAN_SINGLE', 'DOUBLE', 'CLEAN_DOUBLE', 'GROUND_RULE_DOUBLE', 'TRIPLE', 'HR', '1B', '2B', '3B', '4B'].some(h => res.includes(h));
      const isOut = ['K', 'STRIKEOUT', 'FLY_OUT', 'GROUND_OUT', 'OUT', 'DP', 'DOUBLE PLAY', 'TAG UP', 'SAC FLY'].some(o => res.includes(o));
      const isWalk = res.includes('WALK') || res.includes('BB') || res.includes('HBP');

      // HITTING LOGIC
      const bKey = `${ab.batterId}-${ab.slot}`;
      const playerData = playerLookup[ab.batterId];
      
      if (playerData && (isCurrent || ab.gameId !== gId)) {
        if (!batterStats[bKey]) {
          batterStats[bKey] = {
            id: ab.batterId, 
            name: playerData.name, 
            teamId: playerData.teamId, 
            slot: ab.slot,
            position: playerData.position, // <-- NEW: Pass to frontend
            ab: 0, r: 0, h: 0, d: 0, t: 0, hr: 0, rbi: 0, bb: 0, k: 0, tb: 0,
            season_ab: 0, season_h: 0, season_bb: 0, season_tb: 0, playedInThisGame: false
          };
        }

        const b = batterStats[bKey];
        if (isCurrent) { 
          b.playedInThisGame = true;
          const rbiVal = ab.rbi > 0 ? ab.rbi : (ab.runsScored || 0); // Include RBI fix
          b.rbi += rbiVal; 
          b.r += ab.runsScored || 0; 
        }
        
        if (isWalk) {
          b.season_bb++;
          if (isCurrent) b.bb++;
        } else if (isHit || isOut) {
          b.season_ab++;
          if (isCurrent) {
            b.ab++;
            if (res.includes('K')) b.k++;
          }
          if (isHit) {
            let bases = 1;
            if (res.includes('DOUBLE') || res.includes('2B')) { bases = 2; if (isCurrent) b.d++; }
            else if (res.includes('TRIPLE') || res.includes('3B')) { bases = 3; if (isCurrent) b.t++; }
            else if (res.includes('HR') || res.includes('4B')) { bases = 4; if (isCurrent) b.hr++; }
            b.season_h++;
            b.season_tb += bases;
            if (isCurrent) { b.h++; b.tb += bases; }
          }
        }
      }

      // PITCHING LOGIC
      const p = pitcherStats[ab.pitcherId];
      if (p) {
        p.season_outs += ab.outs;
        p.season_h += isHit ? 1 : 0;
        p.season_bb += isWalk ? 1 : 0;

        if (isCurrent) {
          p.faced++;
          p.outs += ab.outs;
          if (isHit) p.h++;
          if (isWalk) p.bb++;
          if (res.includes('K')) p.k++;
          if (res.includes('HR')) p.hr++;
        }
      }

      // --- RUN ATTRIBUTION ENGINE ---
      if (isCurrent && ab.runAttribution && ab.runsScored > 0) {
         const chargedIds = ab.runAttribution.split(',').map(id => parseInt(id.trim()));
         chargedIds.forEach(pid => {
           const rp = pitcherStats[pid];
           if (rp) { rp.r++; rp.er++; }
         });
      } else if (isCurrent && !ab.runAttribution && ab.runsScored > 0) {
        if (p) { p.r += ab.runsScored; p.er += ab.runsScored; }
      }
      
      // Season ERA calculation tracking
      if (ab.runAttribution) {
        ab.runAttribution.split(',').forEach(pid => {
          const rp = pitcherStats[parseInt(pid)];
          if (rp) rp.season_er++;
        });
      } else {
        const rp = pitcherStats[ab.pitcherId];
        if (rp) rp.season_er += ab.runsScored;
      }
    });

    const mapRow = (s: any) => {
      const avg = s.season_ab > 0 ? (s.season_h / s.season_ab).toFixed(3).replace(/^0/, '') : '.000';
      const obp = (s.season_ab + s.season_bb) > 0 ? (s.season_h + s.season_bb) / (s.season_ab + s.season_bb) : 0;
      const slg = s.season_ab > 0 ? s.season_tb / s.season_ab : 0;
      const ops = (s.season_ab + s.season_bb) === 0 ? '.000' : (obp + slg).toFixed(3).replace(/^0/, '');
      return { ...s, avg, ops };
    };

    const mapPitcher = (p: any) => {
      const seasonIp = p.season_outs / 3;
      const era = seasonIp > 0 ? (p.season_er * 4) / seasonIp : 0;
      const whip = seasonIp > 0 ? (p.season_h + p.season_bb) / seasonIp : 0;
      return {
        ...p,
        ip: `${Math.floor(p.outs / 3)}.${p.outs % 3}`,
        era: era.toFixed(2),
        whip: whip.toFixed(2)
      };
    };

    return NextResponse.json({
      // We map the batting rows to include our rate stats
      batters: Object.values(batterStats).filter(b => b.playedInThisGame).map(mapRow).sort((a, b) => a.slot - b.slot),
      pitchers: Object.values(pitcherStats).filter(p => p.faced > 0 || p.r > 0).map(mapPitcher)
    });
  } catch (error) {
    console.error("Box Score Error:", error);
    return NextResponse.json({ error: "Failed to calculate stats" }, { status: 500 });
  }
}