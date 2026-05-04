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
  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const [gRes, sRes, hRes] = await Promise.all([
        fetch(`/api/games/${id}/setup`),
        fetch(`/api/games/${id}/box-score`),
        fetch(`/api/admin/games/${id}/history`) // ⚡ Grabs the pitch-by-play log
      ]);
      setGame(await gRes.json());
      setStats(await sRes.json());
      setHistory(hRes.ok ? await hRes.json() : { atBats: [] });
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading || !game || !stats) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center text-white animate-pulse uppercase font-black italic text-2xl">Loading Box Score...</div>;

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* --- DYNAMIC BACK BUTTON TO SEASON HISTORY --- */}
        <div className="mb-8 flex justify-between items-center">
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

        {/* --- ⚡ PLAY BY PLAY LOG --- */}
        <div className="mt-20 pt-10 border-t-8 border-[#ffd60a]/30">
          <h2 className="text-3xl font-black italic uppercase text-[#ffd60a] mb-8 drop-shadow-md">Play-By-Play Log</h2>
          
          <div className="space-y-3">
            {!history?.atBats || history.atBats.length === 0 ? (
              <div className="bg-black/30 border-4 border-dashed border-[#669bbc] p-10 text-center">
                <p className="text-xl font-black italic uppercase text-white/20 tracking-widest">No plays recorded.</p>
              </div>
            ) : (
              history.atBats.map((ab: any, idx: number) => (
                <div key={ab.id} className="bg-white/5 border border-white/10 hover:bg-white/10 transition-colors p-4 flex flex-col md:flex-row justify-between items-center text-[#fdf0d5]">
                  
                  {/* Left Side: Matchup Info */}
                  <div className="flex gap-4 items-center w-full md:w-auto">
                    <span className="text-2xl font-black italic text-[#669bbc]/40 w-8 md:w-12">#{idx + 1}</span>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="bg-[#001d3d] text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-tighter border border-[#c1121f]">
                          INN {ab.inning}
                        </span>
                        <span className="bg-[#ffd60a] text-[#001d3d] text-[9px] font-black px-2 py-0.5 uppercase tracking-tighter border border-[#001d3d]">
                          {ab.isTopInning ? 'Top' : 'Bot'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">
                          {ab.outsAtStart} Outs
                        </span>
                      </div>
                      <p className="font-black italic text-lg uppercase">
                        {ab.batter?.name || 'Unknown'} 
                        <span className="text-xs text-[#669bbc] font-bold lowercase not-italic mx-2">vs</span> 
                        {ab.pitcher?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Result & Runs */}
                  <div className="flex items-center gap-6 mt-4 md:mt-0 w-full md:w-auto justify-end border-t border-white/10 md:border-t-0 pt-4 md:pt-0">
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#669bbc] mb-0.5">Result</p>
                      <p className={`font-black text-xl uppercase italic ${ab.result?.includes('HR') ? 'text-[#ffd60a]' : 'text-white'}`}>
                        {ab.result?.replace(/_/g, ' ') || 'UNKNOWN'}
                      </p>
                    </div>
                    
                    {ab.runsScored > 0 && (
                      <div className="bg-[#c1121f] text-white px-3 py-1 text-center border-2 border-[#001d3d] shadow-[2px_2px_0px_#000] min-w-[60px]">
                        <p className="text-[8px] font-black uppercase tracking-widest">Runs</p>
                        <p className="font-black text-xl italic">+{ab.runsScored}</p>
                      </div>
                    )}
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}