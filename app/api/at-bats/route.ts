import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gameId, batterId, pitcherId, result, inning, teamId } = body;

    const atBat = await prisma.atBat.create({
      data: {
        gameId: Number(gameId),
        batterId: Number(batterId),
        pitcherId: Number(pitcherId),
        result,
        inning: Number(inning),
        // Calculate RBIs or other logic here if needed
      }
    });

    return NextResponse.json(atBat);
  } catch (error: any) {
    console.error("Stat Save Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}