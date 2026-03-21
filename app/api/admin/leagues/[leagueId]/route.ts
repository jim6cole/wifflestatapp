import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ leagueId: string }> } // Define as a Promise
) {
  // 1. AWAIT the params here
  const { leagueId } = await params;

  console.log("FETCHING LEAGUE ID:", leagueId);

  try {
    const id = parseInt(leagueId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const league = await prisma.league.findUnique({
      where: { id: id },
      include: {
        seasons: true, // Including these helps the hub show active data
        teams: true,
      }
    });

    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 });
    }

    return NextResponse.json(league);
  } catch (error) {
    console.error("API CRASH:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}