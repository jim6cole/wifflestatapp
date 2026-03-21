import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET all teams
export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(teams);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST a new team
export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const newTeam = await prisma.team.create({
      data: { name },
    });
    
    return NextResponse.json(newTeam);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}