import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await params;
  const { mapping, seasonId } = await request.json();

  const playerMap: Record<string, number> = {};
  const teamMap: Record<string, number> = {};

  // 1. Fetch the season first to get the correct year for the timestamp
  const targetSeason = await prisma.season.findUnique({
    where: { id: parseInt(seasonId) },
    select: { year: true }
  });

  // 2. Resolve Teams
  for (const team of mapping.teams) {
    if (team.resolvedId === 'NEW') {
      const newTeam = await prisma.team.create({
        data: { name: team.name, leagueId: parseInt(leagueId) }
      });
      teamMap[team.name] = newTeam.id;
    } else {
      teamMap[team.name] = team.resolvedId;
    }
  }

  // 3. Resolve Players
  for (const player of mapping.players) {
    if (player.resolvedId === 'NEW') {
      const newPlayer = await prisma.player.create({
        data: { name: player.name, leagueId: parseInt(leagueId) }
      });
      playerMap[player.name] = newPlayer.id;
    } else {
      playerMap[player.name] = player.resolvedId;
    }
  }

  // 4. Create Dummy Game for this season
  // We set the scheduledAt date to Jan 1st of the season's actual year
  const dummyGame = await prisma.game.create({
    data: {
      seasonId: parseInt(seasonId),
      // Use the first team resolved above as a placeholder
      homeTeamId: Object.values(teamMap)[0],
      awayTeamId: Object.values(teamMap)[0],
      scheduledAt: new Date(Date.UTC(targetSeason?.year || 2026, 0, 1)), // Fixed targetSeason reference
      status: 'COMPLETED',
      location: 'Legacy Archive'
    }
  });

  return NextResponse.json({ playerMap, teamMap, dummyGameId: dummyGame.id });
}