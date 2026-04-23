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
    const { seasonId } = await params;
    const id = parseInt(seasonId);
    
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
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { status } = await request.json(); 
    const { seasonId } = await params;
    const id = parseInt(seasonId);
    
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    // ⚡ SECURITY: Ensure user is a Commissioner or Admin before toggling state
    if (!user.isGlobalAdmin) {
      const season = await prisma.season.findUnique({ where: { id } });
      if (!season) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const membership = await prisma.leagueMembership.findFirst({
        where: { 
          userId: parseInt(user.id), // FIX: String to Int
          leagueId: season.leagueId, 
          isApproved: true 
        }
      });

      if (!membership || membership.roleLevel < 2) {
        return NextResponse.json({ error: "Forbidden: Commissioner access required." }, { status: 403 });
      }
    }

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
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { seasonId } = await params;
    const id = parseInt(seasonId);
    
    if (isNaN(id)) return NextResponse.json({ error: "Invalid Season ID" }, { status: 400 });

    // ⚡ SECURITY FIX: Use parseInt for user.id to verify Commissioner status
    if (!user.isGlobalAdmin) {
       const season = await prisma.season.findUnique({ where: { id } });
       if (!season) return NextResponse.json({ error: "Not found" }, { status: 404 });
       
       const membership = await prisma.leagueMembership.findFirst({
         where: { 
           userId: parseInt(user.id), // FIX: String to Int
           leagueId: season.leagueId, 
           isApproved: true 
         }
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
    // 💡 PRO-TIP: If this returns a 500, it's likely a database foreign key constraint.
    return NextResponse.json({ error: "Deletion failed. Ensure all associated games are removed first or use Cascade Delete." }, { status: 500 });
  }
}