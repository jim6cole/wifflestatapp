import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

/**
 * GET: Fetch all staff (approved and pending) for this league.
 * Secured: Only Global Admins or League Commissioners.
 */
export async function GET(request: Request, { params }: { params: Promise<{ leagueId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = session?.user as any;
    
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { leagueId } = await params;
    const targetLeagueId = parseInt(leagueId);

    // SECURITY: Ensure user has permission to view staff roster
    if (!currentUser.isGlobalAdmin) {
      const membership = await prisma.leagueMembership.findFirst({
        where: { 
          userId: parseInt(currentUser.id), 
          leagueId: targetLeagueId,
          isApproved: true
        }
      });

      // Must be at least a Commissioner (Level 2)
      if (!membership || membership.roleLevel < 2) {
        return NextResponse.json({ error: "Forbidden: Higher clearance required." }, { status: 403 });
      }
    }

    const staff = await prisma.leagueMembership.findMany({
      where: { leagueId: targetLeagueId },
      include: { 
        user: { 
          select: { id: true, name: true, email: true } 
        } 
      },
      orderBy: { isApproved: 'asc' } // Show pending requests first
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error("[STAFF_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to load staff list" }, { status: 500 });
  }
}

/**
 * PATCH: Approve, Revoke, or Change Role of a staff member.
 * Secured: Only Global Admins or League Commissioners.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ leagueId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = session?.user as any;
    
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { leagueId } = await params;
    const targetLeagueId = parseInt(leagueId);

    // ⚡ SECURITY FIX: Using parseInt to bridge String (Session) to Integer (DB)
    if (!currentUser.isGlobalAdmin) {
       const membership = await prisma.leagueMembership.findFirst({
         where: { 
           userId: parseInt(currentUser.id), 
           leagueId: targetLeagueId,
           isApproved: true
         }
       });

       // If they aren't in the league, or they are just a Scorekeeper (Level 1), block them.
       if (!membership || membership.roleLevel < 2) {
         return NextResponse.json({ error: "Forbidden: Commissioner access required." }, { status: 403 });
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
    console.error("[STAFF_PATCH_ERROR]", error);
    return NextResponse.json({ error: "Failed to update staff member" }, { status: 500 });
  }
}