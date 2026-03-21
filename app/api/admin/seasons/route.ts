import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const body = await request.json();
  try {
    const newSeason = await prisma.season.create({
      data: {
        name: body.name,
        leagueId: body.leagueId,
        // ... other default settings
      },
    });
    return NextResponse.json(newSeason);
  } catch (error) {
    return NextResponse.json({ error: "Could not create season" }, { status: 500 });
  }
}