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

    // Build dynamic update payload so we only overwrite what is passed from the UI
    const dataToUpdate: any = {};
    if (body.result !== undefined) dataToUpdate.result = body.result;
    if (body.runsScored !== undefined) dataToUpdate.runsScored = parseInt(body.runsScored) || 0;
    if (body.rbi !== undefined) dataToUpdate.rbi = parseInt(body.rbi) || 0;
    if (body.outs !== undefined) dataToUpdate.outs = parseInt(body.outs) || 0;

    // ⚡ CRITICAL FIX: Allow baserunner and attribution data to save for individual stats
    if (body.scorerIds !== undefined) dataToUpdate.scorerIds = body.scorerIds;
    if (body.runAttribution !== undefined) dataToUpdate.runAttribution = body.runAttribution;
    
    // Optional state trackers for accurate Box Score generation
    if (body.runnersOn !== undefined) dataToUpdate.runnersOn = parseInt(body.runnersOn) || 0;
    if (body.outsAtStart !== undefined) dataToUpdate.outsAtStart = parseInt(body.outsAtStart) || 0;
    if (body.runner1Id !== undefined) dataToUpdate.runner1Id = body.runner1Id ? parseInt(body.runner1Id) : null;
    if (body.runner2Id !== undefined) dataToUpdate.runner2Id = body.runner2Id ? parseInt(body.runner2Id) : null;
    if (body.runner3Id !== undefined) dataToUpdate.runner3Id = body.runner3Id ? parseInt(body.runner3Id) : null;

    // 1. Update the individual play
    const updatedPlay = await prisma.atBat.update({
      where: { id: atBatId },
      data: dataToUpdate,
      include: { game: true }
    });

    const gameId = updatedPlay.gameId;

    // 2. Recalculate the master scoreboard using the updated plays
    const homeRuns = await prisma.atBat.aggregate({
      where: { gameId: gameId, isTopInning: false },
      _sum: { runsScored: true }
    });

    const awayRuns = await prisma.atBat.aggregate({
      where: { gameId: gameId, isTopInning: true },
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