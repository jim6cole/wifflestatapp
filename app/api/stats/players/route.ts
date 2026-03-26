import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch Players and their Live At-Bats
    const players = await prisma.player.findMany({
      include: {
        rosterSlots: { include: { team: true } },
        atBats: true,
      }
    });

    // 2. Fetch ALL Manual Stats separately to avoid Prisma "Include" errors
    const allManualStats = await prisma.manualStatLine.findMany();

    const playerStats = (players as any[]).map(player => {
      // --- INITIALIZE TOTALS ---
      let abCount = 0;
      let hits = 0;
      let hr = 0;
      let rbis = 0;
      let walks = 0;
      let ks = 0;
      let runs = 0;
      let d2b = 0;
      let d3b = 0;

      // Pitching Totals
      let ipTotal = 0;
      let phTotal = 0;
      let prTotal = 0;
      let perTotal = 0;
      let pbbTotal = 0;
      let pkTotal = 0;

      // --- 3. PROCESS LIVE AT-BATS ---
      player.atBats?.forEach((ab: any) => {
        const res = ab.result?.toUpperCase() || '';
        rbis += ab.rbi || 0;
        runs += ab.runsScored || 0;

        if (res.includes('SINGLE')) { 
          abCount++; hits++; 
        } else if (res.includes('DOUBLE')) { 
          abCount++; hits++; d2b++;
        } else if (res.includes('TRIPLE')) { 
          abCount++; hits++; d3b++;
        } else if (res === 'HR' || res === 'HOMERUN') { 
          abCount++; hits++; hr++; 
        } else if (res === 'WALK' || res === 'BB') { 
          walks++;
        } else if (['FLY_OUT', 'GROUND_OUT', 'OUT', 'K', 'STRIKEOUT'].some(o => res.includes(o))) { 
          abCount++; 
          if (res.includes('K')) ks++;
        }
      });

      // --- 4. INJECT MANUAL STATS (Matching by Player ID) ---
      const manualForPlayer = allManualStats.filter(ms => ms.playerId === player.id);
      
      manualForPlayer.forEach(ms => {
        // Hitting
        abCount += ms.ab || 0;
        hits += ms.h || 0;
        hr += ms.hr || 0;
        rbis += ms.rbi || 0;
        walks += ms.bb || 0;
        ks += ms.k || 0;
        runs += ms.r || 0;
        d2b += ms.d2b || 0;
        d3b += ms.d3b || 0;

        // Pitching
        ipTotal += ms.ip || 0;
        phTotal += ms.ph || 0;
        prTotal += ms.pr || 0;
        perTotal += ms.per || 0;
        pbbTotal += ms.pbb || 0;
        pkTotal += ms.pk || 0;
      });

      // --- 5. CALCULATIONS ---
      const avgNum = abCount > 0 ? (hits / abCount) : 0;
      const obp = (abCount + walks) > 0 ? (hits + walks) / (abCount + walks) : 0;
      const slg = abCount > 0 ? ((hits - d2b - d3b - hr) + (d2b * 2) + (d3b * 3) + (hr * 4)) / abCount : 0;
      
      const avgStr = avgNum.toFixed(3).replace(/^0/, '');
      const opsStr = (obp + slg).toFixed(3).replace(/^0/, '');

      // Pitching Math (Standardizing .1 and .2)
      const wholeInnings = Math.floor(ipTotal);
      const fraction = ipTotal % 1;
      const mathIP = wholeInnings + (fraction >= 0.2 ? 0.666 : fraction >= 0.1 ? 0.333 : 0);

      const era = mathIP > 0 ? ((perTotal * 6) / mathIP).toFixed(2) : "0.00";
      const whip = mathIP > 0 ? ((phTotal + pbbTotal) / mathIP).toFixed(2) : "0.00";

      const teamName = player.rosterSlots?.length > 0 
        ? player.rosterSlots[player.rosterSlots.length - 1].team.name 
        : 'Free Agent';

      return {
        id: player.id,
        name: player.name,
        teamName: teamName,
        stats: {
          ab: abCount,
          h: hits,
          hr: hr,
          rbi: rbis,
          r: runs,
          bb: walks,
          k: ks,
          avg: avgStr === ".000" && hits > 0 ? ".000" : avgStr,
          ops: opsStr,
          // Pitching
          ip: ipTotal.toFixed(1),
          era,
          whip,
          pk: pkTotal
        }
      };
    });

    // Sort by Average
    playerStats.sort((a, b) => parseFloat(b.stats.avg) - parseFloat(a.stats.avg));

    return NextResponse.json(playerStats);
  } catch (error: any) {
    console.error("Master Stats Error:", error.message);
    return NextResponse.json({ error: "Failed to load player stats" }, { status: 500 });
  }
}