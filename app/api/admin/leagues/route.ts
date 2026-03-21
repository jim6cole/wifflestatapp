import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, fullName, location, description } = body;

    // Create the League
    const newLeague = await prisma.league.create({
      data: {
        name,
        fullName,
        location,
        description,
      },
    });

    // In a real app, you'd get the current user's ID from a session
    // For now, we update the user (Level 2) to be tied to this league
    await prisma.user.update({
      where: { id: 1 }, 
      data: { 
        leagueId: newLeague.id,
        roleLevel: 2 // Ensure they are a Level 2 for this league
      },
    });

    return NextResponse.json(newLeague);
  } catch (error) {
    console.error("League Creation Error:", error);
    return NextResponse.json({ error: "Failed to create league" }, { status: 500 });
  }
}