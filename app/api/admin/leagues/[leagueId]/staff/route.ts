import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

// GET: Fetch all staff (approved and pending) for this league
export async function GET(request: Request, { params }: { params: Promise<{ leagueId: string }> }) {
  try {
    const { leagueId } = await params;
    const staff = await prisma.leagueMembership.findMany({
      where: { leagueId: parseInt(leagueId) },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { isApproved: 'asc' } // Show pending requests first
    });
    return NextResponse.json(staff);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load staff" }, { status: 500 });
  }
}

// PATCH: Approve, Revoke, or Change Role
export async function PATCH(request: Request, { params }: { params: Promise<{ leagueId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = session?.user as any;
    
    // Security: Must be logged in
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { leagueId } = await params;
    const targetLeagueId = parseInt(leagueId);

    // ⚡ SECURITY FIX: Ensure user is a Global Admin OR a Commissioner (Level 2+) of THIS specific league
    if (!currentUser.isGlobalAdmin) {
       const membership = await prisma.leagueMembership.findFirst({
         where: { 
           userId: currentUser.id, 
           leagueId: targetLeagueId,
           isApproved: true
         }
       });

       // If they aren't in the league, or they are just a Scorekeeper (Level 1), block them.
       if (!membership || membership.roleLevel < 2) {
         return NextResponse.json({ error: "Forbidden: You must be a Commissioner to change personnel access." }, { status: 403 });
       }
    }

    const { membershipId, isApproved, roleLevel } = await request.json();

    const updated = await prisma.leagueMembership.update({
      where: { id: parseInt(membershipId) },
      data: { 
        isApproved: isApproved,
        roleLevel: roleLevel
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update staff member" }, { status: 500 });
  }
}