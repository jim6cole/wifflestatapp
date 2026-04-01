import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ seasonId: string }> }) {
  try {
    const { seasonId } = await params;
    const events = await prisma.event.findMany({
      where: { seasonId: parseInt(seasonId) },
      include: { 
        winner: { select: { name: true } },
        _count: { select: { games: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load tournaments" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ seasonId: string }> }) {
  try {
    const { seasonId } = await params;
    const { name } = await request.json();

    if (!name) return NextResponse.json({ error: "Tournament name required" }, { status: 400 });

    const newEvent = await prisma.event.create({
      data: {
        name,
        seasonId: parseInt(seasonId),
        status: 'UPCOMING'
      }
    });
    return NextResponse.json(newEvent);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 });
  }
}