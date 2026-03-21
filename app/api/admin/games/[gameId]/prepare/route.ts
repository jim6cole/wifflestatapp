import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const gId = parseInt(gameId);

    // 1. Fetch Game with Team details
    const game = await prisma.game.findUnique({
      where: { id: gId },
      include: {
        homeTeam: true,
        awayTeam: true,
      }
    });

    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });

    // 2. Fetch RosterSlots for both teams for this specific season
    const fetchRoster = async (teamId: number) => {
      return await prisma.rosterSlot.findMany({
        where: { 
          teamId, 
          seasonId: game.seasonId ?? 0 // Defaulting to 0 if seasonId is null
        },
        include: { player: true }
      });
    };

    const [homeSlots, awaySlots] = await Promise.all([
      fetchRoster(game.homeTeamId),
      fetchRoster(game.awayTeamId)
    ]);

    return NextResponse.json({
      game,
      homeRoster: homeSlots.map(s => s.player),
      awayRoster: awaySlots.map(s => s.player)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}