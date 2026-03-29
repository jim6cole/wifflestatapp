import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PATCH: Toggle a team's membership in a season
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const tId = parseInt(teamId);
    
    // We expect the body to tell us which season we are targeting 
    // and whether we are adding (active) or removing it.
    const { seasonId, shouldConnect } = await request.json(); 

    if (!seasonId) {
      return NextResponse.json({ error: "Season ID is required" }, { status: 400 });
    }

    const updatedTeam = await prisma.team.update({
      where: { id: tId },
      data: {
        // This is the Prisma syntax for Many-to-Many relationships
        seasons: shouldConnect 
          ? { connect: { id: parseInt(seasonId) } } 
          : { disconnect: { id: parseInt(seasonId) } }
      }
    });

    return NextResponse.json(updatedTeam);
  } catch (error: any) {
    console.error("Update Team Status Error:", error.message);
    return NextResponse.json({ error: "Failed to update team relationship" }, { status: 500 });
  }
}

// DELETE: Permanently remove a team from the database
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const tId = parseInt(teamId);

    if (isNaN(tId)) {
      return NextResponse.json({ error: "Invalid Team ID" }, { status: 400 });
    }

    // Prisma handles the cleanup of many-to-many join tables automatically.
    // However, if the team has Games or RosterSlots, Prisma might block this 
    // unless those relations are also set to Cascade in schema.prisma.
    await prisma.team.delete({
      where: { id: tId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Team Error:", error.message);
    return NextResponse.json(
      { error: "Failed to delete team. Ensure they are removed from all games and rosters first." }, 
      { status: 500 }
    );
  }
}