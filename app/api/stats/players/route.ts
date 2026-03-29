import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch Players and all data needed for stats calculation
    const [players, allManualStats, allScoringAtBats] = await Promise.all([
      prisma.player.findMany({
        include: {
          rosterSlots: { include: { team: true } },
          atBats: true, // Stats as a batter
          pitchedAtBats: { // Volume stats (IP, Hits, K, BB)
            include: {
              game: {
                include: {
                  season: { select: { eraStandard: true } }
                }
              }
            }
          }
        }
      }),
      prisma.manualStatLine.findMany({
        include: {
          game: {
            include: {
              season: { select: { eraStandard: true } }
            }
          }
        }
      }),
      // Fetch scoring at-bats separately to handle inherited runs via runAttribution
      prisma.atBat.findMany({
        where: { runsScored: { gt: 0 } },
        include: {
          game: {
            include: {
              season: { select: { eraStandard: true } }
            }
          }
        }
      })
    ]);

    // 2. Build a map for Live Game Earned Runs (handling inherited runners via runAttribution)
    const livePitcherWeightedER: Record<number, number> = {};
    allScoringAtBats.forEach(ab => {
      const standard = ab.game?.season?.eraStandard || 4;
      if (ab.runAttribution) {
        // Split IDs (e.g., "10,12" means pitcher 10 and 12 each get 1 ER)
        const responsibleIds = ab.runAttribution.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        responsibleIds.forEach(pId => {
          livePitcherWeightedER[pId] = (livePitcherWeightedER[pId] || 0) + (1 * standard);
        });
      } else if (ab.pitcherId) {
        // Fallback: Charge active pitcher if attribution string is missing
        livePitcherWeightedER[ab.pitcherId] = (livePitcherWeightedER[ab.pitcherId] || 0) + (ab.runsScored * standard);
      }
    });

    const playerStats = (players as any[]).map(player => {
      // --- INITIALIZE TOTALS ---
      let abCount = 0; let hits = 0; let hr = 0; let rbis = 0; let walks = 0; let ks = 0; let runs = 0; let d2b = 0; let d3b = 0;
      let ipOutsTotal = 0; let phTotal = 0; let pbbTotal = 0; let pkTotal = 0;
      
      // Track weighted earned runs for ERA: Sum of (Runs * Season Standard)
      let totalWeightedER = livePitcherWeightedER[player.id] || 0;

      // --- 3. PROCESS LIVE AT-BATS (HITTING) ---
      player.atBats?.forEach((ab: any) => {
        const res = ab.result?.toUpperCase() || '';
        rbis += ab.rbi || 0;
        runs += ab.runsScored || 0;

        if (res.includes('SINGLE')) { 
          abCount++; hits++; 
        } else if (res.includes('DOUBLE') && !res.includes('PLAY')) { 
          abCount++; hits++; d2b++;
        } else if (res.includes('TRIPLE')) { 
          abCount++; hits++; d3b++;
        } else if (res === 'HR' || res === 'HOMERUN') { 
          abCount++; hits++; hr++; 
        } else if (res === 'WALK' || res === 'BB') { 
          walks++;
        } else if (['FLY_OUT', 'GROUND_OUT', 'OUT', 'K', 'STRIKEOUT', 'DOUBLE_PLAY'].some(o => res.includes(o))) { 
          abCount++; 
          if (res.includes('K')) ks++;
        }
      });

      // --- 4. PROCESS LIVE AT-BATS (PITCHING VOLUME) ---
      player.pitchedAtBats?.forEach((ab: any) => {
        const res = ab.result?.toUpperCase() || '';
        ipOutsTotal += (ab.outs || 0);
        if (res.includes('WALK') || res === 'BB') pbbTotal++;
        if (res.includes('K') || res.includes('STRIKEOUT')) pkTotal++;
        const isHit = ['SINGLE', 'DOUBLE', 'TRIPLE', 'HR', '1B', '2B', '3B', '4B'].some(h => res.includes(h) && !res.includes('PLAY'));
        if (isHit) phTotal++;
      });

      // --- 5. INJECT MANUAL STATS ---
      const manualForPlayer = allManualStats.filter(ms => ms.playerId === player.id);
      manualForPlayer.forEach(ms => {
        abCount += ms.ab || 0; hits += ms.h || 0; hr += ms.hr || 0; rbis += ms.rbi || 0;
        walks += ms.bb || 0; ks += ms.k || 0; runs += ms.r || 0; d2b += ms.d2b || 0; d3b += ms.d3b || 0;

        // Convert IP decimal (e.g., 5.2) to Total Outs (17) for perfect precision
        const currentIP = ms.ip || 0;
        const outs = (Math.floor(currentIP) * 3) + Math.round((currentIP % 1) * 10);
        ipOutsTotal += outs;
        phTotal += ms.ph || 0;
        pbbTotal += ms.pbb || 0;
        pkTotal += ms.pk || 0;

        // Apply Season Standard for this specific game
        const standard = ms.game?.season?.eraStandard || 4;
        totalWeightedER += (ms.per || 0) * standard;
      });

      // --- 6. FINAL CALCULATIONS ---
      const avgNum = abCount > 0 ? (hits / abCount) : 0;
      const obp = (abCount + walks) > 0 ? (hits + walks) / (abCount + walks) : 0;
      const totalBases = (hits - d2b - d3b - hr) + (d2b * 2) + (d3b * 3) + (hr * 4);
      const slg = abCount > 0 ? (totalBases / abCount) : 0;
      
      const avgStr = avgNum.toFixed(3).replace(/^0/, '');
      const opsStr = (obp + slg).toFixed(3).replace(/^0/, '');

      const mathIP = ipOutsTotal / 3;
      // THE FIX: (Weighted Earned Runs) / (Actual Decimal Innings)
      const era = mathIP > 0 ? (totalWeightedER / mathIP).toFixed(2) : "0.00";
      const whip = mathIP > 0 ? ((phTotal + pbbTotal) / mathIP).toFixed(2) : "0.00";

      const teamName = player.rosterSlots?.length > 0 
        ? player.rosterSlots[player.rosterSlots.length - 1].team.name 
        : 'Free Agent';

      return {
        id: player.id,
        name: player.name,
        teamName: teamName,
        stats: {
          ab: abCount, h: hits, hr: hr, rbi: rbis, r: runs, bb: walks, k: ks,
          avg: abCount > 0 ? avgStr : ".000",
          ops: opsStr,
          // Convert outs back to standard display (e.g., 5.1 for 5 innings, 1 out)
          ip: `${Math.floor(ipOutsTotal / 3)}.${ipOutsTotal % 3}`,
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