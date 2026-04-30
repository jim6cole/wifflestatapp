import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const gameIdNum = parseInt(resolvedParams.gameId);

    // ⚡ FIX: Pre-check if the game is already over
    const game = await prisma.game.findUnique({
        where: { id: gameIdNum },
        select: { status: true }
    });

    if (game?.status === 'COMPLETED') {
        return NextResponse.json({ error: "Game is already completed" }, { status: 400 });
    }

    // Pass the baton to the new client ID
    await prisma.game.update({
      where: { id: gameIdNum },
      data: { activeScorerId: body.clientId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to pass baton:", error);
    return NextResponse.json({ error: "Failed to transfer control" }, { status: 500 });
  }
}