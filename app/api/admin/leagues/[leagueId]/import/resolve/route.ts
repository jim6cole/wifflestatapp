import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await params;
  const { mapping, seasonId } = await request.json();

  const playerMap: Record<string, number> = {};
  const teamMap: Record<string, number> = {};

  // 1. Resolve Teams
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

  // 2. Resolve Players
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

  // 3. Create Dummy Game for this season
  const dummyGame = await prisma.game.create({
    data: {
      seasonId: parseInt(seasonId),
      homeTeamId: Object.values(teamMap)[0],
      awayTeamId: Object.values(teamMap)[0],
      scheduledAt: new Date(),
      status: 'COMPLETED',
      location: 'Legacy Archive'
    }
  });

  return NextResponse.json({ playerMap, teamMap, dummyGameId: dummyGame.id });
}