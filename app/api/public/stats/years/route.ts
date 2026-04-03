// app/api/public/stats/years/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch unique years from the Season table
    const seasons = await prisma.season.findMany({
      select: {
        year: true,
      },
      distinct: ['year'],
      orderBy: {
        year: 'desc',
      },
    });

    const years = seasons.map(s => s.year);
    return NextResponse.json(years);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}