import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      gameId, batterId, pitcherId, result, runsScored, outs, inning, 
      isTopInning, slot, runAttribution, runner1Id, runner2Id, runner3Id, scorerIds 
    } = body;

    const atBat = await prisma.atBat.create({
      data: {
        gameId: parseInt(gameId),
        batterId: parseInt(batterId),
        pitcherId: parseInt(pitcherId),
        result,
        runsScored: parseInt(runsScored) || 0,
        outs: parseInt(outs) || 0,
        inning: parseInt(inning),
        isTopInning: Boolean(isTopInning),
        slot: parseInt(slot) || 0,
        runAttribution: runAttribution || null,
        // NEW SNAPSHOT FIELDS
        runner1Id: runner1Id ? parseInt(runner1Id) : null,
        runner2Id: runner2Id ? parseInt(runner2Id) : null,
        runner3Id: runner3Id ? parseInt(runner3Id) : null,
        scorerIds: scorerIds || null,
      }
    });

    return NextResponse.json(atBat);
  } catch (error: any) {
    console.error("AtBat Save Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}