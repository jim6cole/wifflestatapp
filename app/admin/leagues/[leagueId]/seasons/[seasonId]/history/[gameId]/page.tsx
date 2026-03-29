'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import BoxScoreTable from '@/components/stats/BoxScoreTable';
import PitchingBoxScoreTable from '@/components/stats/PitchingBoxScoreTable';

export default function StatCorrectionPage({ params }: { params: Promise<{ leagueId: string, seasonId: string, gameId: string }> }) {
  const { leagueId, seasonId, gameId } = use(params);
  
  const [game, setGame] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any>(null); // Kept separate for the editor
  const [loading, setLoading] = useState(true);

  const load = async () => {
    // Cache buster ensures when you edit a play, the box score grabs fresh stats
    const t = new Date().getTime();
    
    // EXACT SAME FETCH AS YOUR SUMMARY PAGE (plus the history data)
    const [gRes, sRes, hRes] = await Promise.all([
      fetch(`/api/games/${gameId}/setup?t=${t}`),
      fetch(`/api/games/${gameId}/box-score?t=${t}`),
      fetch(`/api/admin/games/${gameId}/history?t=${t}`)
    ]);
    
    setGame(await gRes.json());
    setStats(await sRes.json());
    setHistory(await hRes.json());
    setLoading(false);
  };

  useEffect(() => {
    if (!gameId) return;
    load();
  }, [gameId]);

  // When a play is edited, update the DB and refresh the page data
  const handleUpdate = async (atBatId: number, result: string, runs: string | number) => {
    const res = await fetch(`/api/admin/at-bats/${atBatId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result, runsScored: runs })
    });
    
    if (res.ok) {
      await load(); 
    }
  };

  if (loading || !game || !stats || !history) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center text-white animate-pulse uppercase font-black italic text-2xl">Loading Box Score...</div>;

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] p-4 md:p-8 font-sans border-[12px] border-[#c1121f]">
      <div className="max-w-5xl mx-auto">
        
        {/* --- ADMIN NAVIGATION --- */}
        <div className="mb-8 flex justify-between items-center">
          <Link 
            href={`/admin/leagues/${leagueId}/seasons/${seasonId}/games/${gameId}`} 
            className="group flex items-center gap-2 w-fit"
          >
            <div className="bg-white text-[#001d3d] p-1.5 border-2 border-[#c1121f] skew-x-[-12deg] group-hover:bg-[#ffd60a] transition-colors shadow-[4px_4px_0px_#c1121f]">
              <span className="text-[10px] font-black uppercase italic tracking-tighter block skew-x-[12deg]">
                ← Back to Summary
              </span>
            </div>
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

        {/* --- PLAY BY PLAY EDITOR SECTION --- */}
        <div className="mt-20 pt-10 border-t-8 border-[#ffd60a]/30">
          <h2 className="text-3xl font-black italic uppercase text-[#ffd60a] mb-6 border-b-2 border-white/20 pb-2">Raw Play Editor</h2>
          <div className="space-y-6">
            {!history.atBats || history.atBats.length === 0 ? (
              <div className="bg-black/30 border-4 border-dashed border-[#669bbc] p-20 text-center">
                <p className="text-2xl font-black italic uppercase text-white/20 tracking-widest">No plays recorded for this matchup.</p>
              </div>
            ) : (
              history.atBats.map((ab: any, idx: number) => (
                <div key={ab.id} className="bg-white border-4 border-[#c1121f] p-6 flex flex-col md:flex-row justify-between items-center text-[#001d3d] shadow-[10px_10px_0px_#000]">
                  <div className="flex gap-6 items-center">
                    <span className="text-4xl font-black italic text-[#669bbc]/20">#{idx + 1}</span>
                    <div>
                      {/* INNING & OUTS BADGES */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-[#001d3d] text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-tighter border border-[#c1121f]">
                          INN {ab.inning || '?'}
                        </span>
                        <span className="bg-[#ffd60a] text-[#001d3d] text-[9px] font-black px-2 py-0.5 uppercase tracking-tighter border border-[#001d3d]">
                          {ab.outs || 0} {ab.outs === 1 ? 'OUT' : 'OUTS'}
                        </span>
                      </div>

                     <p className="text-[10px] font-black uppercase text-[#c1121f]">{ab.isTopInning ? 'Away' : 'Home'}</p>
                      <p className="text-3xl font-black italic uppercase leading-none">{ab.batter?.name || 'Unknown'}</p>
                      <p className="text-[10px] font-bold uppercase text-slate-400 mt-1 italic">vs {ab.pitcher?.name || 'Unknown'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-6 md:mt-0">
                    <div className="flex flex-col">
                      <label className="text-[10px] font-black uppercase mb-1 tracking-widest text-[#669bbc]">Result</label>
                      <select 
                        defaultValue={ab.result} 
                        onChange={(e) => handleUpdate(ab.id, e.target.value, ab.runsScored)}
                        className="bg-[#fdf0d5] border-2 border-[#001d3d] p-3 font-black uppercase text-sm outline-none focus:border-[#ffd60a]"
                      >
                        <option value="SINGLE">Single</option>
                        <option value="DOUBLE">Double</option>
                        <option value="TRIPLE">Triple</option>
                        <option value="HR">Home Run</option>
                        <option value="OUT">Out</option>
                        <option value="GROUND OUT">Ground Out</option>
                        <option value="FLY OUT">Fly Out</option>
                        <option value="K">Strikeout</option>
                        <option value="WALK">Walk</option>
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[10px] font-black uppercase mb-1 tracking-widest text-[#669bbc]">Runs</label>
                      <input 
                        type="number" 
                        defaultValue={ab.runsScored} 
                        onBlur={(e) => handleUpdate(ab.id, ab.result, e.target.value)}
                        className="w-20 bg-[#fdf0d5] border-2 border-[#001d3d] p-3 font-black text-center text-sm outline-none focus:border-[#ffd60a]"
                      />
                    </div>
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