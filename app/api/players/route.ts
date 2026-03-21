import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const players = await prisma.player.findMany({
    include: { team: true },
    orderBy: { name: 'asc' }
  });
  return NextResponse.json(players);
}

export async function POST(req: Request) {
  try {
    const { name, teamId } = await req.json();

    // 1. Check for duplicate name (case-insensitive)
    const existing = await prisma.player.findFirst({
      where: { name: { equals: name } }
    });

    if (existing) {
      return NextResponse.json({ error: "Player already exists!" }, { status: 400 });
    }

    const player = await prisma.player.create({
      data: { name, teamId: Number(teamId) }
    });
    return NextResponse.json(player);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}