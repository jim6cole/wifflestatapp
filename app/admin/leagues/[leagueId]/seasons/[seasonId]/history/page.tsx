'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function SeasonHistory({ params }: { params: Promise<{ leagueId: string, seasonId: string }> }) {
  const { leagueId, seasonId } = use(params);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGames = () => {
    fetch(`/api/admin/seasons/${seasonId}/games`)
      .then(res => res.json())
      .then(data => {
        // Filter for only completed games
        setGames(data.filter((g: any) => g.status === 'COMPLETED' || g.status === 'FINAL'));
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchGames();
  }, [seasonId]);

  // --- THE DELETE HANDLER ---
  const handleDeleteGame = async (gameId: number) => {
    if (!confirm("CRITICAL: Deleting a recorded game will permanently wipe all stats, at-bats, and scores associated with it from the season records. Are you sure?")) return;

    try {
      const res = await fetch(`/api/admin/games/${gameId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Remove from local state so it vanishes instantly
        setGames(games.filter(g => g.id !== gameId));
      } else {
        const err = await res.json();
        alert(`Failed to delete game: ${err.error}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

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
            <p className="text-3xl font-black uppercase italic text-white">No Completed Games Found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {games.map((game) => (
              <div key={game.id} className="bg-[#003566] border-4 border-[#669bbc] p-8 flex flex-col lg:flex-row justify-between items-center group hover:border-[#ffd60a] transition-all shadow-[12px_12px_0px_#000]">
                
                <div className="text-center lg:text-left mb-6 lg:mb-0">
                  <p className="text-[10px] font-black uppercase text-[#ffd60a] mb-2 tracking-[0.2em]">
                    {new Date(game.scheduledAt).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                  <h2 className="text-3xl md:text-4xl font-black italic uppercase text-white leading-tight">
                    {game.awayTeam.name} <span className="text-[#c1121f] mx-1">@</span> {game.homeTeam.name}
                  </h2>
                  <div className="mt-4 flex items-center justify-center lg:justify-start gap-4">
                    <div className="text-center bg-black/40 px-6 py-2 border-2 border-[#ffd60a] skew-x-[-10deg]">
                      <span className="text-4xl font-black italic text-white skew-x-[10deg] inline-block">
                        {game.awayScore} - {game.homeScore}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-center">
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <Link 
                      href={`/admin/leagues/${leagueId}/seasons/${seasonId}/games/${game.id}`}
                      className="bg-white text-[#001d3d] px-6 py-3 text-center font-black uppercase italic text-xs border-2 border-white hover:bg-transparent hover:text-white transition-all"
                    >
                      View Summary
                    </Link>
                    
                    <Link 
                      href={`/admin/leagues/${leagueId}/seasons/${seasonId}/history/${game.id}`}
                      className="bg-[#c1121f] text-white px-8 py-3 text-center font-black uppercase italic text-xs tracking-widest border-2 border-[#c1121f] hover:bg-[#ffd60a] hover:text-[#001d3d] hover:border-[#ffd60a] transition-all shadow-[4px_4px_0px_#000]"
                    >
                      Audit Stats →
                    </Link>
                  </div>

                  {/* THE DELETE BUTTON */}
                  <button 
                    onClick={() => handleDeleteGame(game.id)}
                    className="bg-transparent border-2 border-white/20 text-white/20 hover:border-[#c1121f] hover:text-[#c1121f] p-4 transition-all"
                    title="Delete Permanently"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </div>
                
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}