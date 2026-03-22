import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// MAGIC LINE: Force Next.js to recalculate stats on every single page load
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  try {
    const { seasonId } = await params;

    const atBats = await prisma.atBat.findMany({
      where: {
        game: { seasonId: parseInt(seasonId) }
      },
      include: {
        batter: { select: { id: true, name: true } }
      }
    });

    const statsMap: Record<number, any> = {};

    atBats.forEach((ab) => {
      if (!statsMap[ab.batterId]) {
        statsMap[ab.batterId] = {
          name: ab.batter.name,
          pa: 0, ab: 0, h: 0, hr: 0, bb: 0, k: 0, tb: 0
        };
      }

      const p = statsMap[ab.batterId];
      p.pa++;

      const res = ab.result;
      
      // Null-safe checks
      if (res === 'SINGLE' || res === 'CLEAN_SINGLE') { 
        p.ab++; p.h++; p.tb += 1; 
      } else if (res && (res.includes('DOUBLE') || res === 'GROUND_RULE_DOUBLE')) { 
        p.ab++; p.h++; p.tb += 2; 
      } else if (res === 'TRIPLE') { 
        p.ab++; p.h++; p.tb += 3; 
      } else if (res === 'HR') { 
        p.ab++; p.h++; p.hr++; p.tb += 4; 
      } else if (res === 'WALK' || res === 'BB') { 
        p.bb++; 
      } else if (res === 'K' || res === 'STRIKEOUT') { 
        p.ab++; p.k++; 
      } else if (res && ['FLY_OUT', 'GROUND_OUT', 'DOUBLE_PLAY', 'TAG_UP', 'OUT'].includes(res)) { 
        p.ab++; 
      }
    });

    const statsArray = Object.values(statsMap).map(p => {
      const avg = p.ab > 0 ? (p.h / p.ab) : 0;
      const slg = p.ab > 0 ? (p.tb / p.ab) : 0;
      const obp = p.pa > 0 ? ((p.h + p.bb) / p.pa) : 0;
      
      return {
        ...p,
        avg: avg.toFixed(3),
        slg: slg.toFixed(3),
        ops: (obp + slg).toFixed(3)
      };
    }).sort((a, b) => parseFloat(b.ops) - parseFloat(a.ops));

    return NextResponse.json(statsArray);
  } catch (error) {
    console.error("Stats Error:", error);
    return NextResponse.json({ error: "Failed to crunch stats" }, { status: 500 });
  }
}