import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lastName = searchParams.get('lastName');

  if (!lastName) {
    return NextResponse.json([]);
  }

  try {
    // Search for any player whose name ends with (or contains) the last name
    const matches = await prisma.player.findMany({
      where: {
        name: {
          contains: lastName,
          // Removed the 'mode' line because SQLite handles this natively
        }
      },
      take: 10 // Limit to 10 so the popup doesn't get massive
    });

    return NextResponse.json(matches);
  } catch (error: any) {
    console.error("Global Player Search Error:", error.message);
    return NextResponse.json({ error: "Failed to search players" }, { status: 500 });
  }
}