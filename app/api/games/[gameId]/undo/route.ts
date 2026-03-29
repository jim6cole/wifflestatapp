import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function DELETE(req: Request, { params }: { params: { gameId: string } }) {
  try {
    const { gameId } = await params;
    
    // 1. Find the absolute last play recorded for this specific game
    const lastAtBat = await prisma.atBat.findFirst({
      where: { gameId: Number(gameId) },
      orderBy: { id: 'desc' } // Newest first
    });

    if (!lastAtBat) {
      return NextResponse.json({ message: "No plays to undo" }, { status: 404 });
    }

    // 2. Erase it from the records
    await prisma.atBat.delete({
      where: { id: lastAtBat.id }
    });

    return NextResponse.json({ success: true, deletedId: lastAtBat.id });
  } catch (error: any) {
    console.error("Undo Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}