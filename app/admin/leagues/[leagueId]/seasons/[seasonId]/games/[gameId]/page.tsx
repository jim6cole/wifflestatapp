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

  // EXACT PUBLIC PAGE DATA FETCHING
  useEffect(() => {
    if (!gameId) return;
    async function load() {
      const [gRes, sRes] = await Promise.all([
        fetch(`/api/games/${gameId}/setup`),
        fetch(`/api/games/${gameId}/box-score`)
      ]);
      setGame(await gRes.json());
      setStats(await sRes.json());
      setLoading(false);
    }
    load();
  }, [gameId]);

  if (loading || !game || !stats) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center text-white animate-pulse uppercase font-black italic text-2xl">Loading Box Score...</div>;

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] p-4 md:p-8 font-sans border-[12px] border-[#c1121f]">
      <div className="max-w-5xl mx-auto">
        
        {/* --- ADMIN NAVIGATION --- */}
        <div className="mb-8 flex justify-between items-center">
          <Link 
            href={`/admin/leagues/${leagueId}/seasons/${seasonId}/history`} 
            className="group flex items-center gap-2 w-fit"
          >
            <div className="bg-white text-[#001d3d] p-1.5 border-2 border-[#c1121f] skew-x-[-12deg] group-hover:bg-[#ffd60a] transition-colors shadow-[4px_4px_0px_#c1121f]">
              <span className="text-[10px] font-black uppercase italic tracking-tighter block skew-x-[12deg]">
                ← Back to Archives
              </span>
            </div>
          </Link>

          <Link 
            href={`/admin/leagues/${leagueId}/seasons/${seasonId}/history/${gameId}`} 
            className="bg-[#c1121f] text-white px-6 py-2 font-black italic uppercase shadow-[4px_4px_0px_#ffd60a] hover:bg-white hover:text-[#001d3d] transition-colors text-[10px]"
          >
            Audit Play-by-Play →
          </Link>
          
          <Link 
          href={`/admin/leagues/${leagueId}/seasons/${seasonId}/manual-override/${gameId}`}
          className="bg-[#ffd60a] text-[#001d3d] font-black italic uppercase px-4 py-2 border-2 border-[#001d3d] shadow-[4px_4px_0px_#c1121f] hover:bg-white transition-colors"
          >
          Manual Box Score Override
          </Link>
        </div>

        {/* --- MAIN HEADER (1:1 EXACT PUBLIC CLONE) --- */}
        <header className="bg-white p-6 border-4 border-[#001d3d] shadow-[8px_8px_0px_#c1121f] mb-12 text-[#001d3d]">
          <div className="flex justify-between items-center text-center mb-10">
            <div className="flex-1">
              <h2 className="text-2xl font-black uppercase italic">{game.awayTeam.name}</h2>
              <span className="text-7xl font-black text-[#c1121f]">{game.awayScore}</span>
            </div>
            <div className="px-10 font-black italic text-xl tracking-tighter">
              {game.status === 'COMPLETED' ? 'FINAL' : game.status}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black uppercase italic">{game.homeTeam.name}</h2>
              <span className="text-7xl font-black text-[#c1121f]">{game.homeScore}</span>
            </div>
          </div>

          {/* INNING GRID */}
          <div className="overflow-x-auto border-t-2 border-black/5 pt-6">
            <table className="w-full text-center font-black uppercase italic text-[11px] border-collapse">
              <thead>
                <tr className="text-[#669bbc] tracking-widest">
                  <th className="text-left pr-4">TEAM</th>
                  {stats.lineScore?.map((s: any) => <th key={s.inning} className="px-2">{s.inning}</th>)}
                  <th className="pl-6 text-[#001d3d]">R</th>
                  <th className="px-2 text-[#001d3d]">H</th>
                  <th className="px-2 text-[#001d3d]">E</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-black/5">
                  <td className="text-left font-bold pr-4">{game.awayTeam.name.substring(0,3)}</td>
                  {stats.lineScore?.map((s: any) => <td key={s.inning} className="px-2 text-slate-400">{s.away}</td>)}
                  <td className="pl-6 text-2xl text-[#c1121f]">{game.awayScore}</td>
                  <td className="px-2 text-xl">{stats.totals?.awayH || 0}</td>
                  <td className="px-2 text-xl text-slate-400">{stats.totals?.awayE || 0}</td>
                </tr>
                <tr>
                  <td className="text-left font-bold pr-4">{game.homeTeam.name.substring(0,3)}</td>
                  {stats.lineScore?.map((s: any) => <td key={s.inning} className="px-2 text-slate-400">{s.home}</td>)}
                  <td className="pl-6 text-2xl text-[#c1121f]">{game.homeScore}</td>
                  <td className="px-2 text-xl">{stats.totals?.homeH || 0}</td>
                  <td className="px-2 text-xl text-slate-400">{stats.totals?.homeE || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </header>

        {/* --- STAT TABLES (1:1 EXACT PUBLIC CLONE) --- */}
        <section className="space-y-16">
          <div className="space-y-8">
            <BoxScoreTable 
              stats={stats.away.batters} 
              teamName={game.awayTeam.name} 
              hrDetails={stats.hrEvents.filter((hr: any) => hr.teamId === game.awayTeamId)} 
            />
            <PitchingBoxScoreTable stats={stats.away.pitchers} teamName={game.awayTeam.name} />
          </div>
          
          <div className="space-y-8">
            <BoxScoreTable 
              stats={stats.home.batters} 
              teamName={game.homeTeam.name} 
              hrDetails={stats.hrEvents.filter((hr: any) => hr.teamId === game.homeTeamId)} 
            />
            <PitchingBoxScoreTable stats={stats.home.pitchers} teamName={game.homeTeam.name} />
          </div>
        </section>
      </div>
    </div>
  );
}