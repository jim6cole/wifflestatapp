import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// --- TOGGLE SEASON STATE (ACTIVE / COMPLETED) ---
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  // Level 2 (Commish) or Level 3 (Global) only
  if (!session || user.role < 2) {
    return NextResponse.json({ error: "Unauthorized. Level 2+ required." }, { status: 401 });
  }

  try {
    const { status } = await request.json(); // Expected: 'ACTIVE' or 'COMPLETED'
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

  // Security Check
  if (!session || user.role < 2) {
    return NextResponse.json({ error: "Unauthorized. Level 2+ required." }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.seasonId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid Season ID" }, { status: 400 });
    }

    // Prisma handles Cascade/SetNull based on your schema
    await prisma.season.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Season deleted, teams preserved" });
  } catch (error: any) {
    console.error("DELETE_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}