import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // Ensures the dropdown is always up to date

export async function GET() {
  try {
    // We only select safe, non-sensitive data for the public dropdown
    const leagues = await prisma.league.findMany({
      where: { isActive: true }, // Only show active leagues
      select: { id: true, name: true, location: true },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(leagues);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load leagues" }, { status: 500 });
  }
}