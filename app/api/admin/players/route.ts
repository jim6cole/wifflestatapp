import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST: Draft/Create a brand new player
export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Player name is required" }, { status: 400 });
    }

    // Players are global in the database schema. 
    // They are tied to leagues later when assigned to a RosterSlot.
    const newPlayer = await prisma.player.create({
      data: { 
        name: name.trim()
      }
    });

    return NextResponse.json(newPlayer);
  } catch (error: any) {
    console.error("Create Player Error:", error.message);
    return NextResponse.json({ error: "Failed to create player" }, { status: 500 });
  }
}