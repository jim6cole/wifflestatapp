'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LineupConstructor({ params }: { params: Promise<{ gameId: string }> }) {
  // 1. Unwrap params safely
  const resolvedParams = use(params);
  const gameId = resolvedParams?.gameId;
  
  const router = useRouter();
  
  const [game, setGame] = useState<any>(null);
  const [lineups, setLineups] = useState<{ home: any[], away: any[] }>({ home: [], away: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) {
      setError("No Game ID found in URL.");
      setLoading(false);
      return;
    }

    async function init() {
      try {
        console.log(`Fetching data for Game ID: ${gameId}...`);
        const res = await fetch(`/api/admin/games/${gameId}/prepare`);
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`API Error (${res.status}): ${errorText}`);
        }
        
        const data = await res.json();
        console.log("API Response Data:", data);

        if (data && data.game) {
          setGame(data.game);
          // Set lineups from the rosters provided by the API
          setLineups({ 
            home: (data.homeRoster || []).map((p: any) => ({ ...p, isPitcher: false })), 
            away: (data.awayRoster || []).map((p: any) => ({ ...p, isPitcher: false })) 
          });
        } else {
          console.error("Data received but 'game' object is missing:", data);
          setError("The API returned data, but the game details are missing.");
        }
      } catch (err: any) {
        console.error("Initialization Failed:", err);
        setError(err.message || "Failed to connect to API.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [gameId]);

  const handlePlayBall = async () => {
    try {
      const res = await fetch(`/api/admin/games/${gameId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          homeLineup: lineups.home.map(p => ({ ...p, teamId: game.homeTeamId })), 
          awayLineup: lineups.away.map(p => ({ ...p, teamId: game.awayTeamId })) 
        }),
      });
      if (res.ok) router.push(`/admin/games/${gameId}/live`);
    } catch (error) {
      alert("Error starting game.");
    }
  };

  // --- RENDER GUARDS ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#001d3d] flex items-center justify-center">
        <div className="text-[#fdf0d5] font-black italic animate-pulse text-2xl uppercase">
          Initializing Construction...
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-[#001d3d] flex flex-col items-center justify-center text-[#fdf0d5] p-10 border-[12px] border-[#c1121f]">
        <h1 className="text-5xl font-black uppercase italic text-[#c1121f] mb-4">Setup Error</h1>
        <p className="text-xl font-bold bg-black/30 p-4 mb-8 border-l-4 border-[#c1121f]">
          {error || "Game object is null. Check API response."}
        </p>
        <div className="flex gap-4">
          <button onClick={() => window.location.reload()} className="bg-white text-[#001d3d] px-6 py-3 font-black uppercase italic">Retry</button>
          <Link href="/admin/games" className="bg-[#c1121f] text-white px-6 py-3 font-black uppercase italic border-2 border-white">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  // --- MAIN UI (Only reaches here if game is NOT null) ---
  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] p-4 md:p-8 border-[12px] border-[#c1121f]">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 border-b-4 border-[#669bbc] pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black italic uppercase text-white tracking-tighter">Lineup Constructor</h1>
            <p className="text-[#669bbc] font-bold uppercase text-xs">Game ID: {gameId}</p>
          </div>
          <button onClick={handlePlayBall} className="bg-[#c1121f] text-white px-8 py-4 font-black italic uppercase text-sm border-2 border-[#fdf0d5] hover:bg-white hover:text-[#c1121f] transition-all shadow-[6px_6px_0px_#003566]">
            PLAY BALL →
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {['away', 'home'].map((side) => {
            // Safety: if game.awayTeam doesn't exist, we fall back to a generic object to prevent crashing
            const team = (side === 'away' ? game.awayTeam : game.homeTeam) || { name: "Unknown Team" };
            const teamLineup = lineups[side as 'home' | 'away'] || [];

            return (
              <div key={side} className="space-y-4">
                <div className="flex justify-between items-center bg-[#669bbc] text-[#001d3d] px-4 py-2 skew-x-[-10deg]">
                  <h2 className="text-xl font-black italic uppercase skew-x-[10deg]">{team.name}</h2>
                </div>

                <div className="bg-[#003566] border-2 border-[#fdf0d5] p-4 min-h-[400px]">
                  {teamLineup.length === 0 && <p className="text-[#669bbc] italic opacity-50">Roster empty...</p>}
                  {teamLineup.map((p, idx) => (
                    <div key={`${side}-${p.id}`} className="bg-[#001d3d] p-4 mb-3 flex justify-between items-center border-2 border-[#669bbc]/50">
                      <div className="flex items-center gap-4">
                        <span className="text-[#c1121f] font-black italic text-xl">#{idx + 1}</span>
                        <p className="font-black uppercase text-lg text-white">{p.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}