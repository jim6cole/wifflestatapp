import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { leagueId: string } }) {
  const teams = await prisma.team.findMany({
    where: { leagueId: parseInt(params.leagueId) },
    include: { players: true }
  });
  return NextResponse.json(teams);
}

export async function POST(req: Request, { params }: { params: { leagueId: string } }) {
  const { name } = await req.json();
  const team = await prisma.team.create({
    data: {
      name,
      leagueId: parseInt(params.leagueId),
    }
  });
  return NextResponse.json(team);
}