import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Note: No { params } here because the folder path is static!
export async function GET(request: NextRequest) {
  try {
    // We get the ID from the URL: /api/public/leagues/seasons?leagueId=X
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('leagueId');

    if (!leagueId) {
      return NextResponse.json({ error: "Missing leagueId query parameter" }, { status: 400 });
    }

    const lId = parseInt(leagueId);

    if (isNaN(lId)) {
      return NextResponse.json({ error: "Invalid League ID" }, { status: 400 });
    }

    const seasons = await prisma.season.findMany({
      where: { leagueId: lId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        isTournament: true,
        createdAt: true
      }
    });

    return NextResponse.json(seasons);
  } catch (error) {
    console.error("Public Seasons API Error:", error);
    return NextResponse.json({ error: "Failed to fetch seasons" }, { status: 500 });
  }
}