'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function SeasonHistory({ params }: { params: Promise<{ leagueId: string, seasonId: string }> }) {
  const { leagueId, seasonId } = use(params);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/seasons/${seasonId}/games`)
      .then(res => res.json())
      .then(data => {
        // Filter for only completed games
        setGames(data.filter((g: any) => g.status === 'COMPLETED' || g.status === 'FINAL'));
        setLoading(false);
      });
  }, [seasonId]);

  if (loading) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black uppercase text-white animate-pulse italic text-2xl">Accessing Archives...</div>;

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-5xl mx-auto">
        
        <header className="mb-12 border-b-4 border-[#669bbc] pb-8">
          <Link href={`/admin/leagues/${leagueId}/seasons/${seasonId}`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white transition-colors mb-4 block">
            ← Back to Season Hub
          </Link>
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f]">
            Game History
          </h1>
          <p className="text-[#ffd60a] font-black uppercase text-xs tracking-[0.4em] mt-3 italic">Completed Matchups // Season Records</p>
        </header>

        {games.length === 0 ? (
          <div className="bg-[#003566] border-4 border-dashed border-[#669bbc] p-20 text-center opacity-50">
            <p className="text-3xl font-black uppercase italic text-white">No Completed Games</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {games.map((game) => (
              <Link key={game.id} href={`/admin/leagues/${leagueId}/seasons/${seasonId}/games/${game.id}`}>
                <div className="bg-[#003566] border-4 border-[#669bbc] p-8 flex flex-col md:flex-row justify-between items-center group hover:border-white transition-all shadow-[8px_8px_0px_#000]">
                  
                  <div className="text-center md:text-left mb-6 md:mb-0">
                    <p className="text-[10px] font-black uppercase text-[#669bbc] mb-2 tracking-widest">
                      {new Date(game.scheduledAt).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                    </p>
                    <h2 className="text-4xl font-black italic uppercase text-white group-hover:text-[#ffd60a] transition-colors">
                      {game.awayTeam.name} <span className="text-[#c1121f] mx-2">@</span> {game.homeTeam.name}
                    </h2>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase text-[#669bbc] mb-1">Final Score</p>
                      <div className="text-5xl font-black italic text-white bg-black/30 px-6 py-2 border-2 border-[#ffd60a] skew-x-[-10deg]">
                        <span className="skew-x-[10deg] inline-block">{game.awayScore} - {game.homeScore}</span>
                      </div>
                    </div>
                    <span className="text-3xl font-black text-[#669bbc] group-hover:translate-x-2 transition-transform">↗</span>
                  </div>
                  
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}