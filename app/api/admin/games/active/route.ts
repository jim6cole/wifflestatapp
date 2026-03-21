import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as any;

    // Logic: L3 sees all. L2 sees only games where the season belongs to their league.
    const whereClause: any = {
      status: { in: ["UPCOMING", "SCHEDULED", "LIVE", "IN_PROGRESS"] }
    };

    if (user.role < 3) {
      if (!user.leagueId) return NextResponse.json([]); // No league, no games.
      whereClause.season = { leagueId: user.leagueId };
    }

    const games = await prisma.game.findMany({
      where: whereClause,
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
        season: { select: { name: true, id: true, leagueId: true } }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    return NextResponse.json(games);
  } catch (error: any) {
    console.error("Active Games Fetch Error:", error.message);
    return NextResponse.json({ error: "Failed to load active games" }, { status: 500 });
  }
}