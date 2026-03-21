import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);

  // 1. Basic Authentication Check
  if (!session || !(session.user as any).isApproved) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;

  // 2. Define the filter based on rank
  // Level 3 (Global Admin) sees every league in the system.
  // Level 2/1 (Commish/Staff) only see the specific league they belong to.
  const leagueFilter = user.role === 3 ? {} : { id: user.leagueId };

  // 3. Prevent non-admins without an assigned league from seeing anything
  if (user.role < 3 && !user.leagueId) {
    return NextResponse.json([]);
  }

  const leagues = await prisma.league.findMany({
    where: leagueFilter,
    include: {
      _count: {
        select: { seasons: true, teams: true }
      }
    }
  });

  return NextResponse.json(leagues);
}