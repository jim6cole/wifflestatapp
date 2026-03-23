'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ActiveGamesLobby() {
  const router = useRouter();
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filters State
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('ALL');
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('ALL');

  useEffect(() => {
    async function fetchGames() {
      try {
        const res = await fetch('/api/admin/games/active', { cache: 'no-store' });
        if (res.ok) {
          setGames(await res.json());
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchGames();
  }, []);

  // Compute unique leagues for the filter
  const uniqueLeagues = Array.from(new Set(games.map(g => g.season?.leagueId))).map(leagueId => {
    const game = games.find(g => g.season?.leagueId === leagueId);
    return { id: leagueId, name: game?.season?.league?.name || 'Unknown League' };
  });

  // Compute unique seasons based on the selected league
  const filteredSeasons = Array.from(new Set(
    games
      .filter(g => selectedLeagueId === 'ALL' || g.season?.leagueId?.toString() === selectedLeagueId)
      .map(g => g.seasonId)
  )).map(seasonId => {
    const game = games.find(g => g.seasonId === seasonId);
    return { id: seasonId, name: game?.season?.name || 'Unknown Season' };
  });

  // Handle cascading filter resets
  const handleLeagueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLeagueId(e.target.value);
    setSelectedSeasonId('ALL'); // Reset season filter when league changes
  };

  // Filter the actual games
  const displayGames = games.filter(g => {
    const matchLeague = selectedLeagueId === 'ALL' || g.season?.leagueId?.toString() === selectedLeagueId;
    const matchSeason = selectedSeasonId === 'ALL' || g.seasonId?.toString() === selectedSeasonId;
    return matchLeague && matchSeason;
  });

  return (
    <div className="min-h-screen bg-[#fdf0d5] text-[#001d3d] p-8 md:p-16 border-[16px] border-[#001d3d]">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-12 border-b-8 border-[#c1121f] pb-8 flex flex-col lg:flex-row justify-between lg:items-end gap-6">
          <div>
            <button onClick={() => router.back()} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#c1121f] transition-colors mb-4 block text-left">
              ← Go Back
            </button>
            <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-[#001d3d] drop-shadow-[4px_4px_0px_#ffd60a] leading-none">
              Game Command
            </h1>
            <p className="text-[#c1121f] font-bold uppercase text-xs tracking-[0.4em] mt-3 italic">Active Deployments // WIFF+</p>
          </div>

          {/* DYNAMIC FILTERS */}
          <div className="flex flex-col sm:flex-row gap-4 bg-white border-4 border-[#001d3d] p-4 shadow-[8px_8px_0px_#ffd60a]">
            <div>
              <p className="text-[9px] font-black uppercase text-[#669bbc] mb-1">Filter Organization</p>
              <select 
                value={selectedLeagueId} 
                onChange={handleLeagueChange}
                className="bg-[#fdf0d5] border-2 border-[#001d3d] p-2 text-[#001d3d] font-black uppercase italic outline-none focus:border-[#c1121f] cursor-pointer text-sm w-full sm:w-48"
              >
                <option value="ALL">All Leagues</option>
                {uniqueLeagues.map(l => <option key={`league-${l.id}`} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            
            <div>
              <p className="text-[9px] font-black uppercase text-[#669bbc] mb-1">Filter Campaign</p>
              <select 
                value={selectedSeasonId} 
                onChange={(e) => setSelectedSeasonId(e.target.value)}
                className="bg-[#fdf0d5] border-2 border-[#001d3d] p-2 text-[#001d3d] font-black uppercase italic outline-none focus:border-[#c1121f] cursor-pointer text-sm w-full sm:w-48"
              >
                <option value="ALL">All Seasons</option>
                {filteredSeasons.map(s => <option key={`season-${s.id}`} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="text-center p-20 animate-pulse font-black uppercase italic text-2xl text-[#001d3d]">Scanning Airwaves...</div>
        ) : error ? (
           <div className="bg-white border-4 border-[#c1121f] p-10 text-center shadow-[12px_12px_0px_#c1121f]">
             <p className="text-3xl font-black italic uppercase text-[#c1121f] mb-2">Network Error</p>
             <p className="text-sm font-bold text-[#001d3d]">Failed to establish connection. Ensure the database is actively synced.</p>
           </div>
        ) : displayGames.length === 0 ? (
          <div className="bg-white border-4 border-dashed border-[#001d3d] p-20 text-center shadow-inner opacity-60">
            <p className="text-3xl font-black uppercase italic text-[#001d3d]">No Matches Found</p>
            <p className="text-sm font-bold mt-2 text-[#c1121f] uppercase tracking-widest">Adjust filters or generate a schedule in your League Hub.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {displayGames.map((game) => {
              const inProgress = game.status === 'IN_PROGRESS' || game.status === 'LIVE' || game.liveState;
              
              return (
              <div key={game.id} className={`bg-white border-4 ${inProgress ? 'border-[#ffd60a] shadow-[8px_8px_0px_#ffd60a]' : 'border-[#001d3d] shadow-[8px_8px_0px_#001d3d]'} p-6 md:p-8 flex flex-col md:flex-row justify-between items-center group hover:bg-[#fdf0d5] transition-all relative overflow-hidden`}>
                
                {/* LIVE INDICATOR */}
                {inProgress && (
                  <div className="absolute top-0 right-0 bg-[#ffd60a] text-[#001d3d] border-b-4 border-l-4 border-[#001d3d] text-[10px] font-black uppercase tracking-widest px-4 py-1">
                    Live / In-Progress
                  </div>
                )}

                <div className="w-full md:w-auto text-center md:text-left">
                  <p className="text-[10px] font-black uppercase text-[#669bbc] mb-1 tracking-widest">
                    <span className="text-[#c1121f]">{game.season?.league?.name}</span> // {game.season?.name}
                  </p>
                  <h2 className="text-4xl font-black italic uppercase text-[#001d3d]">
                    {game.awayTeam?.name || 'TBD'} <span className="text-[#c1121f] not-italic text-2xl mx-2 font-black">@</span> {game.homeTeam?.name || 'TBD'}
                  </h2>
                  <p className="text-sm font-bold uppercase text-slate-500 mt-2 tracking-widest">
                    {new Date(game.scheduledAt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
                
                {inProgress ? (
                  <Link 
                    href={`/games/${game.id}/live`}
                    className="mt-6 md:mt-0 w-full md:w-auto bg-[#ffd60a] text-[#001d3d] px-8 py-4 font-black italic uppercase tracking-widest border-4 border-[#001d3d] hover:bg-[#001d3d] hover:text-[#ffd60a] transition-all text-center group-hover:shadow-[4px_4px_0px_#001d3d] active:translate-y-1 active:shadow-none"
                  >
                    Resume Match →
                  </Link>
                ) : (
                  <Link 
                    href={`/admin/games/${game.id}/lineups`}
                    className="mt-6 md:mt-0 w-full md:w-auto bg-[#c1121f] text-white px-8 py-4 font-black italic uppercase tracking-widest border-4 border-[#001d3d] hover:bg-white hover:text-[#c1121f] transition-all text-center group-hover:shadow-[4px_4px_0px_#001d3d] active:translate-y-1 active:shadow-none"
                  >
                    Initialize Lineups →
                  </Link>
                )}
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}