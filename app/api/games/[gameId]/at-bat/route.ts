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
    
    // NEW: Capture the runs as RBIs
    const rbi = parseInt(body.runsScored) || 0; 
    
    const outs = parseInt(body.outs) || 0;
    const inning = parseInt(body.inning) || 1;
    const isTopInning = Boolean(body.isTopInning);
    const result = body.result ? String(body.result) : null;
    
    const runAttribution = body.runAttribution ? String(body.runAttribution) : null;
    
    // ⚡ CRITICAL FIX: Extract baserunner data from the live scorekeeper
    const scorerIds = body.scorerIds ? String(body.scorerIds) : null;
    const runnersOn = parseInt(body.runnersOn) || 0;
    const outsAtStart = parseInt(body.outsAtStart) || 0;

    const slot = parseInt(body.slot) || 1;

    const result_data = await prisma.$transaction(async (tx) => {
      const atBat = await tx.atBat.create({
        data: {
           gameId,
           batterId,
           pitcherId,
           slot,
           result,
           runsScored,
           rbi,
           runAttribution,
           scorerIds,    // <-- NOW OFFICIALLY SAVED
           runnersOn,    // <-- NOW OFFICIALLY SAVED
           outsAtStart,  // <-- NOW OFFICIALLY SAVED
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