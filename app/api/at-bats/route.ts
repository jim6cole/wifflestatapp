import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      gameId, 
      batterId, 
      pitcherId, 
      result, 
      inning, 
      runnersOn,   
      outsAtStart, 
      slot,        
      isTopInning, 
      rbi,         
      runsScored,  
      outs         
    } = body;

    const atBat = await prisma.atBat.create({
      data: {
        gameId: Number(gameId),
        batterId: Number(batterId),
        pitcherId: Number(pitcherId),
        result,
        inning: Number(inning),
        runnersOn: Number(runnersOn || 0),
        outsAtStart: Number(outsAtStart || 0),
        
        // FIXED: Using Number(slot || 0) ensures it is never 'undefined'
        slot: Number(slot || 0), 
        
        isTopInning: Boolean(isTopInning),
        rbi: Number(rbi || 0),
        runsScored: Number(runsScored || 0),
        outs: Number(outs || 0),
      }
    });

    return NextResponse.json(atBat);
  } catch (error: any) {
    console.error("Stat Save Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}