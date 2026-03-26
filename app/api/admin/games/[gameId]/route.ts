import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch game details for the Scorecard
export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const game = await prisma.game.findUnique({
      where: { id: parseInt(gameId) },
      include: {
        homeTeam: true,
        awayTeam: true,
        season: true,
      }
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json(game);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update game details (Supports partial updates for Pitching Changes)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const gId = parseInt(gameId);
    const body = await request.json();

    // Build the update object dynamically
    const updateData: any = {};
    
    if (body.homeTeamId) updateData.homeTeamId = parseInt(body.homeTeamId);
    if (body.awayTeamId) updateData.awayTeamId = parseInt(body.awayTeamId);
    if (body.scheduledAt) updateData.scheduledAt = new Date(body.scheduledAt);
    if (body.status) updateData.status = body.status;
    if (body.homeScore !== undefined) updateData.homeScore = parseInt(body.homeScore);
    if (body.awayScore !== undefined) updateData.awayScore = parseInt(body.awayScore);
    
    if (body.currentHomePitcherId) updateData.currentHomePitcherId = parseInt(body.currentHomePitcherId);
    if (body.currentAwayPitcherId) updateData.currentAwayPitcherId = parseInt(body.currentAwayPitcherId);

    const updatedGame = await prisma.game.update({
      where: { id: gId },
      data: updateData,
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        atBats: { orderBy: { id: 'asc' } } // Pull play-by-play for W/L/S logic
      }
    });

    // ==========================================================
    // ⚡ AUTOMATED W/L/S CALCULATOR FOR LIVE SCOREKEEPER
    // ==========================================================
    if (body.status === 'COMPLETED' && updatedGame.atBats && updatedGame.atBats.length > 0) {
      let awayScore = 0;
      let homeScore = 0;
      let currentLeader = 'TIE';
      let leadChangeIndex = -1;

      // Replay the game to find the final lead change
      updatedGame.atBats.forEach((ab, idx) => {
        if (ab.isTopInning) awayScore += ab.runsScored;
        else homeScore += ab.runsScored;

        if (awayScore > homeScore && currentLeader !== 'AWAY') {
          currentLeader = 'AWAY';
          leadChangeIndex = idx;
        } else if (homeScore > awayScore && currentLeader !== 'HOME') {
          currentLeader = 'HOME';
          leadChangeIndex = idx;
        }
      });

      // If someone won, assign the decisions
      if (awayScore !== homeScore && leadChangeIndex !== -1) {
        const leadAB = updatedGame.atBats[leadChangeIndex];
        const winner = awayScore > homeScore ? 'AWAY' : 'HOME';
        const winningTeamId = winner === 'AWAY' ? updatedGame.awayTeamId : updatedGame.homeTeamId;
        const losingTeamId = winner === 'AWAY' ? updatedGame.homeTeamId : updatedGame.awayTeamId;

        // 1. Loss: The pitcher throwing when the go-ahead run scored
        const lossId = leadAB.pitcherId;

        // 2. Win: The last pitcher for the winning team BEFORE they took the lead
        let winAB = updatedGame.atBats.slice(0, leadChangeIndex).reverse().find(ab => 
          winner === 'AWAY' ? !ab.isTopInning : ab.isTopInning
        );
        // Fallback: If they took the lead in the 1st inning, give it to the starting pitcher
        let winId = winAB ? winAB.pitcherId : updatedGame.atBats.find(ab => winner === 'AWAY' ? !ab.isTopInning : ab.isTopInning)?.pitcherId;

        // 3. Save: The pitcher who finished the game for the winning team
        const lastWinTeamAB = updatedGame.atBats.slice().reverse().find(ab => 
          winner === 'AWAY' ? !ab.isTopInning : ab.isTopInning
        );
        const finishingPitcherId = lastWinTeamAB ? lastWinTeamAB.pitcherId : null;
        
        let saveId = null;
        if (finishingPitcherId && finishingPitcherId !== winId) {
          saveId = finishingPitcherId; 
        }

        // Helper function to save decisions to the database
        const upsertDecision = async (pId: number | null | undefined, w: boolean, l: boolean, s: boolean, tId: number) => {
          if (!pId) return;
          const existing = await prisma.manualStatLine.findFirst({
            where: { gameId: gId, playerId: pId }
          });
          if (existing) {
            await prisma.manualStatLine.update({
              where: { id: existing.id },
              data: { win: w || existing.win, loss: l || existing.loss, save: s || existing.save }
            });
          } else {
            // Create a shell record just for the decision (stats will pull from Live AtBats)
            await prisma.manualStatLine.create({
              data: {
                gameId: gId, playerId: pId, teamId: tId, position: 'P',
                win: w, loss: l, save: s
              }
            });
          }
        };

        // Apply the decisions to the DB
        await upsertDecision(lossId, false, true, false, losingTeamId);
        await upsertDecision(winId, true, false, false, winningTeamId);
        await upsertDecision(saveId, false, false, true, winningTeamId);
      }
    }

    return NextResponse.json(updatedGame);
  } catch (error: any) {
    console.error("PATCH Game Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a game
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    await prisma.game.delete({ where: { id: parseInt(gameId) } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}