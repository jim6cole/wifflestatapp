import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  try {
    const { leagueId } = await params;
    const seasons = await prisma.season.findMany({
      where: { leagueId: parseInt(leagueId) },
      select: { id: true, name: true, status: true, isTournament: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(seasons);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch seasons" }, { status: 500 });
  }
}