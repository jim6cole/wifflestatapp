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

// PATCH: Update game details (Supports partial updates for Pitching Changes)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const body = await request.json();

    // Build the update object dynamically so we only change what is sent
    const updateData: any = {};
    
    if (body.homeTeamId) updateData.homeTeamId = parseInt(body.homeTeamId);
    if (body.awayTeamId) updateData.awayTeamId = parseInt(body.awayTeamId);
    if (body.scheduledAt) updateData.scheduledAt = new Date(body.scheduledAt);
    if (body.status) updateData.status = body.status;
    if (body.homeScore !== undefined) updateData.homeScore = parseInt(body.homeScore);
    if (body.awayScore !== undefined) updateData.awayScore = parseInt(body.awayScore);
    
    // NEW: Handle Pitching Changes
    if (body.currentHomePitcherId) updateData.currentHomePitcherId = parseInt(body.currentHomePitcherId);
    if (body.currentAwayPitcherId) updateData.currentAwayPitcherId = parseInt(body.currentAwayPitcherId);

    const updatedGame = await prisma.game.update({
      where: { id: parseInt(gameId) },
      data: updateData,
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } }
      }
    });

    return NextResponse.json(updatedGame);
  } catch (error: any) {
    console.error("PATCH Game Error:", error);
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