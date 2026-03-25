'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// 1. Extract the main logic into a sub-component
function ActiveGamesContent() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const searchParams = useSearchParams();
  const leagueId = searchParams.get('leagueId');

  // --- BACK BUTTON FIX ---
  // If we have a league ID, go to that specific league. Otherwise, return to the Master Hub.
  const backUrl = leagueId ? `/admin/leagues/${leagueId}` : `/admin/dashboard`;
  const backText = leagueId ? "← Back to League Hub" : "← Back to Dashboard";

  useEffect(() => {
    async function fetchActive() {
      try {
        const url = leagueId 
          ? `/api/admin/games/active?leagueId=${leagueId}` 
          : `/api/admin/games/active`;

        const res = await fetch(url);
        if (res.ok) {
          setGames(await res.json());
        }
      } catch (err) {
        console.error("Failed to load games", err);
      } finally {
        setLoading(false);
      }
    }
    fetchActive();
  }, [leagueId]);

  if (loading) return (
    <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black text-white animate-pulse italic text-2xl uppercase">
      SYNCING SCOREBOARDS...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-16 border-b-4 border-[#669bbc] pb-8">
          <Link href={backUrl} className="text-[10px] font-black uppercase text-[#ffd60a] tracking-widest hover:text-white transition-colors mb-4 block">
            {backText}
          </Link>
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f] leading-none">
            {leagueId && games.length > 0 ? `${games[0].season?.league?.name} Live` : 'Live Action'}
          </h1>
        </header>

        {games.length === 0 ? (
          <div className="bg-black/30 border-4 border-dashed border-white/10 p-20 text-center shadow-[8px_8px_0px_#000]">
            <p className="text-2xl font-black italic uppercase text-[#fdf0d5]/50 tracking-widest">No active games found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {games.map(game => (
              <div key={game.id} className="bg-white border-4 border-[#001d3d] p-8 shadow-[12px_12px_0px_#c1121f] text-[#001d3d] hover:-translate-y-1 hover:shadow-[16px_16px_0px_#ffd60a] transition-all">
                <div className="flex justify-between items-center mb-6 font-black uppercase italic text-xs border-b border-[#001d3d]/10 pb-2">
                  <span>Field {game.fieldNumber || '1'}</span>
                  <span className="text-[#c1121f]">{game.season?.name}</span>
                </div>
                <div className="flex justify-between items-center mb-8 text-center">
                  <div className="flex-1">
                    <p className="text-3xl font-black italic uppercase">{game.awayTeam.name}</p>
                    <p className="text-5xl font-black">{game.awayScore}</p>
                  </div>
                  <div className="px-4 text-xl font-black italic text-[#c1121f]">VS</div>
                  <div className="flex-1">
                    <p className="text-3xl font-black italic uppercase">{game.homeTeam.name}</p>
                    <p className="text-5xl font-black">{game.homeScore}</p>
                  </div>
                </div>
                <Link href={`/games/${game.id}/live?source=admin`} className="block w-full bg-[#001d3d] text-white py-4 text-center font-black uppercase italic tracking-widest hover:bg-[#c1121f] transition-colors shadow-[4px_4px_0px_#000]">
                  Resume Scoring
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 2. Wrap the export in Suspense to satisfy Next.js build requirements
export default function ActiveGames() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black text-white animate-pulse italic text-2xl uppercase border-[12px] border-[#c1121f]">
        INITIALIZING FEED...
      </div>
    }>
      <ActiveGamesContent />
    </Suspense>
  );
}