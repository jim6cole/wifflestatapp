import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// ARCHIVE TOGGLE
export async function PATCH(request: Request, { params }: { params: Promise<{ leagueId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role < 3) return NextResponse.json({ error: "L3 Admin Required" }, { status: 403 });

  const { leagueId } = await params;
  const { isActive } = await request.json();

  const updated = await prisma.league.update({
    where: { id: parseInt(leagueId) },
    data: { isActive }
  });
  return NextResponse.json(updated);
}

// PERMANENT DELETE (Nuke)
export async function DELETE(request: Request, { params }: { params: Promise<{ leagueId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role < 3) return NextResponse.json({ error: "L3 Admin Required" }, { status: 403 });

  const { leagueId } = await params;

  try {
    await prisma.league.delete({ where: { id: parseInt(leagueId) } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}