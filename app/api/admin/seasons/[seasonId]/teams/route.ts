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

    // FIX 1: Look THROUGH the season relation to find teams in this league
    const allTeams = await prisma.team.findMany({
      where: { 
        season: { leagueId: season?.leagueId } 
      },
      include: { _count: { select: { rosterSlots: true } } }
    });

    return NextResponse.json(allTeams);
  } catch (error) {
    console.error("Fetch Teams Error:", error);
    return NextResponse.json({ error: "Failed to load teams" }, { status: 500 });
  }
}

// POST: Add an existing team to this season OR create a new one
export async function POST(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const resolvedParams = await params;
    const sId = parseInt(resolvedParams.seasonId);
    const { teamId, name } = await request.json();

    if (teamId) {
      // DIRECT IMPORT (Button Click)
      const updatedTeam = await prisma.team.update({
        where: { id: parseInt(teamId) },
        data: { seasonId: sId }
      });
      return NextResponse.json(updatedTeam);
    } else {
      // FORM SUBMISSION
      const season = await prisma.season.findUnique({
        where: { id: sId },
        select: { leagueId: true }
      });

      if (!season) {
        return NextResponse.json({ error: "Season not found" }, { status: 404 });
      }

      // FIX 2: Check for duplicates by looking THROUGH the season relation
      const allLeagueTeams = await prisma.team.findMany({
        where: { 
          season: { leagueId: season.leagueId } 
        }
      });
      
      const duplicateTeam = allLeagueTeams.find(
        t => t.name.toLowerCase() === name.toLowerCase().trim()
      );

      if (duplicateTeam) {
        // DUPLICATE FOUND! Don't create a new one, just activate the existing one.
        const activatedTeam = await prisma.team.update({
          where: { id: duplicateTeam.id },
          data: { seasonId: sId }
        });
        return NextResponse.json(activatedTeam);
      }

      // FIX 3: NO DUPLICATE. Create a brand new franchise (removed leagueId).
      const newTeam = await prisma.team.create({
        data: {
          name: name.trim(),
          seasonId: sId
        }
      });
      return NextResponse.json(newTeam);
    }
  } catch (error) {
    console.error("Team Creation Error:", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}