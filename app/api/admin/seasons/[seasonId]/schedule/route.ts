import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const { seasonId } = await params;
    const id = parseInt(seasonId);

    const games = await prisma.game.findMany({
      where: { seasonId: id },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } }
      },
      orderBy: { scheduledAt: 'desc' } // Newest games at the top
    });

    return NextResponse.json(games);
  } catch (error) {
    console.error("Schedule Fetch Error:", error);
    return NextResponse.json({ error: "Failed to load season matchups" }, { status: 500 });
  }
}