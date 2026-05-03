import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// ⚡ ADDED: GET function to fetch existing override stats
export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const gId = parseInt(gameId);

    if (!prisma) throw new Error("Database not connected.");

    const existingStats = await prisma.manualStatLine.findMany({
      where: { gameId: gId }
    });

    return NextResponse.json(existingStats);
  } catch (error: any) {
    console.error("Fetch Override API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    
    // Authorization check
    if (!user?.isGlobalAdmin && !user?.memberships?.some((m: any) => m.roleLevel >= 2)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { gameId } = await params;
    const body = await request.json();
    
    const { awayStats, homeStats, awayTeamId, homeTeamId } = body;
    const gId = parseInt(gameId);

    if (!awayTeamId || !homeTeamId) {
      return NextResponse.json({ error: "Missing Team IDs" }, { status: 400 });
    }

    if (!prisma) throw new Error("Database not connected.");

    // CALCULATE MASTER SCORES
    const awayTotalRuns = (awayStats || []).reduce((sum: number, player: any) => sum + (parseInt(player.r) || 0), 0);
    const homeTotalRuns = (homeStats || []).reduce((sum: number, player: any) => sum + (parseInt(player.r) || 0), 0);

    // Prepare data
    const awayData = (awayStats || []).map((s: any) => ({ ...s, teamId: parseInt(awayTeamId) }));
    const homeData = (homeStats || []).map((s: any) => ({ ...s, teamId: parseInt(homeTeamId) }));
    const allStats = [...awayData, ...homeData];

    await prisma.$transaction([
      // 1. WIPE OLD OVERRIDE STATS
      prisma.manualStatLine.deleteMany({
        where: {
          gameId: gId,
          teamId: { in: [parseInt(awayTeamId), parseInt(homeTeamId)] }
        },
      }),

      // 2. SAVE NEW OVERRIDE STATS
      prisma.manualStatLine.createMany({
        data: allStats.map((s: any) => ({
          gameId: gId,
          playerId: parseInt(s.playerId),
          teamId: s.teamId,
          position: s.position || 'F',
          gp: 1, 
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
          // ⚡ Accept the exact values passed from the new frontend dropdowns
          winCount: parseInt(s.winCount) || 0,    
          lossCount: parseInt(s.lossCount) || 0,  
          saveCount: parseInt(s.saveCount) || 0,  
        })),
      }),

      // 3. UPDATE SCOREBOARD & FLIP THE OVERRIDE FLAG
      prisma.game.update({
        where: { id: gId },
        data: { 
          status: 'COMPLETED',
          awayScore: awayTotalRuns, 
          homeScore: homeTotalRuns,
          isManualOverride: true // ⚡ This tells the app to ignore the raw play data
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Override Save API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}