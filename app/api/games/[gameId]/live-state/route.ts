import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();

    // ⚡ CLOUD SHIELD: Check who has the baton AND if the game is over
    const game = await prisma.game.findUnique({
        where: { id: parseInt(resolvedParams.gameId) },
        select: { activeScorerId: true, status: true }
    });

    if (game?.status === 'COMPLETED') {
        return NextResponse.json({ error: "Game already completed", activeScorerId: game.activeScorerId }, { status: 403 });
    }

    // If the game is locked by someone else, REJECT the autosave
    if (game?.activeScorerId && game.activeScorerId !== body.clientId) {
        return NextResponse.json({ error: "Lost control", activeScorerId: game.activeScorerId }, { status: 403 });
    }

    await prisma.game.update({
      where: { id: parseInt(resolvedParams.gameId) },
      data: {
        liveState: JSON.stringify(body.state),
        homeScore: body.state.homeScore,
        awayScore: body.state.awayScore
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to cloud save live state:", error);
    return NextResponse.json({ error: "Failed to save state" }, { status: 500 });
  }
}