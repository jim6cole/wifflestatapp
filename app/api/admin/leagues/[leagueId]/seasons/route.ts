import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;

  try {
    const seasons = await prisma.season.findMany({
      where: { leagueId: parseInt(leagueId) },
      // FIX: Include the teams so the Master Depot can show who is playing where
      include: { 
        teams: {
          select: { id: true, name: true }
        }
      },
      orderBy: { id: 'desc' },
    });
    return NextResponse.json(seasons);
  } catch (error) {
    console.error("League Seasons Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch seasons" }, { status: 500 });
  }
}