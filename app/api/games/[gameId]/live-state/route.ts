import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();

    await prisma.game.update({
      where: { id: parseInt(resolvedParams.gameId) },
      data: {
        // Save the entire React state snapshot as a JSON string
        liveState: JSON.stringify(body.state),
        // Keep the top-level database score synced just in case
        homeScore: body.state.homeScore,
        awayScore: body.state.awayScore,
        currentInning: body.state.inning,
        isTopInning: body.state.isTopInning
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to cloud save live state:", error);
    return NextResponse.json({ error: "Failed to save state" }, { status: 500 });
  }
}