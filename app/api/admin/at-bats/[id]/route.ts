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

    // We must fetch the current play first to determine run counts for the auto-stamping
    const currentPlay = await prisma.atBat.findUnique({ where: { id: atBatId } });
    if (!currentPlay) return NextResponse.json({ error: "Play not found" }, { status: 404 });

    // ⚡ NEW: PROPAGATION LOGIC
    if (body.updateFuture) {
      await prisma.atBat.updateMany({
        where: {
          gameId: currentPlay.gameId,
          createdAt: { gte: currentPlay.createdAt },
          isTopInning: currentPlay.isTopInning // Ensures we only update the correct side
        },
        data: {
          ...(body.pitcherId && { 
            pitcherId: parseInt(body.pitcherId),
            runAttribution: null // Clear this so Box Score defaults to the new pitcherId
          }),
          ...(body.batterId && { batterId: parseInt(body.batterId) })
        }
      });
    }

    const dataToUpdate: any = {};
    
    // ⚡ PITCHER AND EARNED RUN AUTO-STAMP LOGIC
    if (body.pitcherId !== undefined) {
      const newPid = parseInt(body.pitcherId);
      dataToUpdate.pitcherId = newPid;

      // If runs scored > 0 and the user didn't explicitly override the attribution, auto-stamp it.
      const runCount = body.runsScored !== undefined ? parseInt(body.runsScored) : currentPlay.runsScored;
      if (runCount > 0 && !body.runAttribution) {
        dataToUpdate.runAttribution = Array(runCount).fill(newPid).join(',');
      }
    }

    // ⚡ RUN COUNTS & RESULT
    if (body.result !== undefined) dataToUpdate.result = body.result;
    
    if (body.runsScored !== undefined) {
      const newRunCount = parseInt(body.runsScored) || 0;
      dataToUpdate.runsScored = newRunCount;
      
      // If we change the run count, but didn't change the pitcher or explicitly set the string,
      // rebuild the attribution string so it matches the new run amount.
      if (!body.runAttribution && !dataToUpdate.runAttribution && newRunCount > 0) {
        dataToUpdate.runAttribution = Array(newRunCount).fill(dataToUpdate.pitcherId || currentPlay.pitcherId).join(',');
      } else if (!body.runAttribution && newRunCount === 0) {
         dataToUpdate.runAttribution = null; // Clear it if runs are removed
      }
    }

    if (body.rbi !== undefined) dataToUpdate.rbi = parseInt(body.rbi) || 0;
    if (body.outs !== undefined) dataToUpdate.outs = parseInt(body.outs) || 0;

    // ⚡ BATTER CHANGE
    if (body.batterId !== undefined) dataToUpdate.batterId = parseInt(body.batterId);

    // ⚡ MANUAL OVERRIDES (Inherited runners, baserunners)
    // If the commish explicitly typed in a new string, it overrides all the auto-stamping above
    if (body.runAttribution !== undefined) dataToUpdate.runAttribution = body.runAttribution;
    if (body.scorerIds !== undefined) dataToUpdate.scorerIds = body.scorerIds;
    
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
    // 3. Sync the Game Score
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