import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  try {
    const { leagueId } = await params;
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