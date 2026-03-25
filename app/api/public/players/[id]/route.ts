import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const playerId = parseInt(id);

    // 1. Fetch Core Player Data
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        lineups: {
          include: { team: true }
        }
      }
    });

    if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    // 2. Fetch all At-Bats (Batting & Pitching) including Season speed rules
    const atBats = await prisma.atBat.findMany({
      where: {
        OR: [ { batterId: playerId }, { pitcherId: playerId } ]
      },
      include: {
        game: {
          include: {
            season: { include: { league: true } }
          }
        }
      }
    });

    // 3. Initialize Stat Containers
    const careerBatting = { ab: 0, h: 0, d: 0, t: 0, hr: 0, rbi: 0, bb: 0, k: 0, tb: 0 };
    const careerPitching = { outs: 0, h: 0, r: 0, er: 0, bb: 0, k: 0, hr: 0, faced: 0 };
    const yearlySplits: Record<string, any> = {};
    
    const teams = new Set(player.lineups.map(l => l.team.name));

    // 4. Process Every Pitch / Swing
    atBats.forEach(ab => {
      const year = ab.game.scheduledAt.getFullYear().toString();
      const leagueName = ab.game.season.league.name;
      
      // NEW: Generate descriptive speed string based on season rules
      const isRestricted = ab.game.season.isSpeedRestricted;
      const speedLimit = ab.game.season.speedLimit;
      const speedStr = isRestricted ? `Medium Pitch (${speedLimit} MPH)` : 'Fast Pitch';
      
      const splitKey = `${year}-${leagueName}-${speedStr}`; 

      if (!yearlySplits[splitKey]) {
        yearlySplits[splitKey] = {
          year, leagueName, style: speedStr, // Uses the descriptive string
          batting: { ab: 0, h: 0, d: 0, t: 0, hr: 0, rbi: 0, bb: 0, k: 0, tb: 0 },
          pitching: { outs: 0, h: 0, r: 0, er: 0, bb: 0, k: 0, hr: 0, faced: 0 }
        };
      }

      const split = yearlySplits[splitKey];
      const res = ab.result?.toUpperCase() || '';
      const isHit = ['SINGLE', 'CLEAN_SINGLE', 'DOUBLE', 'CLEAN_DOUBLE', 'GROUND_RULE_DOUBLE', 'TRIPLE', 'HR', '1B', '2B', '3B', '4B'].some(h => res.includes(h));
      const isOut = ['K', 'STRIKEOUT', 'FLY_OUT', 'GROUND_OUT', 'OUT', 'DP'].some(o => res.includes(o));
      const isWalk = res.includes('WALK') || res.includes('BB') || res.includes('HBP');

      if (ab.batterId === playerId) {
        let bases = 0;
        if (isHit) {
          bases = 1;
          if (res.includes('DOUBLE') || res.includes('2B')) bases = 2;
          if (res.includes('TRIPLE') || res.includes('3B')) bases = 3;
          if (res.includes('HR') || res.includes('4B')) bases = 4;
          
          careerBatting.h++; split.batting.h++;
          careerBatting.tb += bases; split.batting.tb += bases;
          if (bases === 2) { careerBatting.d++; split.batting.d++; }
          if (bases === 3) { careerBatting.t++; split.batting.t++; }
          if (bases === 4) { careerBatting.hr++; split.batting.hr++; }
        }
        if (isHit || isOut) { careerBatting.ab++; split.batting.ab++; }
        if (isWalk) { careerBatting.bb++; split.batting.bb++; }
        if (res.includes('K')) { careerBatting.k++; split.batting.k++; }
        const playRbi = ab.rbi > 0 ? ab.rbi : ab.runsScored;
        careerBatting.rbi += playRbi; split.batting.rbi += playRbi;
      }

      if (ab.pitcherId === playerId || (ab.runAttribution && ab.runAttribution.includes(playerId.toString()))) {
        if (ab.pitcherId === playerId) {
          careerPitching.faced++; split.pitching.faced++;
          careerPitching.outs += ab.outs; split.pitching.outs += ab.outs;
          if (isHit) { careerPitching.h++; split.pitching.h++; }
          if (isWalk) { careerPitching.bb++; split.pitching.bb++; }
          if (res.includes('K')) { careerPitching.k++; split.pitching.k++; }
          if (res.includes('HR') || res.includes('4B')) { careerPitching.hr++; split.pitching.hr++; }
        }

        if (ab.runsScored > 0) {
          if (ab.runAttribution) {
            const chargedIds = ab.runAttribution.split(',').map(id => parseInt(id.trim()));
            const runsChargedToMe = chargedIds.filter(id => id === playerId).length;
            if (runsChargedToMe > 0) {
              careerPitching.r += runsChargedToMe; split.pitching.r += runsChargedToMe;
              careerPitching.er += runsChargedToMe; split.pitching.er += runsChargedToMe;
            }
          } else if (ab.pitcherId === playerId) {
            careerPitching.r += ab.runsScored; split.pitching.r += ab.runsScored;
            careerPitching.er += ab.runsScored; split.pitching.er += ab.runsScored;
          }
        }
      }
    });

    const calcRates = (b: any, p: any) => {
      const avg = b.ab > 0 ? (b.h / b.ab).toFixed(3).replace(/^0/, '') : '.000';
      const obp = (b.ab + b.bb) > 0 ? ((b.h + b.bb) / (b.ab + b.bb)) : 0;
      const slg = b.ab > 0 ? (b.tb / b.ab) : 0;
      const ops = (b.ab + b.bb) === 0 ? '.000' : (obp + slg).toFixed(3).replace(/^0/, '');
      const ipRaw = p.outs / 3;
      const ip = `${Math.floor(p.outs / 3)}.${p.outs % 3}`;
      const era = ipRaw > 0 ? ((p.er * 4) / ipRaw).toFixed(2) : '0.00';
      const whip = ipRaw > 0 ? ((p.h + p.bb) / ipRaw).toFixed(2) : '0.00';
      return { avg, ops, ip, era, whip };
    };

    const careerRates = calcRates(careerBatting, careerPitching);
    const formattedSplits = Object.values(yearlySplits).map((split: any) => ({
      ...split,
      rates: calcRates(split.batting, split.pitching)
    })).sort((a, b) => parseInt(b.year) - parseInt(a.year));

    return NextResponse.json({
      player: { id: player.id, name: player.name, teams: Array.from(teams) },
      career: { batting: careerBatting, pitching: careerPitching, rates: careerRates },
      splits: formattedSplits
    });
  } catch (error) {
    console.error("Player Card API Error:", error);
    return NextResponse.json({ error: "Failed to load player stats" }, { status: 500 });
  }
}