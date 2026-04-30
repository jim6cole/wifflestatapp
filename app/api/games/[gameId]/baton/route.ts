import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();

    // Pass the baton to the new client ID
    await prisma.game.update({
      where: { id: parseInt(resolvedParams.gameId) },
      data: { activeScorerId: body.clientId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to pass baton:", error);
    return NextResponse.json({ error: "Failed to transfer control" }, { status: 500 });
  }
}