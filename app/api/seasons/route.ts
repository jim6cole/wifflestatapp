import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Security: Only Level 2 (Commish) or Level 3 (You) can initialize seasons
    if (!session || (session.user as any).role < 2) {
      return NextResponse.json({ error: "Unauthorized Clearance Required" }, { status: 401 });
    }

    const body = await request.json();
    
    // Destructure all the radical wRC rules from your wizard
    const { 
      name, 
      leagueId, 
      inningsPerGame, 
      balls, 
      strikes, 
      outs, 
      isSpeedRestricted, 
      isBaserunning, 
      cleanHitRule, 
      ghostRunner, 
      mercyRule,
      dpWithoutRunners,
      dpKeepsRunners 
    } = body;

    // Create the Season in Prisma
    const newSeason = await prisma.season.create({
      data: {
        name,
        leagueId: Number(leagueId),
        inningsPerGame,
        balls,
        strikes,
        outs,
        isSpeedRestricted,
        isBaserunning,
        cleanHitRule,
        ghostRunner,
        mercyRule,
        // If your schema doesn't have these specific DP fields yet, 
        // they can be stored in a JSON 'settings' field or added to the model.
        // For now, we'll assume they are in the model based on our wizard logic.
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