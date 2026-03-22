'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function GameDayLobby({ params }: { params: Promise<{ leagueId: string, seasonId: string }> }) {
  const { leagueId, seasonId } = use(params);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGames() {
      try {
        // We can reuse the same endpoint the Schedule Maker uses!
        const res = await fetch(`/api/admin/seasons/${seasonId}/games`);
        if (res.ok) {
          const data = await res.json();
          // Filter out completed games so we only see what's playable
          setGames(data.filter((g: any) => g.status !== 'COMPLETED'));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchGames();
  }, [seasonId]);

  if (loading) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black uppercase text-white animate-pulse italic text-2xl">Accessing Playbook...</div>;

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 border-b-4 border-[#669bbc] pb-6">
          <Link href={`/admin/leagues/${leagueId}/seasons/${seasonId}`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white transition-colors mb-4 block">
            ← Back to Terminal
          </Link>
          <h1 className="text-6xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f]">
            Game Day
          </h1>
          <p className="text-[#669bbc] font-bold uppercase text-xs tracking-[0.4em] mt-2">Active & Upcoming Matchups</p>
        </header>

        {games.length === 0 ? (
          <div className="bg-[#003566] border-2 border-dashed border-[#669bbc] p-20 text-center opacity-50">
            <p className="text-2xl font-black uppercase italic">No Upcoming Games</p>
            <p className="text-sm font-bold mt-2">Schedule a game in the terminal first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {games.map((game) => {
              const inProgress = game.status === 'IN_PROGRESS' || game.status === 'LIVE' || game.liveState;
              const d = new Date(game.scheduledAt);
              
              return (
                <div key={game.id} className={`bg-[#003566] border-2 ${inProgress ? 'border-green-500' : 'border-[#669bbc]'} p-6 flex flex-col md:flex-row justify-between items-center group hover:border-[#fdf0d5] transition-all relative overflow-hidden shadow-xl`}>
                  
                  {inProgress && (
                    <div className="absolute top-0 left-0 bg-green-600 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1">
                      Live
                    </div>
                  )}

                  <div className="mt-2 md:mt-0">
                    <p className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest mb-1">
                      {d.toLocaleDateString()} @ {d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </p>
                    <h2 className="text-3xl font-black italic uppercase text-white">
                      {game.awayTeam?.name} <span className="text-[#669bbc] not-italic text-sm mx-2">VS</span> {game.homeTeam?.name}
                    </h2>
                  </div>
                  
                  {inProgress ? (
                    <Link 
                      href={`/games/${game.id}/live`}
                      className="mt-6 md:mt-0 bg-green-600 text-white px-8 py-4 font-black italic uppercase tracking-widest border-2 border-green-300 hover:bg-white hover:text-green-600 transition-all shadow-[4px_4px_0px_#001d3d]"
                    >
                      Resume Game 
                    </Link>
                  ) : (
                    <Link 
                      href={`/admin/games/${game.id}/lineups`}
                      className="mt-6 md:mt-0 bg-[#c1121f] text-white px-8 py-4 font-black italic uppercase tracking-widest border-2 border-[#fdf0d5] hover:bg-white hover:text-[#c1121f] transition-all shadow-[4px_4px_0px_#001d3d]"
                    >
                      Set Lineups 
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}