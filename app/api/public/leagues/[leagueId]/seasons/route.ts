import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  try {
    // 1. Await the params to extract the dynamic ID
    const { leagueId } = await params;
    const lId = parseInt(leagueId);

    // 2. Validate the ID
    if (isNaN(lId)) {
      return NextResponse.json({ error: "Invalid League ID" }, { status: 400 });
    }

    // 3. Query the database
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