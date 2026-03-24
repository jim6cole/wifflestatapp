import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request, 
  { params }: { params: Promise<{ gameId: string }> } 
) {
  try {
    const body = await req.json();
    const resolvedParams = await params;
    
    const gameId = parseInt(resolvedParams.gameId);
    const batterId = parseInt(body.batterId);
    const pitcherId = parseInt(body.pitcherId);
    const runsScored = parseInt(body.runsScored) || 0;
    const outs = parseInt(body.outs) || 0;
    const inning = parseInt(body.inning) || 1;
    const isTopInning = Boolean(body.isTopInning);
    const result = body.result ? String(body.result) : null;
    
    // Pitchers responsible for each run (for ERA accuracy)
    const runAttribution = body.runAttribution ? String(body.runAttribution) : null;

    // NEW: The batting order position (1-9) for this at-bat
    // This is required to group pinch hitters in the same box score row
    const slot = parseInt(body.slot) || 1;

    const result_data = await prisma.$transaction(async (tx) => {
      const atBat = await tx.atBat.create({
        data: { 
          gameId, 
          batterId, 
          pitcherId, 
          slot, // ADDED THIS FIELD
          result, 
          runsScored, 
          runAttribution,
          outs,
          inning,
          isTopInning
        }
      });

      return { atBat };
    });

    return NextResponse.json(result_data);
  } catch (error: any) {
    console.error("At-bat log error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}