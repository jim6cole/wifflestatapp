import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

// --- GET SEASON DETAILS ---
export async function GET(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.seasonId);
    
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const season = await prisma.season.findUnique({
      where: { id },
      include: { events: true }
    });

    if (!season) return NextResponse.json({ error: "Season not found" }, { status: 404 });

    return NextResponse.json(season);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- TOGGLE SEASON STATE (ACTIVE / COMPLETED) ---
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const { status } = await request.json(); 
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.seasonId);
    
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const updatedSeason = await prisma.season.update({
      where: { id },
      data: { status } 
    });

    return NextResponse.json(updatedSeason);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- DELETE SEASON ---
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  // ⚡ FIX: Stop checking for user.role (doesn't exist)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.seasonId);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid Season ID" }, { status: 400 });
    }

    // ⚡ FIX: Verify they are a Commissioner of THIS league if they aren't a Global Admin
    if (!user.isGlobalAdmin) {
       const season = await prisma.season.findUnique({ where: { id } });
       if (!season) return NextResponse.json({ error: "Not found" }, { status: 404 });
       
       const membership = await prisma.leagueMembership.findFirst({
         where: { userId: user.id, leagueId: season.leagueId, isApproved: true }
       });

       if (!membership || membership.roleLevel < 2) {
          return NextResponse.json({ error: "Forbidden: Only Commissioners can delete seasons." }, { status: 403 });
       }
    }

    await prisma.season.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Season deleted successfully" });
  } catch (error: any) {
    console.error("DELETE_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}