import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: Fetch players in THIS league, and attach their teamId IF they are playing this season
export async function GET(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const { seasonId } = await params;
    const sId = parseInt(seasonId);

    const season = await prisma.season.findUnique({ 
      where: { id: sId },
      select: { leagueId: true } 
    });

    if (!season) return NextResponse.json({ error: "Season not found" }, { status: 404 });

    // FIX: Removed the invalid `leagueId` field search. 
    // We now safely fetch players by checking if they have a roster slot in this league.
    const allLeaguePlayers = await prisma.player.findMany({
      where: {
        rosterSlots: { some: { season: { leagueId: season.leagueId } } }
      },
      orderBy: { name: 'asc' }
    });

    const activeSlots = await prisma.rosterSlot.findMany({
      where: { seasonId: sId }
    });

    const mappedPlayers = allLeaguePlayers.map(player => {
      const slot = activeSlots.find(s => s.playerId === player.id);
      return {
        ...player,
        teamId: slot ? slot.teamId : null
      };
    });

    return NextResponse.json(mappedPlayers);
  } catch (error: any) {
    console.error("Fetch Players Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch roster data" }, { status: 500 });
  }
}

// POST: Assign a player to a team (Creates a RosterSlot)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const { seasonId } = await params;
    const sId = parseInt(seasonId);
    const { playerId, teamId } = await request.json();

    if (!playerId || !teamId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await prisma.rosterSlot.deleteMany({
      where: { seasonId: sId, playerId: parseInt(playerId) }
    });

    const newSlot = await prisma.rosterSlot.create({
      data: {
        seasonId: sId,
        playerId: parseInt(playerId),
        teamId: parseInt(teamId)
      }
    });

    return NextResponse.json(newSlot);
  } catch (error: any) {
    console.error("Player Assignment Error:", error.message);
    return NextResponse.json({ error: "Failed to assign player" }, { status: 500 });
  }
}

// DELETE: Remove a player from a team in THIS season (Back to Free Agency)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const { seasonId } = await params;
    const sId = parseInt(seasonId);
    const { playerId } = await request.json();

    if (!playerId) {
      return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
    }

    await prisma.rosterSlot.deleteMany({
      where: { seasonId: sId, playerId: parseInt(playerId) }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Player Unassignment Error:", error.message);
    return NextResponse.json({ error: "Failed to remove player" }, { status: 500 });
  }
}