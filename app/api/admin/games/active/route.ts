import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as any;
    
    const whereClause: any = {
      status: { in: ["UPCOMING", "SCHEDULED", "LIVE", "IN_PROGRESS"] }
    };

    // If the user is NOT a Global Admin, filter games to only their Commissioner leagues
    if (!user.isGlobalAdmin) {
      const commishLeagueIds = user.memberships
        ?.filter((m: any) => m.roleLevel >= 2 && m.isApproved)
        .map((m: any) => m.leagueId) || [];
        
      if (commishLeagueIds.length === 0) return NextResponse.json([]); // No access = No games
      
      whereClause.season = { leagueId: { in: commishLeagueIds } };
    }

    const games = await prisma.game.findMany({
      where: whereClause,
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
        season: { 
          select: { 
            name: true, 
            id: true, 
            leagueId: true,
            league: { select: { name: true } } // Bring the league name in for the UI filters
          } 
        }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    return NextResponse.json(games);
  } catch (error: any) {
    console.error("Active Games Fetch Error:", error.message);
    return NextResponse.json({ error: "Failed to load active games" }, { status: 500 });
  }
}