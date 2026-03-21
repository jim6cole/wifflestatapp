import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> } // Promise for Next.js 15
) {
  try {
    // 1. MUST AWAIT params
    const resolvedParams = await params;
    const seasonId = resolvedParams.seasonId;

    const id = parseInt(seasonId);

    // 2. If this check fails, you get the 400 Bad Request
    if (isNaN(id)) {
      console.error("400: Received invalid ID:", seasonId);
      return NextResponse.json({ error: "Invalid Season ID" }, { status: 400 });
    }

    // 3. Delete the Season 
    // (Prisma handles the Cascade to Games and SetNull to Teams automatically now)
    await prisma.season.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Season deleted, teams preserved" });
  } catch (error: any) {
    console.error("DELETE_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}