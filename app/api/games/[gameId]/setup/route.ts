import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  // 1. Swap 'id' for 'gameId' to match the [gameId] folder
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    // 2. Unwrap the new parameter name
    const resolvedParams = await params;
    const gameIdString = resolvedParams.gameId;

    // CONVERT STRING ID TO NUMBER
    const gameId = parseInt(gameIdString, 10);

    // Safety check: If someone enters /api/games/abc, parseInt returns NaN
    if (isNaN(gameId)) {
      return NextResponse.json({ error: "Invalid Game ID format" }, { status: 400 });
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId }, // Now 'id' matches the 'Int' type in Prisma
      include: {
        homeTeam: true,
        awayTeam: true,
        season: true,
      },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json(game);
  } catch (error) {
    console.error("Setup Fetch Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}