'use client';
import { useState, useEffect, use } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function SeasonSchedulePage({ params }: { params: Promise<{ leagueId: string, seasonId: string }> }) {
  const { leagueId, seasonId } = use(params);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/seasons/${seasonId}/games`)
      .then(res => res.json())
      .then(data => {
        setGames(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [seasonId]);

  if (loading) return (
    <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black italic text-white text-5xl animate-pulse uppercase">
      Syncing Gameday...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fdf0d5] text-[#001d3d] p-8 md:p-16 border-[16px] border-[#001d3d]">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER SECTION */}
        <header className="mb-12 border-b-8 border-[#c1121f] pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <Link href={`/leagues/${leagueId}/schedule`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#c1121f] transition-colors mb-4 block">
              ← All Schedules
            </Link>
            <h1 className="text-7xl md:text-8xl font-black italic uppercase tracking-tighter text-[#001d3d] drop-shadow-[6px_6px_0px_#ffd60a]">
              Tournament <span className="text-[#c1121f]">Board</span>
            </h1>
          </div>
          <div className="bg-[#001d3d] text-white px-8 py-4 font-black italic uppercase tracking-widest text-xl shadow-[8px_8px_0px_#c1121f]">
            Season ID: {seasonId}
          </div>
        </header>

        {/* SCHEDULE LIST */}
        <div className="space-y-6">
          {games.length === 0 ? (
            <div className="p-20 border-4 border-dashed border-[#001d3d]/10 text-center">
              <p className="text-slate-400 font-black uppercase italic text-2xl">No Matchups Posted Yet.</p>
            </div>
          ) : (
            games.map((game) => (
              <div key={game.id} className="group bg-white border-4 border-[#001d3d] p-8 shadow-[12px_12px_0px_#001d3d] hover:shadow-[12px_12px_0px_#ffd60a] transition-all flex flex-col md:flex-row justify-between items-center gap-8">
                
                {/* TIME & FIELD INFO */}
                <div className="w-full md:w-1/4 flex flex-col items-start">
                  <span className="text-3xl font-black italic uppercase text-[#001d3d]">
                    {new Date(game.scheduledAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </span>
                  <div className="flex gap-2 mt-2">
                    <span className="bg-[#669bbc] text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                      Field {game.fieldNumber || '1'}
                    </span>
                    {game.isPlayoff && (
                      <span className="bg-[#c1121f] text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                        Elimination
                      </span>
                    )}
                  </div>
                </div>

                {/* MATCHUP INFO */}
                <div className="flex-1 flex items-center justify-center gap-6 md:gap-12 w-full">
                  <div className="text-center flex-1">
                    <h2 className="text-2xl md:text-4xl font-black italic uppercase truncate">{game.awayTeam.name}</h2>
                    <p className="text-[10px] font-bold text-[#669bbc] uppercase tracking-widest">Visitors</p>
                  </div>
                  
                  <div className="text-4xl md:text-6xl font-black italic text-[#c1121f]">@</div>

                  <div className="text-center flex-1">
                    <h2 className="text-2xl md:text-4xl font-black italic uppercase truncate">{game.homeTeam.name}</h2>
                    <p className="text-[10px] font-bold text-[#669bbc] uppercase tracking-widest">Home</p>
                  </div>
                </div>

                {/* SCORE OR STATUS */}
                <div className="w-full md:w-1/4 text-center md:text-right">
                  {game.status === 'COMPLETED' ? (
                    <div className="flex items-center justify-center md:justify-end gap-4">
                      <div className="bg-[#001d3d] text-white px-6 py-4 border-2 border-[#001d3d]">
                        <span className="text-3xl font-black italic">{game.awayScore} - {game.homeScore}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest rotate-90 origin-center whitespace-nowrap">Final</span>
                    </div>
                  ) : (
                    <div className={`px-6 py-3 border-4 font-black italic uppercase tracking-widest inline-block ${game.status === 'IN_PROGRESS' ? 'bg-[#22c55e] text-white border-[#001d3d] animate-pulse' : 'bg-[#ffd60a] text-[#001d3d] border-[#001d3d]'}`}>
                      {game.status === 'IN_PROGRESS' ? 'Live Now' : 'Upcoming'}
                    </div>
                  )}
                </div>

              </div>
            ))
          )}
        </div>

        {/* FOOTER */}
        <footer className="mt-16 text-center border-t-4 border-[#001d3d]/5 pt-8">
          <p className="text-[9px] font-black uppercase text-[#669bbc] tracking-[0.4em] opacity-50">
            Powered by WIFF+ // Gameday Information Center
          </p>
        </footer>
      </div>
    </div>
  );
}