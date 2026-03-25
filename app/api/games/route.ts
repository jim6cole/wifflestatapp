import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch game details for the Scorecard OR a list for the Season
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const seasonId = searchParams.get('seasonId');

    // --- SCENARIO 1: Fetch all games for a season (Dashboard) ---
    if (seasonId) {
      const games = await prisma.game.findMany({
        where: { seasonId: parseInt(seasonId) },
        include: {
          homeTeam: { select: { name: true, id: true } },
          awayTeam: { select: { name: true, id: true } },
        },
        orderBy: { scheduledAt: 'asc' }
      });
      return NextResponse.json(games);
    }

    // --- SCENARIO 2: Fetch a single game (Scorecard) ---
    if (gameId) {
      const game = await prisma.game.findUnique({
        where: { id: parseInt(gameId) },
        include: {
          homeTeam: true,
          awayTeam: true,
          season: true,
        }
      });

      if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
      return NextResponse.json(game);
    }

    // If neither is provided, then it's a bad request
    return NextResponse.json({ error: "Missing gameId or seasonId parameter" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update game details (Teams, Date, Status)
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return NextResponse.json({ error: "Missing gameId parameter" }, { status: 400 });
    }

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
        fieldNumber: body.fieldNumber !== undefined ? parseInt(body.fieldNumber) : undefined,
      }
    });

    return NextResponse.json(updatedGame);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a game
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return NextResponse.json({ error: "Missing gameId parameter" }, { status: 400 });
    }

    await prisma.game.delete({ where: { id: parseInt(gameId) } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}