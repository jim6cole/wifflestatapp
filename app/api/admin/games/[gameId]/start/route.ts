import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const gId = parseInt(gameId);
    const { homeLineup, awayLineup } = await request.json();

    // 1. Transaction to ensure data integrity
    const result = await prisma.$transaction(async (tx) => {
      // Clear existing lineups for this game (in case of a restart)
      await tx.lineupEntry.deleteMany({ where: { gameId: gId } });

      // Create new entries for Home Team
      const homeEntries = homeLineup.map((p: any, idx: number) => ({
        gameId: gId,
        playerId: p.id,
        teamId: p.teamId, // Ensure teamId is passed from frontend
        battingOrder: idx + 1,
        isPitcher: p.isPitcher || false,
      }));

      // Create new entries for Away Team
      const awayEntries = awayLineup.map((p: any, idx: number) => ({
        gameId: gId,
        playerId: p.id,
        teamId: p.teamId,
        battingOrder: idx + 1,
        isPitcher: p.isPitcher || false,
      }));

      await tx.lineupEntry.createMany({
        data: [...homeEntries, ...awayEntries]
      });

      // Find the designated pitchers to set as current starters
      const homePitcher = homeLineup.find((p: any) => p.isPitcher);
      const awayPitcher = awayLineup.find((p: any) => p.isPitcher);

      // 2. Update Game status to LIVE
      return await tx.game.update({
        where: { id: gId },
        data: {
          status: "LIVE",
          currentHomePitcherId: homePitcher?.id || null,
          currentAwayPitcherId: awayPitcher?.id || null,
        }
      });
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Play Ball Error:", error.message);
    return NextResponse.json({ error: "Failed to start game" }, { status: 500 });
  }
}