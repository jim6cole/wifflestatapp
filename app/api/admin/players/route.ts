import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST: Draft/Create a completely brand new player into the global database
export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Player name is required" }, { status: 400 });
    }

    const newPlayer = await prisma.player.create({
      data: { name }
    });

    return NextResponse.json(newPlayer);
  } catch (error: any) {
    console.error("Create Player Error:", error.message);
    return NextResponse.json({ error: "Failed to create player" }, { status: 500 });
  }
}