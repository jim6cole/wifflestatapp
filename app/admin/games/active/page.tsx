'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ActiveGamesLobby() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGames() {
      // Hits the API we'll create in step 3
      const res = await fetch('/api/admin/games/active');
      if (res.ok) setGames(await res.json());
      setLoading(false);
    }
    fetchGames();
  }, []);

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 border-b-4 border-[#669bbc] pb-6">
          <Link href="/admin/global" className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white transition-colors">← System Root</Link>
          <h1 className="text-6xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f] mt-2">
            Game Command Central
          </h1>
          <p className="text-[#669bbc] font-bold uppercase text-xs tracking-[0.4em] mt-2">Active Deployments // Select Match to Initialize</p>
        </header>

        {loading ? (
          <div className="text-center p-20 animate-pulse font-black uppercase italic text-2xl">Scanning Airwaves...</div>
        ) : games.length === 0 ? (
          <div className="bg-[#003566] border-2 border-dashed border-[#669bbc] p-20 text-center opacity-50">
            <p className="text-2xl font-black uppercase italic">No Upcoming Games Scheduled</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {games.map((game) => (
              <div key={game.id} className="bg-[#003566] border-2 border-[#669bbc] p-6 flex flex-col md:flex-row justify-between items-center group hover:border-[#fdf0d5] transition-all">
                <div>
                  <p className="text-[10px] font-black uppercase text-[#c1121f] mb-1">{game.season.name}</p>
                  <h2 className="text-3xl font-black italic uppercase text-white">
                    {game.awayTeam.name} <span className="text-[#669bbc] not-italic text-sm mx-2">VS</span> {game.homeTeam.name}
                  </h2>
                  <p className="text-xs font-bold uppercase text-[#669bbc] mt-1">
                    {new Date(game.scheduledAt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
                
                <Link 
                  href={`/admin/games/${game.id}/lineups`}
                  className="mt-6 md:mt-0 bg-[#c1121f] text-white px-8 py-4 font-black italic uppercase tracking-widest border-2 border-[#fdf0d5] hover:bg-white hover:text-[#c1121f] transition-all shadow-lg"
                >
                  Set Lineups →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}