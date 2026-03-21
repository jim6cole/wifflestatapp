import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// 1. Changed { id: string } to { gameId: string } to match the new folder name
export async function POST(req: Request, { params }: { params: Promise<{ gameId: string }> }) {
  try {
    // 2. Unwrap the new gameId parameter
    const resolvedParams = await params;
    const gameId = Number(resolvedParams.gameId);
    
    const { homeLineup, awayLineup, homePitcherId, awayPitcherId } = await req.json();

    // Use a transaction to perform all these database updates at once
    const result = await prisma.$transaction(async (tx) => {
      // 1. Clear any existing lineup for this game (in case of a restart/re-setup)
      await tx.lineupEntry.deleteMany({
        where: { gameId }
      });

      // 2. Update the Game status and set the starting pitchers
      const updatedGame = await tx.game.update({
        where: { id: gameId },
        data: {
          status: "LIVE",
          currentHomePitcherId: Number(homePitcherId),
          currentAwayPitcherId: Number(awayPitcherId),
        }
      });

      // 3. Create Home Lineup entries in order
      for (const entry of homeLineup) {
        await tx.lineupEntry.create({
          data: {
            gameId,
            playerId: entry.id,
            teamId: updatedGame.homeTeamId,
            battingOrder: entry.order,
            isPitcher: entry.id === Number(homePitcherId)
          }
        });
      }

      // 4. Create Away Lineup entries in order
      for (const entry of awayLineup) {
        await tx.lineupEntry.create({
          data: {
            gameId,
            playerId: entry.id,
            teamId: updatedGame.awayTeamId,
            battingOrder: entry.order,
            isPitcher: entry.id === Number(awayPitcherId)
          }
        });
      }

      return updatedGame;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("LINEUP SAVE ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}