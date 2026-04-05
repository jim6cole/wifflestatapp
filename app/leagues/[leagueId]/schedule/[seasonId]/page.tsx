'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function SeasonSchedulePage({ params }: { params: Promise<{ leagueId: string, seasonId: string }> }) {
  const { leagueId, seasonId } = use(params);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- ADDED: Auto-refresh polling to pull live updates (balls/strikes/bases)
  useEffect(() => {
    const fetchGames = () => {
      // Add a timestamp to prevent aggressive browser caching
      fetch(`/api/public/seasons/${seasonId}/games?t=${new Date().getTime()}`)
        .then(res => res.json())
        .then(data => {
          const gameList = Array.isArray(data) ? data : (data.games || []);
          
          // SMART SORT: Forces any IN_PROGRESS games to the absolute top of the list
          const sortedGames = [...gameList].sort((a, b) => {
            if (a.status === 'IN_PROGRESS' && b.status !== 'IN_PROGRESS') return -1;
            if (b.status === 'IN_PROGRESS' && a.status !== 'IN_PROGRESS') return 1;
            return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
          });
          
          setGames(sortedGames);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch schedule updates", err);
          setLoading(false);
        });
    };

    // Initial fetch
    fetchGames();

    // Poll every 5 seconds for live state updates
    const interval = setInterval(fetchGames, 5000);
    return () => clearInterval(interval);
  }, [seasonId]);

  if (loading) return (
    <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black italic text-[#fdf0d5] text-3xl md:text-5xl animate-pulse uppercase border-[12px] md:border-[16px] border-[#c1121f]">
      Syncing Gameday...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] p-6 md:p-12 border-[12px] md:border-[16px] border-[#c1121f]">
      <div className="max-w-[1600px] mx-auto">
        
        {/* HEADER SECTION */}
        <header className="mb-10 border-b-8 border-[#ffd60a] pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <Link href={`/leagues/${leagueId}/schedule`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white transition-colors mb-4 block">
              ← All Schedules
            </Link>
            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f] leading-none">
              Season <span className="text-[#ffd60a]">Schedule</span>
            </h1>
            <p className="text-[#ffd60a] font-black uppercase text-[10px] tracking-[0.4em] mt-3 italic">Live Gameday Board</p>
          </div>
          <div className="bg-[#c1121f] text-white px-6 py-3 border-4 border-[#001d3d] font-black italic uppercase tracking-widest text-lg shadow-[6px_6px_0px_#000] shrink-0">
            Season: {seasonId}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {games.length === 0 ? (
            <div className="col-span-full p-12 border-4 border-dashed border-white/20 text-center bg-black/30 shadow-[8px_8px_0px_#000]">
              <p className="text-white/50 font-black uppercase italic text-xl tracking-widest">No Matchups Posted Yet.</p>
            </div>
          ) : (
            games.map((game) => {
              
              // ==========================================
              // COMPACT LIVE SCOREBUG
              // ==========================================
              if (game.status === 'IN_PROGRESS') {
                const liveState = game.liveState ? JSON.parse(game.liveState) : null;

                const isTopInning = liveState?.isTopInning ?? true;
                const inning = liveState?.inning ?? 1;
                const outs = liveState?.outs ?? 0;
                const balls = liveState?.balls ?? 0;
                const strikes = liveState?.strikes ?? 0;
                const baseRunners = liveState?.baseRunners ?? [null, null, null];
                const homeScore = game?.homeScore ?? liveState?.homeScore ?? 0;
                const awayScore = game?.awayScore ?? liveState?.awayScore ?? 0;

                return (
                  <Link 
                    key={game.id} 
                    href={`/games/${game.id}/feed`} 
                    className="group bg-[#001d3d] border-4 border-[#22c55e] shadow-[6px_6px_0px_#22c55e] hover:-translate-y-1 hover:shadow-[8px_8px_0px_#22c55e] transition-all flex flex-col h-full relative overflow-hidden"
                  >
                    {/* Header */}
                    <div className="bg-[#22c55e] text-[#001d3d] px-3 py-2 flex justify-between items-center border-b-4 border-[#001d3d]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#001d3d] animate-pulse"></span>
                        <span className="font-black italic uppercase text-[10px] tracking-widest leading-none">On Air</span>
                      </div>
                      <span className="font-black uppercase text-[10px] tracking-widest leading-none">Field {game.fieldNumber || '1'}</span>
                    </div>

                    {/* Teams & Scores */}
                    <div className="flex flex-col flex-1">
                      <div className={`flex justify-between items-center px-4 py-4 border-b-4 border-[#001d3d]/20 flex-1 ${isTopInning ? 'bg-[#ffd60a]/10' : ''}`}>
                         <div className="flex items-center gap-3 min-w-0 pr-2">
                           <span className="w-8 h-8 bg-[#c1121f] text-white flex items-center justify-center font-black italic border-2 border-[#001d3d] shadow-[2px_2px_0px_#000] shrink-0 text-sm">
                             {game.awayTeam?.name?.substring(0,1)}
                           </span>
                           <span className="text-xl font-black italic uppercase text-white truncate">{game.awayTeam?.name}</span>
                         </div>
                         <span className="text-4xl font-black text-[#ffd60a] italic">{awayScore}</span>
                      </div>
                      <div className={`flex justify-between items-center px-4 py-4 flex-1 ${!isTopInning ? 'bg-[#ffd60a]/10' : ''}`}>
                         <div className="flex items-center gap-3 min-w-0 pr-2">
                           <span className="w-8 h-8 bg-[#001d3d] text-white flex items-center justify-center font-black italic border-2 border-white shadow-[2px_2px_0px_#c1121f] shrink-0 text-sm">
                             {game.homeTeam?.name?.substring(0,1)}
                           </span>
                           <span className="text-xl font-black italic uppercase text-white truncate">{game.homeTeam?.name}</span>
                         </div>
                         <span className="text-4xl font-black text-[#ffd60a] italic">{homeScore}</span>
                      </div>
                    </div>

                    {/* Game State Bar (Bases, Count, Outs, Inning) */}
                    <div className="bg-[#001d3d] border-t-4 border-[#22c55e] p-3 flex justify-between items-center mt-auto shadow-inner">
                      {/* Bases */}
                      <div className="relative w-10 h-10 shrink-0 mx-2">
                          {[1, 2, 0].map(idx => (
                            <div key={idx} className={`absolute ${idx===1?'top-0 left-1/2 -translate-x-1/2':idx===2?'top-1/2 left-0 -translate-y-1/2':'top-1/2 right-0 -translate-y-1/2'} w-3.5 h-3.5 rotate-45 border-2 border-white/30 ${baseRunners[idx] ? 'bg-[#ffd60a] border-white shadow-[0_0_5px_#ffd60a]' : ''}`}></div>
                          ))}
                      </div>

                      {/* Count & Outs */}
                      <div className="flex flex-col items-center justify-center">
                         <div className="text-xl font-black text-[#ffd60a] italic leading-none">{balls}-{strikes}</div>
                         <div className="flex gap-1.5 mt-1.5">
                           <div className={`w-2.5 h-2.5 rounded-full border-2 border-white ${outs > 0 ? 'bg-[#c1121f]' : ''}`}></div>
                           <div className={`w-2.5 h-2.5 rounded-full border-2 border-white ${outs > 1 ? 'bg-[#c1121f]' : ''}`}></div>
                         </div>
                      </div>

                      {/* Inning */}
                      <div className="text-right">
                        <span className="text-[9px] font-black uppercase text-[#669bbc] tracking-widest block leading-none mb-1">Inning</span>
                        <span className="text-3xl font-black italic text-white leading-none">{isTopInning ? '▲' : '▼'}{inning}</span>
                      </div>
                    </div>

                    {/* Footer Link */}
                    <div className="bg-[#22c55e] text-[#001d3d] text-center py-2.5 font-black italic uppercase tracking-widest text-[10px] border-t-4 border-[#001d3d] group-hover:bg-white transition-colors">
                      Open Live Feed →
                    </div>
                  </Link>
                );
              }

              // ==========================================
              // THE STANDARD GAME CARD (Upcoming/Completed)
              // ==========================================
              
              const GameCardContent = (
                <>
                  <div className="bg-[#001d3d] text-white p-2 md:p-3 flex justify-between items-center border-b-4 border-[#c1121f]">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#ffd60a]">
                      {new Date(game.scheduledAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                    <div className="flex gap-2 items-center">
                      {game.isPlayoff && (
                        <span className="text-[8px] font-black uppercase text-[#c1121f] tracking-widest bg-white px-1">Elim</span>
                      )}
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#669bbc]">Field {game.fieldNumber || '1'}</span>
                    </div>
                  </div>

                  <div className="bg-[#fdf0d5] p-4 md:p-6 flex items-center justify-between gap-3 flex-1">
                    <div className="text-center flex-1 min-w-0">
                      <h2 className="text-base md:text-lg font-black italic uppercase break-words leading-tight mb-1 text-[#001d3d]">
                        {game.awayTeam?.name || 'TBD'}
                      </h2>
                      <p className="text-[8px] md:text-[9px] font-bold text-[#669bbc] uppercase tracking-[0.2em]">Away</p>
                    </div>
                    <div className="text-sm md:text-base font-black italic text-[#c1121f] shrink-0">@</div>
                    <div className="text-center flex-1 min-w-0">
                      <h2 className="text-base md:text-lg font-black italic uppercase break-words leading-tight mb-1 text-[#001d3d]">
                        {game.homeTeam?.name || 'TBD'}
                      </h2>
                      <p className="text-[8px] md:text-[9px] font-bold text-[#c1121f] uppercase tracking-[0.2em]">Home</p>
                    </div>
                  </div>

                  <div className="bg-white p-4 text-center border-t-4 border-[#001d3d] mt-auto relative">
                    {game.status === 'COMPLETED' ? (
                      <>
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-3xl font-black italic text-[#001d3d] tracking-tighter leading-none">
                            {game.awayScore} - {game.homeScore}
                          </span>
                          <span className="text-[9px] font-black uppercase text-[#c1121f] tracking-widest bg-[#fdf0d5] px-2 py-1 border-2 border-[#c1121f]">Final</span>
                        </div>
                        {/* Hover instruction for completed games */}
                        <div className="absolute inset-0 bg-[#c1121f] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-black italic uppercase tracking-widest text-sm">View Box Score →</span>
                        </div>
                      </>
                    ) : (
                      <div className="px-4 py-2 border-2 font-black italic uppercase text-[10px] tracking-[0.2em] inline-block bg-slate-100 text-[#001d3d] border-[#001d3d]">
                        Upcoming
                      </div>
                    )}
                  </div>
                </>
              );

              // If completed, make the whole card a clickable link to the box score
              if (game.status === 'COMPLETED') {
                 return (
                   <Link 
                     key={game.id} 
                     href={`/games/${game.id}`} 
                     className="group bg-white border-4 border-[#001d3d] shadow-[6px_6px_0px_#000] hover:shadow-[8px_8px_0px_#c1121f] hover:-translate-y-1 transition-all flex flex-col h-full cursor-pointer relative overflow-hidden"
                   >
                     {GameCardContent}
                   </Link>
                 );
              }

              // Otherwise, just render the card as a non-clickable block
              return (
                <div 
                  key={game.id} 
                  className="group bg-white border-4 border-[#001d3d] shadow-[6px_6px_0px_#000] transition-all flex flex-col h-full"
                >
                  {GameCardContent}
                </div>
              );
            })
          )}
        </div>

        <footer className="mt-16 text-center border-t-4 border-[#ffd60a]/20 pt-8">
          <p className="text-[9px] font-black uppercase text-[#669bbc] tracking-[0.4em]">
            Powered by WIFF+ // Gameday Information Center
          </p>
        </footer>
      </div>
    </div>
  );
}