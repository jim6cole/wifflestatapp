'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import BoxScoreTable from '@/components/stats/BoxScoreTable';
import PitchingBoxScoreTable from '@/components/stats/PitchingBoxScoreTable';

export default function PublicBoxScorePage() {
  const { id } = useParams();
  const [game, setGame] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // Fetch both game metadata and detailed box score stats
    const fetchGame = fetch(`/api/games?gameId=${id}`).then(res => res.json());
    const fetchStats = fetch(`/api/games/${id}/box-score`).then(res => res.json());

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
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black italic text-white text-2xl animate-pulse uppercase">
      Opening the Scorebook...
    </div>
  );

  if (!game || game.error) return (
    <div className="min-h-screen bg-[#001d3d] text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-black italic uppercase text-[#c1121f] mb-4">Game Not Found</h1>
      <Link href="/stats/global" className="bg-white text-[#001d3d] px-8 py-3 font-black uppercase tracking-widest hover:bg-[#ffd60a] transition-colors">
        Return to Leaders
      </Link>
    </div>
  );

  // Extract team IDs for cleaner filtering
  const awayId = game.awayTeamId;
  const homeId = game.homeTeamId;

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] border-[12px] md:border-[16px] border-[#001d3d] p-4 md:p-8 relative">
      <div className="max-w-6xl mx-auto">
        
        {/* --- NAVIGATION --- */}
        <Link href={`/leagues/${game.season?.leagueId}/history/${game.seasonId}`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#ffd60a] transition-colors mb-6 inline-block">
          ← Back to Season Archives
        </Link>

        {/* --- COMPACT RESPONSIVE SCOREBOARD --- */}
        <header className="bg-white p-4 md:p-6 border-4 border-[#001d3d] shadow-[6px_6px_0px_#c1121f] md:shadow-[8px_8px_0px_#c1121f] mb-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
            
            {/* Away Team */}
            <div className="text-center flex-1 w-full min-w-0">
              <p className="text-[#669bbc] font-black uppercase text-[9px] tracking-widest mb-1 italic">Visitors</p>
              <h2 className="text-lg md:text-2xl font-black italic uppercase text-[#001d3d] leading-tight mb-2 px-2 whitespace-normal break-words">
                {game.awayTeam?.name}
              </h2>
              <span className="text-5xl md:text-7xl font-black text-[#c1121f] leading-none drop-shadow-[3px_3px_0px_#001d3d]">
                {game.awayScore}
              </span>
            </div>

            {/* FINAL Badge */}
            <div className="flex flex-col items-center justify-center shrink-0 py-2 md:py-0">
              <div className="bg-[#001d3d] text-[#ffd60a] px-3 py-1 border-2 border-[#c1121f] skew-x-[-12deg] shadow-[3px_3px_0px_#c1121f]">
                <span className="text-sm md:text-lg font-black italic uppercase tracking-tighter">FINAL</span>
              </div>
              <p className="text-[8px] md:text-[9px] font-bold text-[#001d3d] uppercase tracking-[0.2em] mt-2 italic opacity-60">
                {new Date(game.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {/* Home Team */}
            <div className="text-center flex-1 w-full min-w-0">
              <p className="text-[#669bbc] font-black uppercase text-[9px] tracking-widest mb-1 italic">Home</p>
              <h2 className="text-lg md:text-2xl font-black italic uppercase text-[#001d3d] leading-tight mb-2 px-2 whitespace-normal break-words">
                {game.homeTeam?.name}
              </h2>
              <span className="text-5xl md:text-7xl font-black text-[#c1121f] leading-none drop-shadow-[3px_3px_0px_#001d3d]">
                {game.homeScore}
              </span>
            </div>
          </div>
        </header>

        {/* --- STAT TABLES (SAFE FILTERING) --- */}
        <div className="space-y-12">
          
          {/* Away Team Section */}
          <section className="space-y-6">
            <BoxScoreTable 
              stats={(stats?.batters || []).filter((b: any) => b.teamId === awayId)} 
              teamName={game.awayTeam?.name || "Visitors"} 
              isAdmin={false} 
              hrDetails={(stats?.hrEvents || []).filter((hr: any) => hr.teamId === awayId)}
            />
            <PitchingBoxScoreTable 
              stats={(stats?.pitchers || []).filter((p: any) => p.teamId === awayId)} 
              teamName={game.awayTeam?.name || "Visitors"} 
            />
          </section>

          <div className="h-[2px] bg-[#c1121f] w-full opacity-10"></div>

          {/* Home Team Section */}
          <section className="space-y-6">
            <BoxScoreTable 
              stats={(stats?.batters || []).filter((b: any) => b.teamId === homeId)} 
              teamName={game.homeTeam?.name || "Home"} 
              isAdmin={false} 
              hrDetails={(stats?.hrEvents || []).filter((hr: any) => hr.teamId === homeId)}
            />
            <PitchingBoxScoreTable 
              stats={(stats?.pitchers || []).filter((p: any) => p.teamId === homeId)} 
              teamName={game.homeTeam?.name || "Home"} 
            />
          </section>
        </div>

        {/* --- FOOTER --- */}
        <footer className="mt-12 text-center border-t-2 border-white/5 pt-6 opacity-30">
          <p className="text-[9px] font-black uppercase text-[#669bbc] tracking-[0.4em]">
            Official Gameday Log // Generated by WIFF+ Stats Engine
          </p>
        </footer>
      </div>
    </div>
  );
}