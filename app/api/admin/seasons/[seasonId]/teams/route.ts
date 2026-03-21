import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Get all teams in the league and identify which are in this season
export async function GET(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  // Unwrap the params properly for Turbopack
  const resolvedParams = await params;
  const sId = parseInt(resolvedParams.seasonId);

  try {
    const season = await prisma.season.findUnique({
      where: { id: sId },
      select: { leagueId: true }
    });

    const allTeams = await prisma.team.findMany({
      where: { leagueId: season?.leagueId },
      include: { _count: { select: { rosterSlots: true } } }
    });

    return NextResponse.json(allTeams);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load teams" }, { status: 500 });
  }
}

// POST: Add an existing team to this season OR create a new one
export async function POST(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  const resolvedParams = await params;
  const sId = parseInt(resolvedParams.seasonId);
  const { teamId, name } = await request.json();

  try {
    if (teamId) {
      // DIRECT IMPORT (Button Click)
      const updatedTeam = await prisma.team.update({
        where: { id: teamId },
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

      // 1. Check for duplicates across the entire league
      const allLeagueTeams = await prisma.team.findMany({
        where: { leagueId: season.leagueId }
      });
      
      const duplicateTeam = allLeagueTeams.find(
        t => t.name.toLowerCase() === name.toLowerCase().trim()
      );

      if (duplicateTeam) {
        // 2. DUPLICATE FOUND! Don't create a new one, just activate the existing one.
        const activatedTeam = await prisma.team.update({
          where: { id: duplicateTeam.id },
          data: { seasonId: sId }
        });
        return NextResponse.json(activatedTeam);
      }

      // 3. NO DUPLICATE. Create a brand new franchise.
      const newTeam = await prisma.team.create({
        data: {
          name: name.trim(),
          leagueId: season.leagueId,
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