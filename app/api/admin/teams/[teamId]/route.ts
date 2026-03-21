import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PATCH: Toggle a team's active status for a season
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const resolvedParams = await params;
    const teamId = parseInt(resolvedParams.teamId);
    
    // seasonId will either be the current ID (to activate) or null (to deactivate)
    const { seasonId } = await request.json(); 

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: { seasonId: seasonId }
    });

    return NextResponse.json(updatedTeam);
  } catch (error: any) {
    console.error("Update Team Status Error:", error.message);
    return NextResponse.json({ error: "Failed to update team status" }, { status: 500 });
  }
}

// DELETE: Permanently remove a team from the database
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    // Unwrap the params for Turbopack
    const resolvedParams = await params;
    const teamId = parseInt(resolvedParams.teamId);

    if (isNaN(teamId)) {
      return NextResponse.json({ error: "Invalid Team ID" }, { status: 400 });
    }

    // Since RosterSlot and Game relations have `onDelete: Cascade` or `SetNull` in your schema,
    // Prisma will automatically handle cleaning up those relations when the team is deleted.
    await prisma.team.delete({
      where: { id: teamId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Team Error:", error.message);
    return NextResponse.json(
      { error: "Failed to delete team. Make sure they don't have existing box scores locking them in." }, 
      { status: 500 }
    );
  }
}