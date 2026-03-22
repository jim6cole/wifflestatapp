import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leagueId, requestedRole } = await request.json();
    if (!leagueId) return NextResponse.json({ error: "League ID required" }, { status: 400 });

    const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check if they already have a membership (pending or active) for this league
    const existingMembership = await prisma.leagueMembership.findUnique({
      where: {
        userId_leagueId: {
          userId: dbUser.id,
          leagueId: parseInt(leagueId)
        }
      }
    });

    if (existingMembership) {
      return NextResponse.json({ error: "You already have a pending or active request for this league." }, { status: 400 });
    }

    // Create the new Pending Membership
    await prisma.leagueMembership.create({
      data: {
        userId: dbUser.id,
        leagueId: parseInt(leagueId),
        roleLevel: parseInt(requestedRole) || 1,
        isApproved: false // Requires Commish Approval
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Authenticated Join Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}