import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  try {
    const { leagueId } = await params;
    
    // Find all unique locations ever entered for games in this league
    const games = await prisma.game.findMany({
      where: {
        season: { leagueId: parseInt(leagueId) },
        // ⚡ FIX: Use a NOT array to filter out both nulls and empty strings
        NOT: [
          { location: null },
          { location: '' }
        ]
      },
      select: { location: true },
      distinct: ['location']
    });

    // Extract the names and sort them alphabetically
    const fields = games
        .map(g => g.location)
        .filter(Boolean)
        .sort();

    return NextResponse.json(fields);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}