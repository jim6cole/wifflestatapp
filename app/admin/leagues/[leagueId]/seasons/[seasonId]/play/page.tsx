'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function PlayBallDashboard({ params }: { params: Promise<{ leagueId: string, seasonId: string }> }) {
  const { leagueId, seasonId } = use(params);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/games?seasonId=${seasonId}`)
      .then(res => res.json())
      .then(data => {
        const gamesArray = Array.isArray(data) ? data : [];
        
        // SORTING UPGRADE: Sort by Date/Time first, then by Field Number
        const sortedGames = [...gamesArray].sort((a, b) => {
          const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
          const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
          if (dateA !== dateB) return dateA - dateB;
          return (a.fieldNumber || 0) - (b.fieldNumber || 0);
        });
        
        setGames(sortedGames);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch games:", err);
        setLoading(false);
      });
  }, [seasonId]);

  if (loading) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black text-white animate-pulse italic text-4xl uppercase">Loading Gameday Board...</div>;

  const activeGames = games.filter(g => g.status === 'IN_PROGRESS' || g.status === 'LIVE');
  const upcomingGames = games.filter(g => g.status !== 'IN_PROGRESS' && g.status !== 'LIVE' && g.status !== 'COMPLETED');
  const completedGames = games.filter(g => g.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-[#001d3d] text-white p-8 md:p-12 border-[16px] border-[#c1121f]">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 border-b-4 border-[#22c55e] pb-6 flex justify-between items-end">
          <div>
            <Link href={`/admin/leagues/${leagueId}/seasons/${seasonId}`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#ffd60a] transition-colors mb-4 block">
              ← Back to Dugout
            </Link>
            <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter drop-shadow-[4px_4px_0px_#22c55e]">
              Play Ball
            </h1>
            <p className="text-[#669bbc] font-bold uppercase text-xs tracking-[0.4em] mt-2">Live Scorekeeper Terminal</p>
          </div>
          <div className="hidden md:block bg-[#22c55e] text-[#001d3d] px-6 py-3 font-black italic uppercase text-xl shadow-[6px_6px_0px_#ffffff]">
            Gameday Active
          </div>
        </header>

        <section className="mb-16">
          <h2 className="text-3xl font-black italic uppercase text-[#22c55e] mb-6 border-b-2 border-white/10 pb-2">Live Action</h2>
          {activeGames.length === 0 ? (
             <p className="text-slate-500 font-bold italic">No games currently in progress.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeGames.map(game => (
                <GameCard 
                  key={game.id} 
                  game={game} 
                  leagueId={leagueId} 
                  seasonId={seasonId} 
                />
              ))}
            </div>
          )}
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-black italic uppercase text-[#ffd60a] mb-6 border-b-2 border-white/10 pb-2">On Deck</h2>
          {upcomingGames.length === 0 ? (
             <p className="text-slate-500 font-bold italic">No upcoming games found for this season.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingGames.map(game => (
                <GameCard 
                  key={game.id} 
                  game={game} 
                  leagueId={leagueId} 
                  seasonId={seasonId} 
                  isUpcoming 
                />
              ))}
            </div>
          )}
        </section>

        {completedGames.length > 0 && (
          <section className="opacity-75">
            <h2 className="text-2xl font-black italic uppercase text-slate-400 mb-6 border-b-2 border-white/10 pb-2">In The Books</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {completedGames.map(game => (
                <div key={game.id} className="bg-white/5 border-2 border-slate-700 p-4 flex justify-between items-center">
                  <div className="font-bold uppercase text-sm text-slate-300">
                    {game.awayTeam?.name || 'Away'} <span className="text-[#669bbc] mx-1">@</span> {game.homeTeam?.name || 'Home'}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-xs">{game.awayScore ?? 0} - {game.homeScore ?? 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function GameCard({ 
  game, 
  leagueId, 
  seasonId, 
  isUpcoming = false 
}: { 
  game: any, 
  leagueId: string, 
  seasonId: string, 
  isUpcoming?: boolean 
}) {
  const targetUrl = isUpcoming 
    ? `/admin/games/${game.id}/lineups?leagueId=${leagueId}&seasonId=${seasonId}` 
    : `/games/${game.id}/live?source=admin`; 

  return (
    <Link href={targetUrl} className="group block h-full">
      <div className={`bg-black/40 border-4 transition-all duration-300 relative h-full flex flex-col ${
        isUpcoming 
          ? 'border-[#ffd60a] hover:bg-[#ffd60a] hover:text-[#001d3d] shadow-[8px_8px_0px_#ffd60a]' 
          : 'border-[#22c55e] hover:bg-[#22c55e] hover:text-[#001d3d] shadow-[8px_8px_0px_#22c55e]'
      }`}>
        <div className={`absolute -top-4 -right-4 border-4 font-black italic uppercase px-4 py-2 text-xl shadow-lg transition-colors ${
          isUpcoming ? 'bg-[#ffd60a] text-[#001d3d] border-[#001d3d] group-hover:bg-white' : 'bg-[#22c55e] text-[#001d3d] border-[#001d3d] group-hover:bg-white'
        }`}>
          Field {game.fieldNumber || '?'}
        </div>
        <div className="p-6 flex-1 flex flex-col">
          
          {/* NEW: Date & Time Header */}
          <div className="flex justify-between items-start mb-6 opacity-80 border-b-2 border-current/20 pb-4">
            <div className="text-[10px] font-black uppercase tracking-widest bg-current text-white/20 px-2 py-1 self-start mix-blend-difference">
              {game.status || 'SCHEDULED'}
            </div>
            {game.scheduledAt && (
              <div className="text-[10px] font-black uppercase tracking-widest text-right">
                {new Date(game.scheduledAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}<br/>
                {new Date(game.scheduledAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 mt-auto">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-black italic uppercase truncate pr-4">{game.awayTeam?.name || 'Away Team'}</span>
              {!isUpcoming && <span className="text-xl font-bold">{game.awayScore ?? 0}</span>}
            </div>
            <div className="w-full h-[2px] bg-current opacity-20 my-1"></div>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-black italic uppercase truncate pr-4">{game.homeTeam?.name || 'Home Team'}</span>
              {!isUpcoming && <span className="text-xl font-bold">{game.homeScore ?? 0}</span>}
            </div>
          </div>
        </div>
        <div className={`p-4 text-center font-black italic uppercase tracking-widest transition-colors ${
          isUpcoming ? 'bg-[#ffd60a]/10 group-hover:bg-transparent' : 'bg-[#22c55e]/10 group-hover:bg-transparent'
        }`}>
          {isUpcoming ? 'Set Lineups →' : 'Enter Scorebook →'}
        </div>
      </div>
    </Link>
  );
}