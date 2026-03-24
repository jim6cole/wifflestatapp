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
        // This JSON string ALREADY contains the inning and top/bottom status
        liveState: JSON.stringify(body.state),
        
        // These fields exist in your schema, so they are safe to update
        homeScore: body.state.homeScore,
        awayScore: body.state.awayScore
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to cloud save live state:", error);
    return NextResponse.json({ error: "Failed to save state" }, { status: 500 });
  }
}