import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch game details for the Scorecard
export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const game = await prisma.game.findUnique({
      where: { id: parseInt(gameId) },
      include: {
        homeTeam: true,
        awayTeam: true,
        season: true,
      }
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json(game);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update game details (Teams, Date, Status)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const body = await request.json();

    const updatedGame = await prisma.game.update({
      where: { id: parseInt(gameId) },
      data: {
        homeTeamId: body.homeTeamId ? parseInt(body.homeTeamId) : undefined,
        awayTeamId: body.awayTeamId ? parseInt(body.awayTeamId) : undefined,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        status: body.status,
        homeScore: body.homeScore !== undefined ? parseInt(body.homeScore) : undefined,
        awayScore: body.awayScore !== undefined ? parseInt(body.awayScore) : undefined,
      }
    });

    return NextResponse.json(updatedGame);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a game
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