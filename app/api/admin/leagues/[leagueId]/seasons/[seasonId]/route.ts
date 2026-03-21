import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type RouteParams = {
  params: Promise<{ leagueId: string; seasonId: string }>;
};

export async function DELETE(request: Request, { params }: RouteParams) {
  const { seasonId } = await params;

  try {
    await prisma.season.delete({
      where: { id: parseInt(seasonId) },
    });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

// PATCH/PUT: If you wanted to edit a season, it would go here!