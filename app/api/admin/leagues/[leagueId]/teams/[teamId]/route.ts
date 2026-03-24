import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// DELETE: The Smart Delete (Hard Delete if 0 games, Archive if > 0 games)
export async function DELETE(
  request: Request, 
  { params }: { params: Promise<{ leagueId: string, teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const tId = parseInt(teamId);

    const team = await prisma.team.findUnique({
      where: { id: tId },
      include: { _count: { select: { homeGames: true, awayGames: true } } }
    });

    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

    const totalGames = team._count.homeGames + team._count.awayGames;

    if (totalGames === 0) {
      // 0 Games: SAFE TO NUKE (Permanent Delete)
      await prisma.team.delete({ where: { id: tId } });
      return NextResponse.json({ message: "Permanently Deleted", action: "hard_delete" });
    } else {
      // > 0 Games: MUST PROTECT STATS (Soft Delete / Archive)
      await prisma.team.update({ where: { id: tId }, data: { isActive: false } });
      return NextResponse.json({ message: "Safely Archived", action: "soft_delete" });
    }
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Delete operation failed" }, { status: 500 });
  }
}

// PATCH: Restore an Archived Team
export async function PATCH(
  request: Request, 
  { params }: { params: Promise<{ leagueId: string, teamId: string }> }
) {
  try {
    const { teamId } = await params;
    
    await prisma.team.update({
      where: { id: parseInt(teamId) },
      data: { isActive: true } // Bring them back from the dead
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Restore Error:", error);
    return NextResponse.json({ error: "Restore operation failed" }, { status: 500 });
  }
}