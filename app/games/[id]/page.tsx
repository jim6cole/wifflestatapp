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
    async function load() {
      const [gRes, sRes] = await Promise.all([
        fetch(`/api/games/${id}/setup`),
        fetch(`/api/games/${id}/box-score`)
      ]);
      setGame(await gRes.json());
      setStats(await sRes.json());
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading || !game || !stats) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center text-white animate-pulse uppercase font-black italic text-2xl">Loading Box Score...</div>;

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* --- DYNAMIC BACK BUTTON TO SEASON HISTORY --- */}
        <div className="mb-8">
          <Link 
            href={`/leagues/${game.season?.leagueId}/history/${game.seasonId}`} 
            className="group flex items-center gap-2 w-fit"
          >
            <div className="bg-white text-[#001d3d] p-1.5 border-2 border-[#c1121f] skew-x-[-12deg] group-hover:bg-[#ffd60a] transition-colors shadow-[4px_4px_0px_#c1121f]">
              <span className="text-[10px] font-black uppercase italic tracking-tighter block skew-x-[12deg]">
                ← Back to Box Scores
              </span>
            </div>
          </Link>
        </div>

        {/* --- MAIN HEADER --- */}
        <header className="bg-white p-6 border-4 border-[#001d3d] shadow-[8px_8px_0px_#c1121f] mb-12 text-[#001d3d]">
          <div className="flex justify-between items-center text-center mb-10">
            <div className="flex-1">
              <h2 className="text-2xl font-black uppercase italic">{game.awayTeam.name}</h2>
              <span className="text-7xl font-black text-[#c1121f]">{game.awayScore}</span>
            </div>
            <div className="px-10 font-black italic text-xl tracking-tighter">FINAL</div>
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
                  {stats.lineScore.map((s: any) => <th key={s.inning} className="px-2">{s.inning}</th>)}
                  <th className="pl-6 text-[#001d3d]">R</th>
                  <th className="px-2 text-[#001d3d]">H</th>
                  <th className="px-2 text-[#001d3d]">E</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-black/5">
                  <td className="text-left font-bold pr-4">{game.awayTeam.name.substring(0,3)}</td>
                  {stats.lineScore.map((s: any) => <td key={s.inning} className="px-2 text-slate-400">{s.away}</td>)}
                  <td className="pl-6 text-2xl text-[#c1121f]">{game.awayScore}</td>
                  <td className="px-2 text-xl">{stats.totals.awayH}</td>
                  <td className="px-2 text-xl text-slate-400">{stats.totals.awayE}</td>
                </tr>
                <tr>
                  <td className="text-left font-bold pr-4">{game.homeTeam.name.substring(0,3)}</td>
                  {stats.lineScore.map((s: any) => <td key={s.inning} className="px-2 text-slate-400">{s.home}</td>)}
                  <td className="pl-6 text-2xl text-[#c1121f]">{game.homeScore}</td>
                  <td className="px-2 text-xl">{stats.totals.homeH}</td>
                  <td className="px-2 text-xl text-slate-400">{stats.totals.homeE}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </header>

        {/* --- STAT TABLES --- */}
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