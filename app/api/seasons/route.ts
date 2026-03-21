import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role < 2) {
      return NextResponse.json({ error: "Unauthorized Clearance Required" }, { status: 401 });
    }

    const body = await request.json();
    
    const { 
      name, 
      leagueId, 
      inningsPerGame, 
      balls, 
      strikes, 
      outs, 
      isSpeedRestricted, 
      speedLimit,
      isBaserunning, 
      cleanHitRule, 
      ghostRunner, 
      mercyRule,
      mercyRulePerInning,
      mercyRuleInningApply,
      unlimitedLastInning,
      dpWithoutRunners,
      dpKeepsRunners 
    } = body;

    const newSeason = await prisma.season.create({
      data: {
        name,
        leagueId: Number(leagueId),
        inningsPerGame,
        balls,
        strikes,
        outs,
        isSpeedRestricted,
        speedLimit,
        isBaserunning,
        cleanHitRule,
        ghostRunner,
        mercyRule,
        mercyRulePerInning,
        mercyRuleInningApply,
        unlimitedLastInning,
        dpWithoutRunners,
        dpKeepsRunners
      },
    });

    return NextResponse.json(newSeason);
  } catch (error) {
    console.error("Season Initialization Error:", error);
    return NextResponse.json({ error: "Failed to establish season rules." }, { status: 500 });
  }
}