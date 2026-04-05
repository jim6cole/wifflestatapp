import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    const body = await request.json();

    const targetLeagueId = parseInt(body.leagueId);

    if (!targetLeagueId) {
      return NextResponse.json({ error: "Missing League ID." }, { status: 400 });
    }

    // 1. Check League Existence
    const leagueExists = await prisma.league.findUnique({
      where: { id: targetLeagueId }
    });

    if (!leagueExists) {
       return NextResponse.json({ error: "League ID not found. Did you delete the league during reset?" }, { status: 404 });
    }

    // 2. Security Check
    const isCommish = user?.isGlobalAdmin || user?.memberships?.some(
      (m: any) => m.leagueId === targetLeagueId && m.roleLevel >= 2 && m.isApproved
    );

    if (!session || !isCommish) {
      return NextResponse.json({ error: "You do not have Commissioner permissions for this league." }, { status: 401 });
    }
    
    // 3. Create Season/Tournament
    const newSeason = await prisma.season.create({
      data: {
        name: body.name,
        year: parseInt(body.year) || new Date().getFullYear(), // ADDED: Championship Year
        leagueId: targetLeagueId,
        status: body.status || 'UPCOMING',
        
        // Structure Settings
        inningsPerGame: parseInt(body.inningsPerGame) || 4,
        isTournament: Boolean(body.isTournament),
        playoffInnings: body.playoffInnings ? parseInt(body.playoffInnings) : (parseInt(body.inningsPerGame) || 5),
        balls: parseInt(body.balls) || 4,
        strikes: parseInt(body.strikes) || 3,
        outs: parseInt(body.outs) || 3,
        
        // Custom Rules
        isSpeedRestricted: Boolean(body.isSpeedRestricted),
        speedLimit: parseInt(body.speedLimit) || 60,
        isBaserunning: Boolean(body.isBaserunning),
        cleanHitRule: Boolean(body.cleanHitRule),
        ghostRunner: Boolean(body.ghostRunner),
        
        // Mercy Settings
        mercyRule: parseInt(body.mercyRule) ?? 10,
        mercyRulePerInning: parseInt(body.mercyRulePerInning) ?? 0,
        mercyRuleInningApply: parseInt(body.mercyRuleInningApply) ?? 3,
        unlimitedLastInning: Boolean(body.unlimitedLastInning),
        
        // DP & Pitcher Logic
        dpWithoutRunners: Boolean(body.dpWithoutRunners),
        dpKeepsRunners: Boolean(body.dpKeepsRunners),
        allowPitcherReentry: body.allowPitcherReentry !== undefined ? Boolean(body.allowPitcherReentry) : true,
        
        // --- NEW LINEUP LOGIC ---
        maxDh: body.maxDh !== undefined ? parseInt(body.maxDh) : 1,
        minBatters: body.minBatters !== undefined ? parseInt(body.minBatters) : 0
      },
    });
    
    return NextResponse.json(newSeason);
  } catch (error: any) {
    console.error("Season Creation Error:", error);
    return NextResponse.json({ error: error.message || "Could not create season" }, { status: 500 });
  }
}