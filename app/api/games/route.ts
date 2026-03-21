import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// This handles browser visits and the schedule list
export async function GET() {
  try {
    const games = await prisma.game.findMany({
      include: { 
        homeTeam: true, 
        awayTeam: true 
      },
      orderBy: { scheduledAt: 'asc' }
    });
    return NextResponse.json(games);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// This handles the form submission from the Schedule Maker
export async function POST(req: Request) {
  try {
    const { homeTeamId, awayTeamId, scheduledAt } = await req.json();
    
    const game = await prisma.game.create({
      data: {
        homeTeamId: Number(homeTeamId),
        awayTeamId: Number(awayTeamId),
        scheduledAt: new Date(scheduledAt),
        status: "SCHEDULED"
      }
    });
    
    return NextResponse.json(game);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}