import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Secure permission check for League Modifiers
async function isCommishOrRoot(leagueId: number) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user) return false;
  if (user.isGlobalAdmin) return true;
  return user.memberships?.some(
    (m: any) => m.leagueId === leagueId && m.roleLevel >= 2 && m.isApproved
  );
}

// 1. GET LEAGUE DETAILS
export async function GET(request: Request, { params }: { params: Promise<{ leagueId: string }> }) {
  const id = parseInt((await params).leagueId);
  try {
    const league = await prisma.league.findUnique({ where: { id } });
    return NextResponse.json(league);
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

// 2. ARCHIVE / UNARCHIVE (Toggle isActive)
export async function PATCH(request: Request, { params }: { params: Promise<{ leagueId: string }> }) {
  const id = parseInt((await params).leagueId);
  
  if (!(await isCommishOrRoot(id))) {
    return NextResponse.json({ error: "L2 Commish or Root Authorization Required" }, { status: 403 });
  }

  const { isActive } = await request.json();

  try {
    const updated = await prisma.league.update({
      where: { id },
      data: { isActive },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// 3. PERMANENT ERASE (Manual Bottom-Up Sweep)
export async function DELETE(request: Request, { params }: { params: Promise<{ leagueId: string }> }) {
  const id = parseInt((await params).leagueId);
  
  if (!(await isCommishOrRoot(id))) {
    return NextResponse.json({ error: "L2 Commish or Root Authorization Required" }, { status: 403 });
  }

  try {
    // A single Prisma Transaction guarantees that if one delete fails, none of them happen
    await prisma.$transaction(async (tx) => {
      
      // Identify downstream relations
      const seasons = await tx.season.findMany({ where: { leagueId: id } });
      const seasonIds = seasons.map(s => s.id);

      const teams = await tx.team.findMany({ where: { seasonId: { in: seasonIds } } });
      const teamIds = teams.map(t => t.id);

      const games = await tx.game.findMany({ where: { seasonId: { in: seasonIds } } });
      const gameIds = games.map(g => g.id);

      // DESTROY FROM THE BOTTOM UP
      await tx.atBat.deleteMany({ where: { gameId: { in: gameIds } } });
      await tx.lineupEntry.deleteMany({ where: { gameId: { in: gameIds } } });
      await tx.inningScore.deleteMany({ where: { gameId: { in: gameIds } } });
      await tx.game.deleteMany({ where: { id: { in: gameIds } } });
      
      await tx.rosterSlot.deleteMany({ where: { teamId: { in: teamIds } } });
      await tx.team.deleteMany({ where: { id: { in: teamIds } } });

      await tx.season.deleteMany({ where: { leagueId: id } });
      
      // Erase memberships instead of mutating User
      await tx.leagueMembership.deleteMany({ where: { leagueId: id } });

      // Finally, Erase the League itself
      await tx.league.delete({ where: { id } });
    });

    return NextResponse.json({ success: true, message: "League completely purged." });
  } catch (error) {
    console.error("Purge Error:", error);
    return NextResponse.json({ error: "Failed to erase league record." }, { status: 500 });
  }
}