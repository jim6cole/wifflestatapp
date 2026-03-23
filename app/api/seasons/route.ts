import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    const body = await request.json();

    // Check if user is a Global Admin OR a Level 2+ Member of THIS specific league
    const isCommish = user?.isGlobalAdmin || user?.memberships?.some(
      (m: any) => m.leagueId === parseInt(body.leagueId) && m.roleLevel >= 2 && m.isApproved
    );

    if (!session || !isCommish) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const newSeason = await prisma.season.create({
      data: {
        name: body.name,
        leagueId: body.leagueId,
        status: body.status || 'UPCOMING',
        inningsPerGame: body.inningsPerGame,
        balls: body.balls,
        strikes: body.strikes,
        outs: body.outs,
        isSpeedRestricted: body.isSpeedRestricted,
        speedLimit: body.speedLimit,
        isBaserunning: body.isBaserunning,
        cleanHitRule: body.cleanHitRule,
        ghostRunner: body.ghostRunner,
        mercyRule: body.mercyRule,
        mercyRulePerInning: body.mercyRulePerInning,
        mercyRuleInningApply: body.mercyRuleInningApply,
        unlimitedLastInning: body.unlimitedLastInning,
        dpWithoutRunners: body.dpWithoutRunners,
        dpKeepsRunners: body.dpKeepsRunners
      },
    });
    return NextResponse.json(newSeason);
  } catch (error) {
    console.error("Season Creation Error:", error);
    return NextResponse.json({ error: "Could not create season" }, { status: 500 });
  }
}