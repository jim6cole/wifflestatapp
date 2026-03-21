import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request, 
  { params }: { params: Promise<{ gameId: string }> } 
) {
  try {
    const { batterId, pitcherId, result, runsScored, outs, inning, isTopInning } = await req.json();
    const resolvedParams = await params;
    const gameId = parseInt(resolvedParams.gameId);

    const result_data = await prisma.$transaction(async (tx) => {
      // 1. Record the At-Bat for the leaderboards
      const atBat = await tx.atBat.create({
        data: { 
          gameId, 
          batterId, 
          pitcherId, 
          result, 
          runsScored, 
          outs,
          inning,
          isTopInning
        }
      });

      // 2. We skip updating the game score here because our 
      // 'live-state' API handles the master score sync.
      return { atBat };
    });

    return NextResponse.json(result_data);
  } catch (error: any) {
    console.error("At-bat log error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}