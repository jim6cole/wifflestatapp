'use client';
import { useState, useEffect, use } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function SeasonHistoryPage({ params }: { params: Promise<{ leagueId: string, seasonId: string }> }) {
  const { leagueId, seasonId } = use(params);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/seasons/${seasonId}/games`)
      .then(res => res.json())
      .then(data => {
        const completed = (Array.isArray(data) ? data : []).filter(g => g.status === 'COMPLETED');
        setGames(completed);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [seasonId]);

  if (loading) return (
    <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black italic text-white text-3xl md:text-5xl animate-pulse uppercase">
      Scanning Record Books...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fdf0d5] text-[#001d3d] p-4 md:p-16 border-[12px] md:border-[16px] border-[#669bbc]">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-8 md:mb-12 border-b-8 border-[#001d3d] pb-6 md:pb-8">
          <Link href={`/leagues/${leagueId}/history`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#c1121f] transition-colors mb-4 block">
            ← All Archives
          </Link>
          <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter text-[#001d3d] drop-shadow-[4px_4px_0px_#669bbc] md:drop-shadow-[6px_6px_0px_#669bbc]">
            Box <span className="text-[#c1121f]">Scores</span>
          </h1>
          <p className="text-[#669bbc] font-black uppercase text-[10px] md:text-xs tracking-[0.5em] mt-4 italic">Official Season Results</p>
        </header>

        {/* RESULTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {games.length === 0 ? (
            <div className="col-span-full p-12 md:p-20 border-4 border-dashed border-[#001d3d]/10 text-center">
              <p className="text-slate-400 font-black uppercase italic text-xl md:text-2xl">No completed games found.</p>
            </div>
          ) : (
            games.map((game) => (
              <Link 
                key={game.id} 
                href={`/games/${game.id}`} 
                className="group bg-white border-4 border-[#001d3d] shadow-[6px_6px_0px_#001d3d] md:shadow-[8px_8px_0px_#001d3d] hover:shadow-[8px_8px_0px_#ffd60a] hover:-translate-y-1 transition-all overflow-hidden flex flex-col"
              >
                {/* Score Header */}
                <div className="bg-[#001d3d] text-white p-3 md:p-4 flex justify-between items-center">
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#ffd60a]">
                    {new Date(game.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Final Score</span>
                </div>

                {/* Score Body - Responsive Flex */}
                <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
                  
                  {/* Away Team */}
                  <div className="text-center flex-1 w-full md:w-auto">
                    <h2 className="text-xl md:text-2xl font-black italic uppercase line-clamp-1 mb-1">{game.awayTeam.name}</h2>
                    <span className="text-5xl md:text-6xl font-black text-[#001d3d] block">{game.awayScore}</span>
                  </div>
                  
                  {/* VS Divider */}
                  <div className="text-2xl md:text-3xl font-black italic text-[#c1121f] py-2 md:py-0">VS</div>

                  {/* Home Team */}
                  <div className="text-center flex-1 w-full md:w-auto">
                    <h2 className="text-xl md:text-2xl font-black italic uppercase line-clamp-1 mb-1">{game.homeTeam.name}</h2>
                    <span className="text-5xl md:text-6xl font-black text-[#001d3d] block">{game.homeScore}</span>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="bg-slate-50 p-3 md:p-4 text-center border-t-2 border-[#001d3d]/5 group-hover:bg-[#ffd60a] transition-colors mt-auto">
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-[#669bbc] group-hover:text-[#001d3d]">View Full Stat Sheet →</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}