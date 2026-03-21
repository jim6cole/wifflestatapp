import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string, playerId: string }> }
) {
  const { gameId, playerId } = await params;

  const atBats = await prisma.atBat.findMany({
    where: {
      gameId: parseInt(gameId),
      batterId: parseInt(playerId),
    },
    orderBy: { createdAt: 'asc' }, // Order by when they happened in the game
  });

  return NextResponse.json(atBats);
}