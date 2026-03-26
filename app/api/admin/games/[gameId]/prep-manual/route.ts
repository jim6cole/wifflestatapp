import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request, 
  { params }: { params: Promise<{ gameId: string }> } // Match the folder name
) {
  try {
    const { gameId } = await params;
    const id = parseInt(gameId);

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        season: true
      }
    });

    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

    // Fetch rostered players for this specific season
    const awayRoster = await prisma.rosterSlot.findMany({
      where: { teamId: game.awayTeamId, seasonId: game.seasonId },
      include: { player: true }
    });

    const homeRoster = await prisma.rosterSlot.findMany({
      where: { teamId: game.homeTeamId, seasonId: game.seasonId },
      include: { player: true }
    });

    return NextResponse.json({
      game,
      awayRoster: awayRoster.map(slot => slot.player),
      homeRoster: homeRoster.map(slot => slot.player)
    });
  } catch (error) {
    console.error("Prep Error:", error);
    return NextResponse.json({ error: "Failed to prep scorecard" }, { status: 500 });
  }
}