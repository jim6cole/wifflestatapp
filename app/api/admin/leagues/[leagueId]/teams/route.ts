import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await params;
  const teams = await prisma.team.findMany({
    where: { leagueId: parseInt(leagueId) },
    // Include game counts to power the "Smart Delete" warnings on the frontend
    include: { _count: { select: { homeGames: true, awayGames: true } } },
    orderBy: { name: 'asc' }
  });
  return NextResponse.json(teams);
}

export async function POST(request: Request, { params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await params;
  const { name } = await request.json();

  if (!name || !name.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const existing = await prisma.team.findFirst({
    where: { leagueId: parseInt(leagueId), name: { equals: name.trim() } }
  });

  if (existing) {
    return NextResponse.json({ error: "Franchise already exists in the League Pool!" }, { status: 400 });
  }

  const team = await prisma.team.create({
    data: { name: name.trim(), leagueId: parseInt(leagueId), isActive: true }
  });
  return NextResponse.json(team);
}