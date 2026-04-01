import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

const formatName = (input: string) => {
  if (!input) return "";
  return input
    .toLowerCase()
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params; 
    const playerId = parseInt(id);
    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const targetPlayer = await prisma.player.findUnique({ where: { id: playerId } });
    if (!targetPlayer) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    const user = session.user as any;
    const isGlobalAdmin = user.isGlobalAdmin;

    // UPDATED SECURITY: Only check for Tier 2 (Commissioner) or Tier 3 (Admin)
    const userLeagueIds = user.memberships
        ?.filter((m: any) => m.roleLevel >= 2)
        .map((m: any) => m.leagueId) || [];

    if (!isGlobalAdmin && !userLeagueIds.includes(targetPlayer.leagueId)) {
        return NextResponse.json({ error: "Unauthorized: You are not a commissioner for this player's league." }, { status: 403 });
    }

    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: { name: formatName(name) }
    });

    return NextResponse.json(updatedPlayer);
  } catch (error) {
    console.error("Player Edit Error:", error);
    return NextResponse.json({ error: "Failed to update player" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
      const session = await getServerSession(authOptions);
      if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
      const { id } = await params; 
      const playerId = parseInt(id);
  
      const targetPlayer = await prisma.player.findUnique({ where: { id: playerId } });
      if (!targetPlayer) return NextResponse.json({ error: "Player not found" }, { status: 404 });
  
      const user = session.user as any;
      const isGlobalAdmin = user.isGlobalAdmin;

      // UPDATED SECURITY: Tier 2 Commissioner level required
      const userLeagueIds = user.memberships
          ?.filter((m: any) => m.roleLevel >= 2)
          .map((m: any) => m.leagueId) || [];
  
      if (!isGlobalAdmin && !userLeagueIds.includes(targetPlayer.leagueId)) {
          return NextResponse.json({ error: "Unauthorized: You are not a commissioner for this player's league." }, { status: 403 });
      }
  
      await prisma.player.delete({
        where: { id: playerId }
      });
  
      return NextResponse.json({ success: true });
  
    } catch (error: any) {
      const isConstraintError = 
        error.code === 'P2003' || 
        error.code === 'P2014' || 
        (error.message && error.message.includes('foreign key constraint')) ||
        (error.message && error.message.includes('23001'));

      if (isConstraintError) {
          return NextResponse.json({ 
              error: "Cannot delete player: They already have stats or game history recorded. If this is a duplicate, please contact a Hall of Fame Admin for a roster merge." 
          }, { status: 400 });
      }
      
      return NextResponse.json({ error: "Failed to delete player due to server error." }, { status: 500 });
    }
}