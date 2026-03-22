import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Magic cache-buster line

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      include: {
        rosterSlots: {
          include: { team: true }
        },
        atBats: true, // Hitting data
        // pitchedAtBats: true // (Optional: Pitching data for future use)
      }
    });

    const playerStats = players.map(player => {
      const abs = player.atBats;
      let pa = 0;
      let abCount = 0;
      let hits = 0;
      let homeRuns = 0;
      let rbis = 0;

      abs.forEach(ab => {
        pa++;
        rbis += ab.rbi || 0;
        const res = ab.result;

        // Same null-safe logic used in the Season Terminal
        if (res === 'SINGLE' || res === 'CLEAN_SINGLE') { 
          abCount++; hits++; 
        } else if (res && (res.includes('DOUBLE') || res === 'GROUND_RULE_DOUBLE')) { 
          abCount++; hits++; 
        } else if (res === 'TRIPLE') { 
          abCount++; hits++; 
        } else if (res === 'HR') { 
          abCount++; hits++; homeRuns++; 
        } else if (res === 'WALK' || res === 'BB') { 
          // Walks do not count as At-Bats
        } else if (res && ['FLY_OUT', 'GROUND_OUT', 'DOUBLE_PLAY', 'TAG_UP', 'OUT', 'K', 'STRIKEOUT'].includes(res)) { 
          abCount++; 
        }
      });
      
      // Calculate Average
      const avg = abCount > 0 ? (hits / abCount).toFixed(3) : ".000";

      // Find their most recent team name (or list them as a Free Agent)
      const teamName = player.rosterSlots.length > 0 
        ? player.rosterSlots[player.rosterSlots.length - 1].team.name 
        : 'Free Agent';

      return {
        id: player.id,
        name: player.name,
        teamName: teamName,
        stats: {
          ab: abCount,
          hits,
          hr: homeRuns,
          rbi: rbis,
          avg: avg.startsWith('0') ? avg.substring(1) : avg // Display as .300 instead of 0.300
        }
      };
    });

    // Sort by Average by default
    playerStats.sort((a, b) => parseFloat(b.stats.avg) - parseFloat(a.stats.avg));

    return NextResponse.json(playerStats);
  } catch (error: any) {
    console.error("Player Stats Error:", error.message);
    return NextResponse.json({ error: "Failed to load player stats" }, { status: 500 });
  }
}