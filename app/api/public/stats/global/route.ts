import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const style = searchParams.get('style'); // 'fast', 'medium', or null/all

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    // Build the filter object
    const whereClause: any = {
      createdAt: { gte: startOfYear, lte: endOfYear }
    };

    // Filter based on Pitch Speed Style
    if (style === 'fast') {
      whereClause.game = { season: { isSpeedRestricted: false } };
    } else if (style === 'medium') {
      whereClause.game = { season: { isSpeedRestricted: true } };
    }

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

    atBats.forEach((ab) => {
      const res = ab.result?.toUpperCase() || '';
      const leagueName = ab.game.season.league.name;
      
      // Batting Aggregation Logic
      if (ab.batterId && ab.batter) {
        if (!batterMap[ab.batterId]) {
          batterMap[ab.batterId] = { 
            id: ab.batterId, // <-- INJECTED HERE FOR PLAYER CARD LINKS
            name: ab.batter.name, 
            ab: 0, h: 0, d: 0, t: 0, hr: 0, rbi: 0, bb: 0,
            leagues: new Set<string>() 
          };
        }
        const b = batterMap[ab.batterId];
        b.leagues.add(leagueName);
        
        const isHit = ['SINGLE', 'CLEAN_SINGLE', 'DOUBLE', 'CLEAN_DOUBLE', 'GROUND_RULE_DOUBLE', 'TRIPLE', 'HR'].some(h => res.includes(h));
        const isOut = ['K', 'STRIKEOUT', 'FLY_OUT', 'GROUND_OUT', 'OUT', 'DP'].some(o => res.includes(o));
        // FIX: HBP is now recognized as a walk for OBP calculations!
        const isWalk = res.includes('WALK') || res.includes('BB') || res.includes('HBP');

        if (isHit || isOut) b.ab++;
        if (isHit) b.h++;
        if (isWalk) b.bb++;
        if (res.includes('DOUBLE')) b.d++;
        if (res.includes('TRIPLE')) b.t++;
        if (res.includes('HR')) b.hr++;
        const playRbi = ab.rbi > 0 ? ab.rbi : ab.runsScored;
b.rbi += playRbi;
      }

      // Pitching Aggregation Logic
      if (ab.pitcherId && ab.pitcher) {
        if (!pitcherMap[ab.pitcherId]) {
          pitcherMap[ab.pitcherId] = { 
            id: ab.pitcherId, // <-- INJECTED HERE FOR PLAYER CARD LINKS
            name: ab.pitcher.name, 
            outs: 0, k: 0, r: 0, er: 0, bb: 0, h: 0, hr: 0,
            leagues: new Set<string>() 
          };
        }
        const p = pitcherMap[ab.pitcherId];
        p.leagues.add(leagueName);
        
        const isHit = ['SINGLE', 'CLEAN_SINGLE', 'DOUBLE', 'CLEAN_DOUBLE', 'GROUND_RULE_DOUBLE', 'TRIPLE', 'HR'].some(h => res.includes(h));
        // FIX: Ensure pitchers are also penalized with a walk for hitting a batter
        const isWalk = res.includes('WALK') || res.includes('BB') || res.includes('HBP');

        p.outs += ab.outs;
        if (isHit) p.h++;
        if (isWalk) p.bb++;
        if (res.includes('HR')) p.hr++;
        if (res.includes('K') || res.includes('STRIKEOUT')) p.k++;
        p.r += ab.runsScored;
        p.er += ab.runsScored; 
      }
    });

    const batters = Object.values(batterMap).map((b: any) => {
      const leagueList = Array.from(b.leagues);
      const singles = b.h - (b.d + b.t + b.hr);
      const avg = b.ab > 0 ? (b.h / b.ab) : 0;
      const obp = (b.ab + b.bb) > 0 ? (b.h + b.bb) / (b.ab + b.bb) : 0;
      const slg = b.ab > 0 ? (singles + (2*b.d) + (3*b.t) + (4*b.hr)) / b.ab : 0;
      const ops = obp + slg;

      return {
        ...b,
        leagueDisplay: leagueList.length > 1 ? `${leagueList.length}LEAG` : (leagueList[0] || 'N/A'),
        avg, obp, ops,
      };
    });

    const pitchers = Object.values(pitcherMap).map((p: any) => {
      const leagueList = Array.from(p.leagues);
      const ipRaw = p.outs / 3;
      const whip = ipRaw > 0 ? (p.bb + p.h) / ipRaw : 0;
      const era = ipRaw > 0 ? (p.er * 4) / ipRaw : 0;

      return {
        ...p,
        leagueDisplay: leagueList.length > 1 ? `${leagueList.length}LEAG` : (leagueList[0] || 'N/A'),
        ip: `${Math.floor(p.outs / 3)}.${p.outs % 3}`,
        ipRaw,
        whip,
        era
      };
    });

    return NextResponse.json({ batters, pitchers, year: currentYear });
  } catch (error) {
    return NextResponse.json({ error: "Failed to aggregate stats" }, { status: 500 });
  }
}