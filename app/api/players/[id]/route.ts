import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * DELETE /api/players/[id]
 * Deletes a specific player by their ID.
 */
export async function DELETE(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. In Next.js 15, params is a Promise that must be awaited
    const { id } = await params;

    // 2. Convert the ID to a number for Prisma
    const playerId = Number(id);

    if (isNaN(playerId)) {
      return NextResponse.json({ error: "Invalid Player ID" }, { status: 400 });
    }

    // 3. Perform the deletion
    await prisma.player.delete({
      where: { id: playerId },
    });

    return NextResponse.json({ message: "Player deleted successfully" });
  } catch (error: any) {
    console.error("DELETE PLAYER ERROR:", error.message);
    
    // Check if the error is because the player doesn't exist
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/players/[id]
 * (Optional) Helpful for testing if the player exists before deleting
 */
export async function GET(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const player = await prisma.player.findUnique({
      where: { id: Number(id) },
      include: { team: true }
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    return NextResponse.json(player);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}