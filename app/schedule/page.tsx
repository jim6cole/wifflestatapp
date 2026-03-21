'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LeagueSchedule() {
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/games').then(res => res.json()).then(setGames);
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-black mb-8 italic">AWAA SCHEDULE</h1>
      {games.map(game => (
        <Link href={`/games/${game.id}/setup`} key={game.id}>
          <div className="bg-slate-800 p-4 rounded-lg mb-4 flex justify-between items-center hover:bg-slate-700 transition cursor-pointer">
            <div>
              <div className="text-sm text-slate-400">
                {new Date(game.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-xl font-bold uppercase">
                {game.awayTeam.name} @ {game.homeTeam.name}
              </div>
            </div>
            <div className="text-blue-400 font-bold uppercase text-sm">
              {game.status} →
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}