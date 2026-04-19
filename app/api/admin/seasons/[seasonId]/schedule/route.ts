import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// ⚡ FIX: Tell Next.js NEVER to cache this API route
export const dynamic = 'force-dynamic';

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
      // ⚡ FIX: Changed 'desc' to 'asc' so the soonest games show up first!
      orderBy: { scheduledAt: 'asc' } 
    });

    return NextResponse.json(games);
  } catch (error) {
    console.error("Schedule Fetch Error:", error);
    return NextResponse.json({ error: "Failed to load season matchups" }, { status: 500 });
  }
}