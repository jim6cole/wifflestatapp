import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST: Draft/Create a brand new player and attach them to the current league
export async function POST(request: Request) {
  try {
    // Extract both name and leagueId from the incoming request
    const { name, leagueId } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Player name is required" }, { status: 400 });
    }

    const newPlayer = await prisma.player.create({
      data: { 
        name,
        // Tie the player to the league if the ID was provided
        leagueId: leagueId ? Number(leagueId) : null
      }
    });

    return NextResponse.json(newPlayer);
  } catch (error: any) {
    console.error("Create Player Error:", error.message);
    return NextResponse.json({ error: "Failed to create player" }, { status: 500 });
  }
}