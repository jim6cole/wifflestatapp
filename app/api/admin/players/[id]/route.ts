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

export async function PATCH(
  request: Request, 
  { params }: { params: Promise<{ id: string }> } // 1. Define params as a Promise
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. UNWRAP THE PARAMS: This fixes the "id is missing" error
    const { id } = await params; 
    const playerId = parseInt(id);

    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const formattedName = formatName(name);

    // 3. THE UPDATE: Use the unwrapped playerId
    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: { name: formattedName }
    });

    return NextResponse.json(updatedPlayer);

  } catch (error) {
    console.error("Player Edit Error:", error);
    return NextResponse.json({ error: "Failed to update player" }, { status: 500 });
  }
}