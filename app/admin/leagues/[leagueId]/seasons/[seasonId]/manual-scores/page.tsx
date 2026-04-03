'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function SeasonManualGameList({ params }: { params: Promise<{ leagueId: string, seasonId: string }> }) {
  const { leagueId, seasonId } = use(params);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGames() {
      const res = await fetch(`/api/admin/seasons/${seasonId}/schedule`);
      if (res.ok) {
        const data = await res.json();
        // Filter out completed games so they don't show up in the manual scorecard list
        setGames(data.filter((g: any) => g.status !== 'COMPLETED'));
      }
      setLoading(false);
    }
    fetchGames();
  }, [seasonId]);

  if (loading) return <div className="p-20 text-white font-black animate-pulse text-2xl italic">LOADING SEASON SCHEDULE...</div>;

  return (
    <div className="min-h-screen bg-[#001d3d] text-white p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 border-b-4 border-[#ffd60a] pb-6 flex justify-between items-end">
          <div>
            <Link href={`/admin/leagues/${leagueId}/seasons/${seasonId}`} className="text-[10px] font-black uppercase text-[#ffd60a] tracking-widest hover:text-white mb-2 block">
              ← Back to Dugout
            </Link>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter italic">Select Game to Score</h1>
          </div>
        </header>

        <div className="grid gap-4">
          {games.length > 0 ? (
            games.map((game) => (
              <div key={game.id} className="bg-white border-4 border-[#001d3d] p-6 flex flex-col md:flex-row justify-between items-center shadow-[8px_8px_0px_#000] group hover:border-[#ffd60a] transition-all">
                <div className="text-[#001d3d] mb-4 md:mb-0">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#669bbc] mb-1">
                    {new Date(game.scheduledAt).toLocaleDateString()} // {game.location || 'Primary Field'}
                  </div>
                  <div className="text-2xl font-black uppercase italic tracking-tight">
                    {game.awayTeam.name} <span className="text-[#c1121f] px-2">@</span> {game.homeTeam.name}
                  </div>
                </div>

                <Link 
                  href={`/admin/games/${game.id}/manual`}
                  className="px-8 py-3 font-black uppercase italic text-sm transition-all border-4 shadow-[4px_4px_0px_#000] active:translate-y-1 active:shadow-none bg-[#c1121f] text-white border-[#001d3d] hover:bg-[#ffd60a] hover:text-[#001d3d]"
                >
                  Score This Game
                </Link>
              </div>
            ))
          ) : (
            <div className="border-4 border-dashed border-[#669bbc] p-20 text-center opacity-40">
              <p className="font-black italic uppercase text-xl">No pending games found to score.</p>
              <Link href={`/admin/leagues/${leagueId}/seasons/${seasonId}/schedule/new`} className="text-[10px] underline font-bold mt-2 inline-block">Add a matchup first</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}