import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PATCH: Update game details (Teams, Date, Status)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const { homeTeamId, awayTeamId, scheduledAt, status } = await request.json();

    const updatedGame = await prisma.game.update({
      where: { id: parseInt(gameId) },
      data: {
        homeTeamId: parseInt(homeTeamId),
        awayTeamId: parseInt(awayTeamId),
        scheduledAt: new Date(scheduledAt),
        status: status // Allows you to flip to "COMPLETED" or "CANCELLED"
      },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } }
      }
    });

    return NextResponse.json(updatedGame);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a game entirely
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    await prisma.game.delete({ where: { id: parseInt(gameId) } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}