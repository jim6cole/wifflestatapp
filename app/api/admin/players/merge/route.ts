import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  // 1. THE BOUNCER: Check for Hall of Fame (Global Admin) clearance
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.isGlobalAdmin) {
    return NextResponse.json(
      { error: "Roster Consolidation restricted to Hall of Fame Admins only." }, 
      { status: 403 }
    );
  }

  try {
    const { keepId, deleteId } = await request.json();

    // Prevent merging a player into themselves
    if (keepId === deleteId) {
      return NextResponse.json({ error: "Cannot merge a player into themselves." }, { status: 400 });
    }

    // 2. THE CONSOLIDATION: Wrap everything in a transaction
    await prisma.$transaction(async (tx) => {
      
      // Update Roster Slots (Team History)
      await tx.rosterSlot.updateMany({
        where: { playerId: deleteId },
        data: { playerId: keepId }
      });

      // Update Hitting Stats (Batters)
      await tx.atBat.updateMany({
        where: { batterId: deleteId },
        data: { batterId: keepId }
      });

      // Update Pitching Stats (Pitchers)
      await tx.atBat.updateMany({
        where: { pitcherId: deleteId },
        data: { pitcherId: keepId }
      });

      // 3. RETIRE THE JERSEY: Delete the duplicate player record
      await tx.player.delete({
        where: { id: deleteId }
      });
    });

    return NextResponse.json({ success: true, message: "Players consolidated successfully." });

  } catch (error) {
    console.error("Consolidation Error:", error);
    return NextResponse.json(
      { error: "The merge failed. Records might be locked or already removed." }, 
      { status: 500 }
    );
  }
}