import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    
    if (!user?.isGlobalAdmin && !user?.memberships?.some((m: any) => m.roleLevel >= 2)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const atBatId = parseInt(id);

    if (!prisma) throw new Error("Database not connected.");

    // 1. Update the individual play
    const updatedPlay = await prisma.atBat.update({
      where: { id: atBatId },
      data: {
        result: body.result,
        runsScored: parseInt(body.runsScored) || 0,
      },
      include: { game: true }
    });

    const gameId = updatedPlay.gameId;

    // 2. RE-CALCULATE SCORES USING isTopInning
    // Home Team bats in the BOTTOM of the inning (isTopInning: false)
    const homeRuns = await prisma.atBat.aggregate({
      where: { 
        gameId: gameId, 
        isTopInning: false 
      },
      _sum: { runsScored: true }
    });

    // Away Team bats in the TOP of the inning (isTopInning: true)
    const awayRuns = await prisma.atBat.aggregate({
      where: { 
        gameId: gameId, 
        isTopInning: true 
      },
      _sum: { runsScored: true }
    });

    // 3. Sync the Game Score
    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        homeScore: homeRuns._sum?.runsScored ?? 0,
        awayScore: awayRuns._sum?.runsScored ?? 0
      }
    });

    return NextResponse.json({ updatedPlay, updatedGame });
  } catch (error: any) {
    console.error("DATABASE_ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}