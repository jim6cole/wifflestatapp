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

    // 1. Double check that the League actually exists in the DB before proceeding
    const leagueExists = await prisma.league.findUnique({
      where: { id: targetLeagueId }
    });

    if (!leagueExists) {
       return NextResponse.json({ error: "Cannot create season: League not found in database." }, { status: 404 });
    }

    // 2. Secure the route: Check if user is a Global Admin OR a Level 2+ Member of THIS specific league
    const isCommish = user?.isGlobalAdmin || user?.memberships?.some(
      (m: any) => m.leagueId === targetLeagueId && m.roleLevel >= 2 && m.isApproved
    );

    if (!session || !isCommish) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // 3. Explicitly parse every number so Prisma doesn't throw a 500 error
    const newSeason = await prisma.season.create({
      data: {
        name: body.name,
        leagueId: targetLeagueId,
        status: body.status || 'UPCOMING',
        
        // Structure Settings
        inningsPerGame: parseInt(body.inningsPerGame),
        isTournament: Boolean(body.isTournament),
        playoffInnings: body.playoffInnings ? parseInt(body.playoffInnings) : parseInt(body.inningsPerGame),
        balls: parseInt(body.balls),
        strikes: parseInt(body.strikes),
        outs: parseInt(body.outs),
        
        // Custom Rules
        isSpeedRestricted: Boolean(body.isSpeedRestricted),
        speedLimit: parseInt(body.speedLimit),
        isBaserunning: Boolean(body.isBaserunning),
        cleanHitRule: Boolean(body.cleanHitRule),
        ghostRunner: Boolean(body.ghostRunner),
        
        // Mercy Settings
        mercyRule: parseInt(body.mercyRule),
        mercyRulePerInning: parseInt(body.mercyRulePerInning),
        mercyRuleInningApply: parseInt(body.mercyRuleInningApply),
        unlimitedLastInning: Boolean(body.unlimitedLastInning),
        
        // DP Logic
        dpWithoutRunners: Boolean(body.dpWithoutRunners),
        dpKeepsRunners: Boolean(body.dpKeepsRunners)
      },
    });
    
    return NextResponse.json(newSeason);
  } catch (error) {
    console.error("Season Creation Error:", error);
    return NextResponse.json({ error: "Could not create season" }, { status: 500 });
  }
}