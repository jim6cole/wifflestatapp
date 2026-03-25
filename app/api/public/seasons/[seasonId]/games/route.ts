import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> } // Singular to match your folder
) {
  try {
    // 1. Await the params (Required in Next.js 15)
    const { seasonId } = await params;
    const sId = parseInt(seasonId);

    if (isNaN(sId)) {
      return NextResponse.json({ error: "Invalid Season ID" }, { status: 400 });
    }

    // 2. Fetch games for the singular seasonId
    const games = await prisma.game.findMany({
      where: { seasonId: sId },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    return NextResponse.json(games);
  } catch (error) {
    console.error("Games API Error:", error);
    return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
  }
}