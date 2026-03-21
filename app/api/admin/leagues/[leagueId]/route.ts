import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// 1. ARCHIVE / UNARCHIVE (Toggle isActive)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role < 3) {
    return NextResponse.json({ error: "L3 Authorization Required" }, { status: 403 });
  }

  const { leagueId } = await params;
  const { isActive } = await request.json();

  try {
    const updated = await prisma.league.update({
      where: { id: parseInt(leagueId) },
      data: { isActive },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// 2. PERMANENT ERASE (Manual Bottom-Up Sweep)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role < 3) {
    return NextResponse.json({ error: "L3 Authorization Required" }, { status: 403 });
  }

  const id = parseInt((await params).leagueId);

  try {
    // A single Prisma Transaction guarantees that if one delete fails, none of them happen
    await prisma.$transaction(async (tx) => {
      
      // 1. Unlink Users so they aren't deleted, just removed from the league
      await tx.user.updateMany({
        where: { leagueId: id },
        data: { leagueId: null }
      });

      // 2. Identify all Teams and Seasons tied to this league
      const teams = await tx.team.findMany({ where: { leagueId: id } });
      const teamIds = teams.map(t => t.id);

      const seasons = await tx.season.findMany({ where: { leagueId: id } });
      const seasonIds = seasons.map(s => s.id);

      // 3. Identify all Games tied to those Teams or Seasons
      const games = await tx.game.findMany({
        where: {
          OR: [
            { homeTeamId: { in: teamIds } },
            { awayTeamId: { in: teamIds } },
            { seasonId: { in: seasonIds } }
          ]
        }
      });
      const gameIds = games.map(g => g.id);

      // 4. DESTROY FROM THE BOTTOM UP
      
      // Erase At-Bats & Lineups (Tied to Games/Teams)
      await tx.atBat.deleteMany({ where: { gameId: { in: gameIds } } });
      await tx.lineupEntry.deleteMany({ where: { gameId: { in: gameIds } } });
      
      // Erase Roster Connections (Tied to Teams/Seasons)
      await tx.rosterSlot.deleteMany({ where: { teamId: { in: teamIds } } });
      
      // Erase Games
      await tx.game.deleteMany({ where: { id: { in: gameIds } } });

      // Erase Teams and Seasons
      await tx.team.deleteMany({ where: { leagueId: id } });
      await tx.season.deleteMany({ where: { leagueId: id } });

      // 5. Finally, Erase the League itself
      await tx.league.delete({ where: { id } });

    });

    return NextResponse.json({ success: true, message: "League completely purged." });
  } catch (error) {
    console.error("Purge Error:", error);
    return NextResponse.json({ error: "Failed to erase league record." }, { status: 500 });
  }
}