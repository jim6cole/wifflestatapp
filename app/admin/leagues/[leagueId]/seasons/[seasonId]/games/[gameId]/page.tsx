'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import BoxScoreTable from '@/components/stats/BoxScoreTable';
import PitchingBoxScoreTable from '@/components/stats/PitchingBoxScoreTable';

export default function AdminBoxScorePage({ params }: { params: Promise<{ leagueId: string, seasonId: string, gameId: string }> }) {
  const { leagueId, seasonId, gameId } = use(params);
  const [game, setGame] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;

    // Fetch both game metadata and detailed box score stats
    const fetchGame = fetch(`/api/games?gameId=${gameId}`).then(res => res.json());
    const fetchStats = fetch(`/api/games/${gameId}/box-score`).then(res => res.json());

    Promise.all([fetchGame, fetchStats])
      .then(([gameData, statsData]) => {
        setGame(gameData);
        setStats(statsData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load box score:", err);
        setLoading(false);
      });
  }, [gameId]);

  if (loading) return (
    <div className="min-h-screen bg-[#fdf0d5] flex items-center justify-center font-black italic text-[#001d3d] text-3xl animate-pulse uppercase border-[16px] border-[#001d3d]">
      Opening the Scorebook...
    </div>
  );

  if (!game || game.error) return (
    <div className="min-h-screen bg-[#fdf0d5] text-[#001d3d] flex flex-col items-center justify-center p-8 border-[16px] border-[#001d3d]">
      <h1 className="text-5xl font-black italic uppercase text-[#c1121f] mb-4">Game Not Found</h1>
      <Link href={`/admin/leagues/${leagueId}/seasons/${seasonId}/play`} className="bg-[#001d3d] text-white px-8 py-4 font-black uppercase italic shadow-[6px_6px_0px_#ffd60a] hover:bg-white hover:text-[#001d3d] transition-colors border-2 border-[#001d3d]">
        Return to Gameday Board
      </Link>
    </div>
  );

  const awayId = game.awayTeamId;
  const homeId = game.homeTeamId;

  return (
    <div className="min-h-screen bg-[#fdf0d5] text-[#001d3d] border-[16px] border-[#001d3d] p-4 md:p-8 relative">
      <div className="max-w-6xl mx-auto">
        
        {/* --- NAVIGATION --- */}
        <Link href={`/admin/leagues/${leagueId}/seasons/${seasonId}/play`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#c1121f] transition-colors mb-6 inline-block">
          ← Back to Gameday Board
        </Link>

        {/* --- SCOREBOARD HEADER --- */}
        <header className="bg-white p-4 md:p-6 border-4 border-[#001d3d] shadow-[8px_8px_0px_#ffd60a] mb-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
            
            <div className="text-center flex-1 w-full min-w-0">
              <p className="text-[#669bbc] font-black uppercase text-[9px] tracking-widest mb-1 italic">Visitors</p>
              <h2 className="text-lg md:text-3xl font-black italic uppercase text-[#001d3d] leading-tight mb-2 px-2">
                {game.awayTeam?.name}
              </h2>
              <span className="text-5xl md:text-7xl font-black text-[#c1121f] leading-none drop-shadow-[3px_3px_0px_#001d3d]">
                {game.awayScore}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center shrink-0 py-2 md:py-0">
              <div className="bg-[#001d3d] text-[#ffd60a] px-4 py-2 border-2 border-[#001d3d] skew-x-[-12deg] shadow-[4px_4px_0px_#c1121f]">
                <span className="text-sm md:text-xl font-black italic uppercase tracking-tighter">
                  {game.status === 'COMPLETED' ? 'FINAL' : game.status}
                </span>
              </div>
              <p className="text-[8px] md:text-[10px] font-bold text-[#c1121f] uppercase tracking-[0.2em] mt-3 italic">
                Game ID: {game.id}
              </p>
            </div>

            <div className="text-center flex-1 w-full min-w-0">
              <p className="text-[#669bbc] font-black uppercase text-[9px] tracking-widest mb-1 italic">Home</p>
              <h2 className="text-lg md:text-3xl font-black italic uppercase text-[#001d3d] leading-tight mb-2 px-2">
                {game.homeTeam?.name}
              </h2>
              <span className="text-5xl md:text-7xl font-black text-[#c1121f] leading-none drop-shadow-[3px_3px_0px_#001d3d]">
                {game.homeScore}
              </span>
            </div>
          </div>
        </header>

        {/* --- FULL BOX SCORE TABLES --- */}
        <div className="space-y-12">
          <section className="space-y-6">
            <BoxScoreTable 
              stats={(stats?.batters || []).filter((b: any) => b.teamId === awayId)} 
              teamName={game.awayTeam?.name || "Visitors"} 
              isAdmin={true} 
              hrDetails={(stats?.hrEvents || []).filter((hr: any) => hr.teamId === awayId)}
            />
            <PitchingBoxScoreTable 
              stats={(stats?.pitchers || []).filter((p: any) => p.teamId === awayId)} 
              teamName={game.awayTeam?.name || "Visitors"} 
            />
          </section>

          <div className="h-[4px] bg-[#001d3d] w-full opacity-20"></div>

          <section className="space-y-6">
            <BoxScoreTable 
              stats={(stats?.batters || []).filter((b: any) => b.teamId === homeId)} 
              teamName={game.homeTeam?.name || "Home"} 
              isAdmin={true} 
              hrDetails={(stats?.hrEvents || []).filter((hr: any) => hr.teamId === homeId)}
            />
            <PitchingBoxScoreTable 
              stats={(stats?.pitchers || []).filter((p: any) => p.teamId === homeId)} 
              teamName={game.homeTeam?.name || "Home"} 
            />
          </section>
        </div>
        
        {/* --- FRONT OFFICE ACTIONS --- */}
        <div className="mt-16 flex justify-center gap-6 border-t-4 border-[#001d3d]/10 pt-8">
          <Link 
            href={`/admin/leagues/${leagueId}/seasons/${seasonId}/history/${gameId}`} 
            className="bg-[#c1121f] text-white px-8 py-4 font-black italic uppercase shadow-[6px_6px_0px_#001d3d] border-2 border-[#001d3d] hover:bg-white hover:text-[#c1121f] transition-colors"
          >
            Audit Play-by-Play →
          </Link>
        </div>

      </div>
    </div>
  );
}