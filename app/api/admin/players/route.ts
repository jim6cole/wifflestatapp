import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from '@/lib/prisma';

/**
 * THE UMPIRE'S LOGIC: Formats names to Title Case.
 * Ensures "james cole" becomes "James Cole" before hitting the DB.
 */
const formatName = (input: string) => {
  if (!input) return "";
  return input
    .toLowerCase()
    .trim()
    .split(/\s+/) // Splits by any whitespace
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * GET: Fetch players with Intelligent Last Name Filtering.
 * If a search term like "James Cole" is provided, it specifically
 * searches for "Cole" to catch nicknames like "Jimmy Cole".
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search')?.trim();

    // If no search term, return a small sample of the roster
    if (!searchTerm) {
      const allPlayers = await prisma.player.findMany({ 
                orderBy: { name: 'asc' } 
      });
      return NextResponse.json(allPlayers);
    }

    // SPLIT LOGIC: Identify the assumed Last Name (the last word in the string)
    const nameParts = searchTerm.split(/\s+/);
    const lastNameQuery = nameParts.length > 1 ? nameParts[nameParts.length - 1] : searchTerm;

    const players = await prisma.player.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm } },     // Exact or partial match for full string
          { name: { contains: lastNameQuery } }  // Fallback match for just the last name
        ]
      },
            orderBy: { name: 'asc' },
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error("Master Roster Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch roster" }, { status: 500 });
  }
}

/**
 * POST: Create a brand new player in the Global Database.
 * Runs the Umpire's Logic to ensure data remains clean.
 */
// app/api/admin/players/route.ts

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const user = session.user as any;
    const isGlobalAdmin = user.isGlobalAdmin;
    const requestedLeagueId = body.leagueId ? parseInt(body.leagueId) : null;

    // NEW SECURITY CHECK:
    // If not a Global Admin, ensure they are a Commissioner for the league they are trying to add a player to.
    if (!isGlobalAdmin && requestedLeagueId) {
      const userLeagueIds = user.memberships
        ?.filter((m: any) => m.roleLevel >= 2)
        .map((m: any) => m.leagueId) || [];

      if (!userLeagueIds.includes(requestedLeagueId)) {
        return NextResponse.json({ error: "Unauthorized: You cannot create players for this league." }, { status: 403 });
      }
    }

    const formattedName = formatName(body.name);

    const existingPlayer = await prisma.player.findFirst({
      where: { name: formattedName }
    });

    if (existingPlayer) {
      return NextResponse.json(existingPlayer);
    }

    const newPlayer = await prisma.player.create({
      data: {
        name: formattedName,
        leagueId: requestedLeagueId 
      }
    });

    return NextResponse.json(newPlayer);
  } catch (error) {
    console.error("Player Creation Error:", error);
    return NextResponse.json({ error: "Draft failed" }, { status: 500 });
  }
}