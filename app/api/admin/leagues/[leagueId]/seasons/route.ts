import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;

  try {
    const seasons = await prisma.season.findMany({
      where: { leagueId: parseInt(leagueId) },
      orderBy: { id: 'desc' },
    });
    return NextResponse.json(seasons);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch seasons" }, { status: 500 });
  }
}

// POST: If you wanted to create a new season, it would go here!