import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.isGlobalAdmin) {
    return NextResponse.json({ error: "Roster Consolidation restricted to Hall of Fame Admins only." }, { status: 403 });
  }

  try {
    const { keepId, deleteId } = await request.json();

    if (keepId === deleteId) {
      return NextResponse.json({ error: "Cannot merge a player into themselves." }, { status: 400 });
    }

    // ⚡ FIX: Safely migrate ALL nested legacy stats, lineups, and slots before destroying the duplicate.
    await prisma.$transaction(async (tx) => {
      
      // 1. Move Live AtBats
      await tx.atBat.updateMany({
        where: { batterId: deleteId },
        data: { batterId: keepId }
      });
      await tx.atBat.updateMany({
        where: { pitcherId: deleteId },
        data: { pitcherId: keepId }
      });

      // 2. Move Lineup Appearances (Important for GP calculations)
      await tx.lineupEntry.updateMany({
        where: { playerId: deleteId },
        data: { playerId: keepId }
      });

      // 3. Move Manual Import Overrides (Important for legacy data)
      await tx.manualStatLine.updateMany({
        where: { playerId: deleteId },
        data: { playerId: keepId }
      });

      // 4. Move Historical Raw Stats
      await tx.historicalStat.updateMany({
        where: { playerId: deleteId },
        data: { playerId: keepId }
      });

      // 5. Carefully move Roster Slots (Prevents Unique Constraint crashes)
      const duplicateSlots = await tx.rosterSlot.findMany({
        where: { playerId: deleteId }
      });

      for (const slot of duplicateSlots) {
        const existingSlot = await tx.rosterSlot.findFirst({
          where: { seasonId: slot.seasonId, teamId: slot.teamId, playerId: keepId }
        });

        if (!existingSlot) {
          // If the survivor isn't on the team yet, migrate the slot over
          await tx.rosterSlot.update({
            where: { id: slot.id },
            data: { playerId: keepId }
          });
        } else {
          // If the survivor is already on that team, safely trash the duplicate slot
          await tx.rosterSlot.delete({
            where: { id: slot.id }
          });
        }
      }

      // 6. FINALLY: Delete the duplicate player shell safely
      await tx.player.delete({
        where: { id: deleteId }
      });
    });

    return NextResponse.json({ success: true, message: "Players consolidated successfully." });

  } catch (error) {
    console.error("Consolidation Error:", error);
    return NextResponse.json({ error: "The merge failed. Records might be locked or already removed." }, { status: 500 });
  }
}