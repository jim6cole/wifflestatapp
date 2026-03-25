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

    const result = await prisma.$transaction(async (tx) => {
      // 1. Clear existing lineups
      await tx.lineupEntry.deleteMany({ where: { gameId: gId } });

      // 2. Prepare Home Team Entries (Now capturing the Position)
      const homeEntries = homeLineup.map((p: any, idx: number) => ({
        gameId: gId,
        playerId: parseInt(p.id),
        teamId: parseInt(p.teamId), 
        battingOrder: idx + 1,
        isPitcher: Boolean(p.isPitcher),
        position: p.position || (p.isPitcher ? 'Pitcher' : 'Fielder') // <-- ADDED THIS
      }));

      // 3. Prepare Away Team Entries
      const awayEntries = awayLineup.map((p: any, idx: number) => ({
        gameId: gId,
        playerId: parseInt(p.id),
        teamId: parseInt(p.teamId),
        battingOrder: idx + 1,
        isPitcher: Boolean(p.isPitcher),
        position: p.position || (p.isPitcher ? 'Pitcher' : 'Fielder') // <-- ADDED THIS
      }));

      await tx.lineupEntry.createMany({
        data: [...homeEntries, ...awayEntries]
      });

      const homePitcher = homeLineup.find((p: any) => p.isPitcher);
      const awayPitcher = awayLineup.find((p: any) => p.isPitcher);

      // 4. Update Game status and starters
      return await tx.game.update({
        where: { id: gId },
        data: {
          status: "LIVE",
          currentHomePitcherId: homePitcher ? parseInt(homePitcher.id) : null,
          currentAwayPitcherId: awayPitcher ? parseInt(awayPitcher.id) : null,
        }
      });
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Play Ball Error:", error.message);
    return NextResponse.json({ error: "Failed to start game" }, { status: 500 });
  }
}