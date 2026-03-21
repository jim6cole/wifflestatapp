'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function GameSchedule() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real games from your API
    fetch('/api/games')
      .then(res => res.json())
      .then(data => {
        // Handle case where data might be empty or an error
        setGames(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load games:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="p-10 bg-slate-950 min-h-screen text-white font-black italic animate-pulse">
      LOADING AWAA SCHEDULE...
    </div>
  );

  return (
    <div className="p-8 max-w-4xl mx-auto bg-slate-950 min-h-screen text-white font-sans">
      <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Season Schedule</h1>
          <p className="text-blue-400 font-bold uppercase text-xs tracking-widest mt-1">League Matchups</p>
        </div>
        <Link href="/admin/schedule" className="bg-white text-black px-4 py-2 rounded font-black uppercase text-[10px] hover:bg-red-600 hover:text-white transition-colors">
          + Schedule New Game
        </Link>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
          <p className="text-slate-500 font-black uppercase italic mb-4">No games scheduled yet.</p>
          <Link href="/admin/schedule" className="text-red-500 font-black uppercase text-xs underline">Go to Admin Schedule Maker</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {games.map((game) => (
            <div key={game.id} className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden flex items-center p-6 hover:border-red-600/50 transition-all group">
              <div className="mr-6 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase">Game ID</p>
                {/* Fixed the substring error by ensuring ID is a string first */}
                <p className="text-lg font-black italic">#{String(game.id).substring(0,3)}</p>
              </div>

              <div className="flex-1 flex items-center justify-center gap-6">
                <div className="text-right flex-1">
                  <p className="text-xl font-black uppercase italic">{game.awayTeam?.name || 'Away Team'}</p>
                </div>
                <div className="text-red-600 font-black italic text-xl">VS</div>
                <div className="text-left flex-1">
                  <p className="text-xl font-black uppercase italic">{game.homeTeam?.name || 'Home Team'}</p>
                </div>
              </div>

              <div className="ml-8">
                <Link 
                  href={`/games/${game.id}/live`} 
                  className="bg-blue-600 px-6 py-3 rounded-xl font-black uppercase italic text-xs hover:bg-white hover:text-black transition-colors block"
                >
                  Score Game
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}