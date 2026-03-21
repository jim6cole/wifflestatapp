import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request, 
  // 1. Update the type to expect gameId and be a Promise
  { params }: { params: Promise<{ gameId: string }> } 
) {
  const { batterId, pitcherId, result, runsScored, outs } = await req.json();
  
  // 2. Await the params to be Next.js 15 compliant
  const resolvedParams = await params;
  const gameId = parseInt(resolvedParams.gameId);

  try {
    const result_data = await prisma.$transaction(async (tx) => {
      // 1. Record the At-Bat
      const atBat = await tx.atBat.create({
        data: { gameId, batterId, pitcherId, result, runsScored, outs }
      });

      // 2. Update the Game Score and Outs
      const game = await tx.game.update({
        where: { id: gameId },
        data: {
          homeScore: { increment: runsScored > 0 ? runsScored : 0 }, // Simplified logic
          // You can add logic here to swap innings if outs == 3
        }
      });

      return { atBat, game };
    });

    return NextResponse.json(result_data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}