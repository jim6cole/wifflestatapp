'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function SeasonHistoryPage({ params }: { params: Promise<{ leagueId: string, seasonId: string }> }) {
  const { leagueId, seasonId } = use(params);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/seasons/${seasonId}/games`)
      .then(res => res.json())
      .then(data => {
        const gameList = Array.isArray(data) ? data : (data.games || []);
        const completed = gameList.filter((g: any) => g.status === 'COMPLETED');
        setGames(completed);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [seasonId]);

  if (loading) return (
    <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black italic text-[#fdf0d5] text-3xl md:text-5xl animate-pulse uppercase border-[12px] md:border-[16px] border-[#c1121f]">
      Scanning Record Books...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] p-6 md:p-12 border-[12px] md:border-[16px] border-[#c1121f]">
      <div className="max-w-[1600px] mx-auto">
        
        {/* HEADER */}
        <header className="mb-10 border-b-8 border-[#ffd60a] pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <Link href={`/leagues/${leagueId}/history`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white transition-colors mb-4 block">
              ← All Archives
            </Link>
            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f] leading-none">
              Box <span className="text-[#ffd60a]">Scores</span>
            </h1>
            <p className="text-[#ffd60a] font-black uppercase text-[10px] tracking-[0.4em] mt-3 italic">Official Season Results</p>
          </div>
        </header>

        {/* COMPACT RESPONSIVE GRID */}
        {/* 1 col (mobile) -> 2 cols (tablet) -> 3 cols (laptop) -> 4 cols (desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {games.length === 0 ? (
            <div className="col-span-full p-12 border-4 border-dashed border-white/20 text-center bg-black/30 shadow-[8px_8px_0px_#000]">
              <p className="text-white/50 font-black uppercase italic text-xl tracking-widest">No completed games found.</p>
            </div>
          ) : (
            games.map((game) => (
              <Link 
                key={game.id} 
                href={`/games/${game.id}`} 
                className="group bg-white border-4 border-[#001d3d] shadow-[6px_6px_0px_#000] hover:shadow-[8px_8px_0px_#ffd60a] hover:-translate-y-1 transition-all flex flex-col h-full"
              >
                {/* Score Header - Scaled Down */}
                <div className="bg-[#001d3d] text-white p-2 md:p-3 flex justify-between items-center border-b-4 border-[#c1121f]">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#ffd60a]">
                    {game.scheduledAt ? new Date(game.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'FINAL'}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#669bbc]">Field {game.fieldNumber || '1'}</span>
                </div>

                {/* Score Body - Compact Padding and Text */}
                <div className="p-4 md:p-5 flex items-center justify-between gap-3 flex-1">
                  
                  {/* Away Team */}
                  <div className="text-center flex-1 min-w-0">
                    <h2 className="text-base md:text-lg font-black italic uppercase break-words leading-tight mb-1 text-[#001d3d]">
                      {game.awayTeam?.name}
                    </h2>
                    <span className="text-4xl md:text-5xl font-black text-[#c1121f] drop-shadow-[2px_2px_0px_#001d3d] block leading-none">
                      {game.awayScore}
                    </span>
                  </div>
                  
                  {/* VS Divider */}
                  <div className="text-sm md:text-base font-black italic text-[#001d3d]/20 px-2 shrink-0">VS</div>

                  {/* Home Team */}
                  <div className="text-center flex-1 min-w-0">
                    <h2 className="text-base md:text-lg font-black italic uppercase break-words leading-tight mb-1 text-[#001d3d]">
                      {game.homeTeam?.name}
                    </h2>
                    <span className="text-4xl md:text-5xl font-black text-[#c1121f] drop-shadow-[2px_2px_0px_#001d3d] block leading-none">
                      {game.homeScore}
                    </span>
                  </div>
                </div>

                {/* Bottom Bar - Scaled Down */}
                <div className="bg-[#fdf0d5] p-3 text-center border-t-4 border-[#001d3d] group-hover:bg-[#001d3d] transition-colors mt-auto">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#001d3d] group-hover:text-[#ffd60a]">View Stat Sheet →</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}