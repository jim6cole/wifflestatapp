import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

    // FIX: Pull players who originated in this league OR have played in this league before
    const allLeaguePlayers = await prisma.player.findMany({
      where: {
        OR: [
          { leagueId: season.leagueId },
          { rosterSlots: { some: { season: { leagueId: season.leagueId } } } }
        ]
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
        teamId: slot ? slot.teamId : null // Maps to null (Free Agent) if not on an active team
      };
    });

    return NextResponse.json(mappedPlayers);
  } catch (error: any) {
    console.error("Fetch Players Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch roster data" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const { seasonId } = await params;
    const { playerId, teamId } = await request.json();

    await prisma.rosterSlot.deleteMany({
      where: { seasonId: parseInt(seasonId), playerId: parseInt(playerId) }
    });

    const newSlot = await prisma.rosterSlot.create({
      data: {
        seasonId: parseInt(seasonId),
        playerId: parseInt(playerId),
        teamId: parseInt(teamId)
      }
    });

    return NextResponse.json(newSlot);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to assign player" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const { seasonId } = await params;
    const { playerId } = await request.json();

    await prisma.rosterSlot.deleteMany({
      where: { seasonId: parseInt(seasonId), playerId: parseInt(playerId) }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to remove player" }, { status: 500 });
  }
}