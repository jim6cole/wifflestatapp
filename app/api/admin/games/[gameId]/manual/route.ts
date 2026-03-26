import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const body = await request.json();
    
    const { awayStats, homeStats, awayTeamId, homeTeamId } = body;
    const gId = parseInt(gameId);

    if (!awayTeamId || !homeTeamId) {
      return NextResponse.json({ error: "Missing Team IDs" }, { status: 400 });
    }

    // CALCULATE MASTER SCORES
    const awayTotalRuns = (awayStats || []).reduce((sum: number, player: any) => sum + (parseInt(player.r) || 0), 0);
    const homeTotalRuns = (homeStats || []).reduce((sum: number, player: any) => sum + (parseInt(player.r) || 0), 0);

    // Prepare data
    const awayData = (awayStats || []).map((s: any) => ({ 
      ...s, 
      teamId: parseInt(awayTeamId) 
    }));
    const homeData = (homeStats || []).map((s: any) => ({ 
      ...s, 
      teamId: parseInt(homeTeamId) 
    }));
    const allStats = [...awayData, ...homeData];

    await prisma.$transaction([
      // WIPE OLD STATS
      prisma.manualStatLine.deleteMany({
        where: {
          gameId: gId,
          teamId: { in: [parseInt(awayTeamId), parseInt(homeTeamId)] }
        },
      }),

      // SAVE NEW STATS
      prisma.manualStatLine.createMany({
        data: allStats.map((s: any) => ({
          gameId: gId,
          playerId: parseInt(s.playerId),
          teamId: s.teamId,
          position: s.position || 'F',
          pa: (parseInt(s.ab) || 0) + (parseInt(s.bb) || 0),
          ab: parseInt(s.ab) || 0,
          h: parseInt(s.h) || 0,
          d2b: parseInt(s.d2b) || 0,
          d3b: parseInt(s.d3b) || 0,
          hr: parseInt(s.hr) || 0,
          rbi: parseInt(s.rbi) || 0,
          r: parseInt(s.r) || 0,
          bb: parseInt(s.bb) || 0,
          k: parseInt(s.k) || 0,
          ip: parseFloat(s.ip) || 0,
          ph: parseInt(s.ph) || 0,
          pr: parseInt(s.pr) || 0,
          per: parseInt(s.per) || 0,
          pbb: parseInt(s.pbb) || 0,
          pk: parseInt(s.pk) || 0,
          phr: parseInt(s.phr) || 0,
          win: Boolean(s.win),
          loss: Boolean(s.loss),
          save: Boolean(s.save),
        })),
      }),

      // UPDATE MASTER SCOREBOARD
      prisma.game.update({
        where: { id: gId },
        data: { 
          status: 'COMPLETED',
          awayScore: awayTotalRuns, // NEW: Injecting the summed scores
          homeScore: homeTotalRuns  // NEW: Injecting the summed scores
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Manual Save API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}