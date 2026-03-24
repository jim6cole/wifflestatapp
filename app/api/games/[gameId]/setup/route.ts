import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const resolvedParams = await params;
    const gameIdString = resolvedParams.gameId;
    
    const gameId = parseInt(gameIdString, 10);

    if (isNaN(gameId)) {
      return NextResponse.json({ error: "Invalid Game ID format" }, { status: 400 });
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        homeTeam: true,
        awayTeam: true,
        season: true,
        lineups: {
          orderBy: { battingOrder: 'asc' },
          include: { player: true }
        }
      }
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // --- PRE-GAME STATS CALCULATION ---
    const playerIds = game.lineups.map(l => l.playerId);

    // Get all at-bats for these players in THIS season, EXCEPT for the current game
    const preGameAtBats = await prisma.atBat.findMany({
      where: {
        batterId: { in: playerIds },
        game: { seasonId: game.seasonId },
        gameId: { not: gameId } // Exclude this game so we don't double count!
      }
    });

    const playerStats: Record<number, { ab: number, h: number }> = {};
    playerIds.forEach(id => playerStats[id] = { ab: 0, h: 0 });

    preGameAtBats.forEach(ab => {
      const res = ab.result?.toUpperCase() || '';
      // Highly resilient hit/out catchers to match all your custom play types
      const isHit = ['SINGLE', 'DOUBLE', 'TRIPLE', 'HR', '1B', '2B', '3B'].some(h => res.includes(h));
      const isOut = ['K', 'OUT', 'DP', 'DOUBLE PLAY', 'TAG UP'].some(o => res.includes(o));
      
      if (isHit || isOut) playerStats[ab.batterId].ab++;
      if (isHit) playerStats[ab.batterId].h++;
    });

    return NextResponse.json({
      ...game,
      preGameStats: playerStats
    });
  } catch (error) {
    console.error("Setup Fetch Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}