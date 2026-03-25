import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const style = searchParams.get('style'); 
    const seasonIdFilter = searchParams.get('seasonId');
    const leagueIdFilter = searchParams.get('leagueId');
    const yearFilter = searchParams.get('year');

    const currentYear = new Date().getFullYear();
    const targetYear = yearFilter ? parseInt(yearFilter) : currentYear;
    
    // Define the calendar year boundaries for global filtering
    const startOfYear = new Date(Date.UTC(targetYear, 0, 1));
    const endOfYear = new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59, 999));

    // 1. Build the Dynamic Filter
    const whereClause: any = {};

    if (seasonIdFilter) {
      // PATH A: Specific Season (Used by the League Stats Archives)
      // Only include finished games for archived season views
      whereClause.game = { 
        seasonId: parseInt(seasonIdFilter),
        status: 'COMPLETED'
      };
    } else {
      // PATH B: Global Dashboard Filter (Date-based)
      whereClause.createdAt = { gte: startOfYear, lte: endOfYear };
      
      const seasonConditions: any = {};

      // Filter by League if specified
      if (leagueIdFilter && leagueIdFilter !== 'all') {
        seasonConditions.leagueId = parseInt(leagueIdFilter);
      }

      // Filter by Pitching Style (Speed Restriction)
      if (style === 'fast') {
        seasonConditions.isSpeedRestricted = false;
      } else if (style === 'medium') {
        seasonConditions.isSpeedRestricted = true;
      }

      // If we have any season-level constraints, apply them to the query
      if (Object.keys(seasonConditions).length > 0) {
        whereClause.game = { season: seasonConditions };
      }
    }

    // 2. Fetch all required At-Bat data with full relations
    const atBats = await prisma.atBat.findMany({
      where: whereClause,
      include: {
        batter: { select: { name: true } },
        pitcher: { select: { name: true } },
        game: {
          include: {
            season: {
              include: { league: { select: { name: true } } }
            }
          }
        }
      },
    });

    const batterMap: Record<number, any> = {};
    const pitcherMap: Record<number, any> = {};
    let seasonName = "Global Stats";

    atBats.forEach((ab) => {
      const res = ab.result?.toUpperCase() || '';
      const leagueName = ab.game?.season?.league?.name || 'Unknown League';
      
      if (seasonIdFilter) {
        seasonName = ab.game?.season?.name || 'Season Stats';
      }
      
      // Determine the specific speed rules for this at-bat
      const isRestricted = ab.game?.season?.isSpeedRestricted;
      const speedLimit = ab.game?.season?.speedLimit;
      const speedStr = isRestricted ? `Medium Pitch (${speedLimit} MPH)` : 'Fast Pitch';

      const isHit = ['SINGLE', 'CLEAN_SINGLE', 'DOUBLE', 'CLEAN_DOUBLE', 'GROUND_RULE_DOUBLE', 'TRIPLE', 'HR', '1B', '2B', '3B', '4B'].some(h => res.includes(h));
      const isOut = ['K', 'STRIKEOUT', 'FLY_OUT', 'GROUND_OUT', 'OUT', 'DP', 'TAG UP', 'SAC FLY'].some(o => res.includes(o));
      const isWalk = res.includes('WALK') || res.includes('BB') || res.includes('HBP');
      const playRbi = ab.rbi > 0 ? ab.rbi : (ab.runsScored || 0);

      // --- Batting Aggregation ---
      if (ab.batterId && ab.batter) {
        if (!batterMap[ab.batterId]) {
          batterMap[ab.batterId] = { 
            id: ab.batterId, name: ab.batter.name, 
            ab: 0, h: 0, d: 0, t: 0, hr: 0, rbi: 0, bb: 0, k: 0, tb: 0,
            leagues: new Set<string>(),
            speeds: new Set<string>() 
          };
        }
        const b = batterMap[ab.batterId];
        b.leagues.add(leagueName);
        b.speeds.add(speedStr);
        
        if (isWalk) {
           b.bb++;
        } else if (isHit || isOut) {
          b.ab++;
          if (res.includes('K') || res.includes('STRIKEOUT')) b.k++;
          
          if (isHit) {
            b.h++;
            if (res.includes('DOUBLE') || res.includes('2B')) { b.d++; b.tb += 2; }
            else if (res.includes('TRIPLE') || res.includes('3B')) { b.t++; b.tb += 3; }
            else if (res.includes('HR') || res.includes('4B')) { b.hr++; b.tb += 4; }
            else { b.tb += 1; }
          }
        }
        b.rbi += playRbi;
      }

      // --- Pitching Aggregation ---
      if (ab.pitcherId && ab.pitcher) {
        if (!pitcherMap[ab.pitcherId]) {
          pitcherMap[ab.pitcherId] = { 
            id: ab.pitcherId, name: ab.pitcher.name, 
            outs: 0, k: 0, r: 0, er: 0, bb: 0, h: 0, hr: 0, w: 0, l: 0,
            leagues: new Set<string>(),
            speeds: new Set<string>()
          };
        }
        const p = pitcherMap[ab.pitcherId];
        p.leagues.add(leagueName);
        p.speeds.add(speedStr);
        
        p.outs += ab.outs;
        if (isHit) p.h++;
        if (isWalk) p.bb++;
        if (res.includes('HR') || res.includes('4B')) p.hr++;
        if (res.includes('K') || res.includes('STRIKEOUT')) p.k++;
        p.r += ab.runsScored;
        p.er += ab.runsScored; 
      }
    });

    // 3. Final Formatting and Rate Calculations
    const batters = Object.values(batterMap).map((b: any) => {
      const avg = b.ab > 0 ? (b.h / b.ab) : 0;
      const obp = (b.ab + b.bb) > 0 ? (b.h + b.bb) / (b.ab + b.bb) : 0;
      const slg = b.ab > 0 ? b.tb / b.ab : 0;
      const speedsArr = Array.from(b.speeds);
      return {
        ...b,
        avg: avg.toFixed(3).replace(/^0/, ''),
        obp: obp.toFixed(3).replace(/^0/, ''),
        ops: (obp + slg).toFixed(3).replace(/^0/, ''),
        leagueDisplay: Array.from(b.leagues).join(', '),
        speedDisplay: speedsArr.length > 1 ? 'All' : (speedsArr[0] || 'Unknown')
      };
    }).sort((a, b) => parseFloat(b.ops) - parseFloat(a.ops));

    const pitchers = Object.values(pitcherMap).map((p: any) => {
      const ipRaw = p.outs / 3;
      const era = ipRaw > 0 ? (p.er * 4) / ipRaw : 0;
      const whip = ipRaw > 0 ? (p.bb + p.h) / ipRaw : 0;
      const speedsArr = Array.from(p.speeds);
      return {
        ...p,
        ip: `${Math.floor(p.outs / 3)}.${p.outs % 3}`,
        era: era.toFixed(2),
        whip: whip.toFixed(2),
        leagueDisplay: Array.from(p.leagues).join(', '),
        speedDisplay: speedsArr.length > 1 ? 'All' : (speedsArr[0] || 'Unknown')
      };
    }).sort((a, b) => parseFloat(a.era) - parseFloat(b.era));

    return NextResponse.json({ batters, pitchers, year: targetYear, seasonName });
  } catch (error: any) {
    console.error("Stats API Error:", error.message);
    return NextResponse.json({ error: "Failed to aggregate stats" }, { status: 500 });
  }
}