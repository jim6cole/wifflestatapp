import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request, 
  { params }: { params: Promise<{ gameId: string }> } 
) {
  try {
    // 1. Grab the raw body object
    const body = await req.json();
    const resolvedParams = await params;
    
    // 2. Explicitly cast ALL variables to satisfy TypeScript and Prisma
    const gameId = parseInt(resolvedParams.gameId);
    const batterId = parseInt(body.batterId);
    const pitcherId = parseInt(body.pitcherId);
    const runsScored = parseInt(body.runsScored) || 0;
    const outs = parseInt(body.outs) || 0;
    const inning = parseInt(body.inning) || 1;
    const isTopInning = Boolean(body.isTopInning);
    const result = body.result ? String(body.result) : null;

    const result_data = await prisma.$transaction(async (tx) => {
      // 3. Record the At-Bat with strongly-typed data
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

      // We skip updating the game score here because our 
      // 'live-state' API handles the master score sync.
      return { atBat };
    });

    return NextResponse.json(result_data);
  } catch (error: any) {
    console.error("At-bat log error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}