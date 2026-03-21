import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;
  const gId = parseInt(gameId);

  try {
    // 1. Get the current game's details to find the Season and the Timestamp
    const currentGame = await prisma.game.findUnique({
      where: { id: gId },
      select: { seasonId: true, scheduledAt: true }
    });

    if (!currentGame || !currentGame.seasonId) {
      return NextResponse.json({ error: "Game or Season not found" }, { status: 404 });
    }

    // 2. Fetch all AtBats in this season that occurred UP TO this game's date
    // This ensures the AVG/OPS includes the current game's performance
    const seasonAtBats = await prisma.atBat.findMany({
      where: {
        game: {
          seasonId: currentGame.seasonId,
          scheduledAt: { lte: currentGame.scheduledAt } // "Less than or equal to" this game
        }
      },
      include: { batter: true }
    });

    // 3. Identify which players actually played in THIS specific game
    // We only want to display rows for players who appeared in Game ID: gId
    const playersInThisGame = await prisma.lineupEntry.findMany({
      where: { gameId: gId },
      select: { playerId: true }
    });
    const activePlayerIds = new Set(playersInThisGame.map(p => p.playerId));

    // 4. Aggregate the stats
    const stats: Record<number, any> = {};

    seasonAtBats.forEach((ab) => {
      const bId = ab.batterId;
      
      // Initialize if not exists
      if (!stats[bId]) {
        stats[bId] = {
          id: bId,
          name: ab.batter.name,
          game_ab: 0, game_r: 0, game_h: 0, game_rbi: 0, game_bb: 0, game_k: 0, // Current Game Stats
          season_ab: 0, season_h: 0, season_bb: 0, season_tb: 0, // For Season AVG/OPS
          playedInThisGame: activePlayerIds.has(bId)
        };
      }

      const s = stats[bId];

      // Is this AtBat part of the current game? (For the R/H/RBI columns)
      const isCurrentGame = ab.gameId === gId;

      if (isCurrentGame) {
        s.game_rbi += ab.rbi;
        s.game_r += ab.runsScored;
      }

      // Calculate for Season Running Totals (Always)
      if (ab.result === 'WALK') {
        s.season_bb += 1;
        if (isCurrentGame) s.game_bb += 1;
      } else {
        s.season_ab += 1;
        if (isCurrentGame) {
          s.game_ab += 1;
          if (ab.result === 'STRIKEOUT') s.game_k += 1;
        }
        
        if (['SINGLE', 'DOUBLE', 'TRIPLE', 'HR'].includes(ab.result || '')) {
          const bases = ab.result === 'SINGLE' ? 1 : ab.result === 'DOUBLE' ? 2 : ab.result === 'TRIPLE' ? 3 : 4;
          s.season_h += 1;
          s.season_tb += bases;
          if (isCurrentGame) s.game_h += 1;
        }
      }
    });

    // 5. Filter the list to only show players who were in THIS game
    const boxScoreRows = Object.values(stats).filter((s: any) => s.playedInThisGame);

    return NextResponse.json(boxScoreRows);
  } catch (error) {
    return NextResponse.json({ error: "Failed to calculate totals" }, { status: 500 });
  }
}