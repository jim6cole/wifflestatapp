import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// MAGIC LINE: Force Next.js to fetch fresh data every single time
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // 1. Basic Authentication Check
    if (!session || !(session.user as any).isApproved) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // 2. Define the filter based on rank
    const leagueFilter = user.role === 3 ? {} : { id: user.leagueId };

    // 3. Prevent non-admins without an assigned league from seeing anything
    if (user.role < 3 && !user.leagueId) {
      return NextResponse.json([]);
    }

    const leagues = await prisma.league.findMany({
      where: leagueFilter,
      include: {
        _count: {
          // REMOVED 'teams: true' because teams belong to Seasons, not Leagues directly
          select: { seasons: true }
        }
      }
    });

    return NextResponse.json(leagues);
  } catch (error) {
    console.error("League Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch leagues" }, { status: 500 });
  }
}