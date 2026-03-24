import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const newPlayer = await prisma.player.create({
      data: {
        name: body.name.trim(),
        // Save the origin league so they stay in your Free Agent pool permanently!
        leagueId: body.leagueId ? parseInt(body.leagueId) : null 
      }
    });

    return NextResponse.json(newPlayer);
  } catch (error) {
    console.error("Player Creation Error:", error);
    return NextResponse.json({ error: "Failed to create player" }, { status: 500 });
  }
}