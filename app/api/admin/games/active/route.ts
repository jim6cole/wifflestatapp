import { NextRequest, NextResponse } from 'next/server'; // Added NextRequest
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = session.user as any;
    
    // --- NEW: Parse leagueId from the URL ---
    const { searchParams } = new URL(request.url);
    const filterLeagueId = searchParams.get('leagueId');
    
    const whereClause: any = {
      status: { in: ["UPCOMING", "SCHEDULED", "LIVE", "IN_PROGRESS"] }
    };

    // If a specific leagueId was passed, we target it
    if (filterLeagueId) {
      whereClause.season = { leagueId: parseInt(filterLeagueId) };
    }

    // Security check for Commissioners
    if (!user.isGlobalAdmin) {
      const commishLeagueIds = user.memberships
        ?.filter((m: any) => m.roleLevel >= 2 && m.isApproved)
        .map((m: any) => m.leagueId) || [];
        
      if (commishLeagueIds.length === 0) return NextResponse.json([]); 
      
      // If filtering for a specific league, make sure they actually have access to it
      if (filterLeagueId) {
        if (!commishLeagueIds.includes(parseInt(filterLeagueId))) {
          return NextResponse.json({ error: "Access Denied to this League" }, { status: 403 });
        }
      } else {
        // Otherwise, just show all their leagues
        whereClause.season = { leagueId: { in: commishLeagueIds } };
      }
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
            league: { select: { name: true } } 
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