import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: Get all teams in the league and identify which are in this season
export async function GET(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const resolvedParams = await params;
    const sId = parseInt(resolvedParams.seasonId);

    const season = await prisma.season.findUnique({
      where: { id: sId },
      select: { leagueId: true }
    });

    if (!season) {
      return NextResponse.json({ error: "Season not found" }, { status: 404 });
    }

    // Return ALL teams in the entire league so the UI can build the "Franchise Archive"
    const allTeams = await prisma.team.findMany({
      where: { 
        season: { leagueId: season.leagueId } 
      },
      include: { _count: { select: { rosterSlots: true } } }
    });

    return NextResponse.json(allTeams);
  } catch (error) {
    console.error("Fetch Teams Error:", error);
    return NextResponse.json({ error: "Failed to load teams" }, { status: 500 });
  }
}

// POST: Register a team name for this season
export async function POST(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const resolvedParams = await params;
    const sId = parseInt(resolvedParams.seasonId);
    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const cleanName = name.trim();

    // Check for duplicates ONLY within this specific season
    const existingTeam = await prisma.team.findFirst({
      where: { 
        seasonId: sId,
        name: { equals: cleanName }
      }
    });

    if (existingTeam) {
      return NextResponse.json({ error: "Team is already registered for this season." }, { status: 400 });
    }

    // Create a brand new team instance for this season
    const newTeam = await prisma.team.create({
      data: {
        name: cleanName,
        seasonId: sId
      }
    });
    
    return NextResponse.json(newTeam);
    
  } catch (error) {
    console.error("Team Creation Error:", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}