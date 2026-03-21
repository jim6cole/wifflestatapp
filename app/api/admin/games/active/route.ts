import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// import { getServerSession } from "next-auth"; // Example for when you add Auth

export async function GET() {
  try {
    /* // OPTIONAL: AUTH GATEKEEPER
    const session = await getServerSession(authOptions);
    if (!session || !session.user.isApproved || session.user.roleLevel < 1) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    */

    const games = await prisma.game.findMany({
      where: {
        status: "UPCOMING",
      },
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
        season: { select: { name: true, id: true } }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    return NextResponse.json(games);
  } catch (error: any) {
    console.error("Active Games Fetch Error:", error.message);
    return NextResponse.json({ error: "Failed to load active games" }, { status: 500 });
  }
}