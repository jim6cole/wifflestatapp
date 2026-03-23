import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    
    if (!q) return NextResponse.json([]);

    // Find unique team names that match the query
    const teams = await prisma.team.findMany({
      where: { name: { contains: q } },
      select: { name: true },
      distinct: ['name'],
      take: 10,
    });

    // Return as array of objects so UI lists work smoothly
    const results = teams.map((t, index) => ({ id: `global-${index}`, name: t.name }));
    
    return NextResponse.json(results);
  } catch (error) {
    console.error("Team Search Error:", error);
    return NextResponse.json({ error: "Failed to search teams" }, { status: 500 });
  }
}