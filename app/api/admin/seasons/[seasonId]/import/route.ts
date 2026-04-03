import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ seasonId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { seasonId } = await params;
    const statsArray = await request.json();

    const result = await prisma.$transaction(
      statsArray.map((line: any) => 
        prisma.manualStatLine.create({
          data: {
            playerId: line.playerId,
            teamId: line.teamId,
            gameId: line.gameId,
            gp: line.gp || 0,
            
            // Hitting
            ab: line.ab || 0,
            h: line.h || 0,
            d2b: line.d2b || 0,
            d3b: line.d3b || 0,
            hr: line.hr || 0,
            rbi: line.rbi || 0,
            r: line.r || 0,
            bb: line.bb || 0,
            k: line.k || 0,

            // Pitching
            ip: line.ip || 0.0,
            ph: line.ph || 0,   // Hits allowed
            pbb: line.pbb || 0, // Walks allowed
            per: line.per || 0, // Earned runs
            phr: line.phr || 0, // HR allowed
            pk: line.pk || 0,

            // Decision Totals
            winCount: line.winCount || 0,
            lossCount: line.lossCount || 0,
            saveCount: line.saveCount || 0,
          }
        })
      )
    );

    return NextResponse.json({ success: true, count: result.length });
  } catch (error: any) {
    console.error("Import Error:", error);
    return NextResponse.json({ error: "Injection failed" }, { status: 500 });
  }
}