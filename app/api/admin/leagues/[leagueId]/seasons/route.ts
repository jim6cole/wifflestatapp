import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

// This handles the POST request to create a new season
export async function POST(request: Request, { params }: { params: Promise<{ leagueId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    // 1. Security Check
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leagueId } = await params;
    const body = await request.json();

    // 2. Create the Season in Prisma
    const newSeason = await prisma.season.create({
      data: {
        name: body.name,
        year: body.year,
        balls: body.balls || 4,
        strikes: body.strikes || 3,
        outs: body.outs || 3,
        inningsPerGame: body.inningsPerGame || 4,
        eraStandard: body.eraStandard || 4, // Syncs with innings for ERA calc
        isSpeedRestricted: body.isSpeedRestricted || false,
        speedLimit: body.speedLimit || 60,
        status: body.status || 'UPCOMING', // This will be 'HISTORIC' from your wizard
        leagueId: parseInt(leagueId)
      }
    });

    return NextResponse.json(newSeason);
  } catch (error: any) {
    console.error("Season Creation Error:", error);
    return NextResponse.json({ error: "Failed to create season record." }, { status: 500 });
  }
}

// Ensure you still have your GET function below if you were using it
export async function GET(request: Request, { params }: { params: Promise<{ leagueId: string }> }) {
    const { leagueId } = await params;
    const seasons = await prisma.season.findMany({
        where: { leagueId: parseInt(leagueId) },
        orderBy: { year: 'desc' }
    });
    return NextResponse.json(seasons);
}