import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: Fetch all teams actively participating in THIS season
export async function GET(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const { seasonId } = await params;
    const season = await prisma.season.findUnique({
      where: { id: parseInt(seasonId) },
      include: { teams: { orderBy: { name: 'asc' } } }
    });
    
    return NextResponse.json(season?.teams || []);
  } catch (error) {
    console.error("API Error fetching season teams:", error);
    return NextResponse.json({ error: "Failed to load teams" }, { status: 500 });
  }
}

// PATCH: Toggle a team into or out of the season
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const { seasonId } = await params;
    const { teamId, action } = await request.json();

    if (action === 'activate') {
      await prisma.season.update({
        where: { id: parseInt(seasonId) },
        data: { teams: { connect: { id: parseInt(teamId) } } }
      });
    } else {
      // Disconnect the team AND clean up their roster slots so players become Free Agents
      await prisma.$transaction([
        prisma.season.update({
          where: { id: parseInt(seasonId) },
          data: { teams: { disconnect: { id: parseInt(teamId) } } }
        }),
        prisma.rosterSlot.deleteMany({
          where: { seasonId: parseInt(seasonId), teamId: parseInt(teamId) }
        })
      ]);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API Error toggling season team:", error);
    return NextResponse.json({ error: "Toggle failed" }, { status: 500 });
  }
}