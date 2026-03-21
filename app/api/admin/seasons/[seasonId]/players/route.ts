import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch ALL global players, and attach their teamId IF they are playing this season
export async function GET(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const resolvedParams = await params;
    const seasonId = parseInt(resolvedParams.seasonId);

    // 1. Get every player in the database
    const allPlayers = await prisma.player.findMany({
      orderBy: { name: 'asc' }
    });

    // 2. Get the roster slots specifically for this season
    const activeSlots = await prisma.rosterSlot.findMany({
      where: { seasonId: seasonId }
    });

    // 3. Map them together for the frontend
    const mappedPlayers = allPlayers.map(player => {
      const slot = activeSlots.find(s => s.playerId === player.id);
      return {
        ...player,
        teamId: slot ? slot.teamId : null // If they have a slot, assign the teamId. Otherwise, they are a Free Agent.
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
    const resolvedParams = await params;
    const seasonId = parseInt(resolvedParams.seasonId);
    const { playerId, teamId } = await request.json();

    if (!playerId || !teamId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. First, remove any existing roster slot for this player in THIS season
    // (This prevents them from being on two teams at once in the same season)
    await prisma.rosterSlot.deleteMany({
      where: { 
        seasonId: seasonId,
        playerId: parseInt(playerId)
      }
    });

    // 2. Create the new RosterSlot (Signing the contract)
    const newSlot = await prisma.rosterSlot.create({
      data: {
        seasonId: seasonId,
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