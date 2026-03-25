import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request, 
  { params }: { params: Promise<{ gameId: string }> } 
) {
  try {
    const resolvedParams = await params;
    const gameId = parseInt(resolvedParams.gameId);

    if (isNaN(gameId)) {
      return NextResponse.json({ error: "Invalid Game ID" }, { status: 400 });
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
        atBats: {
          include: {
            batter: { select: { id: true, name: true } },
            pitcher: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json(game);
  } catch (error: any) {
    console.error("DATABASE_ERROR:", error.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}