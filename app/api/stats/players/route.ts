import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      include: {
        team: true,
        atBats: true, // Hitting data
        pitches: true  // Pitching data
      }
    });

    const playerStats = players.map(player => {
      const abs = player.atBats;
      const totalAB = abs.length;
      const hits = abs.filter(ab => ['Single', 'Double', 'Triple', 'Home Run'].includes(ab.result || '')).length;
      const homeRuns = abs.filter(ab => ab.result === 'Home Run').length;
      const rbis = abs.reduce((sum, ab) => sum + ab.rbi, 0);
      
      // Calculate Average (e.g., .333)
      const avg = totalAB > 0 ? (hits / totalAB).toFixed(3) : ".000";

      return {
        id: player.id,
        name: player.name,
        teamName: player.team.name,
        stats: {
          ab: totalAB,
          hits,
          hr: homeRuns,
          rbi: rbis,
          avg: avg.startsWith('0') ? avg.substring(1) : avg // Display as .300 instead of 0.300
        }
      };
    });

    // Sort by Average by default
    playerStats.sort((a, b) => Number(b.stats.avg) - Number(a.stats.avg));

    return NextResponse.json(playerStats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}