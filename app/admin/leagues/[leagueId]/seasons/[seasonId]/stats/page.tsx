'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function SeasonLeaderboard({ params }: { params: Promise<{ leagueId: string, seasonId: string }> }) {
  const { leagueId, seasonId } = use(params);
  const [stats, setStats] = useState<{batters: any[], pitchers: any[]}>({ batters: [], pitchers: [] });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'batters' | 'pitchers'>('batters');
  const [sortConfig, setSortConfig] = useState({ key: 'ops', direction: 'desc' });

  useEffect(() => {
    fetch(`/api/admin/seasons/${seasonId}/stats`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setStats({ batters: data.batters || [], pitchers: data.pitchers || [] });
        setLoading(false);
      });
  }, [seasonId]);

  const handleSort = (key: string) => {
    setSortConfig({ key, direction: sortConfig.key === key && sortConfig.direction === 'desc' ? 'asc' : 'desc' });
  };

  const getSortedData = () => {
    const data = viewMode === 'batters' ? [...stats.batters] : [...stats.pitchers];
    return data.sort((a, b) => {
      const aVal = parseFloat(a[sortConfig.key]) || a[sortConfig.key];
      const bVal = parseFloat(b[sortConfig.key]) || b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const Th = ({ label, k, highlight = false }: any) => (
    <th onClick={() => handleSort(k)} className={`p-4 font-black italic uppercase cursor-pointer hover:bg-white/10 text-center ${highlight ? 'text-[#ffd60a]' : 'text-[#fdf0d5]/70'}`}>
      {label} {sortConfig.key === k ? (sortConfig.direction === 'desc' ? '↓' : '↑') : <span className="opacity-20">↕</span>}
    </th>
  );

  if (loading) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center text-white font-black italic">LOADING DATA...</div>;

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-[95%] mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between border-b-4 border-[#669bbc] pb-8 gap-6">
          <div>
            <Link href={`/admin/leagues/${leagueId}/seasons/${seasonId}`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white mb-4 block">
              ← Back to Terminal
            </Link>
            <h1 className="text-6xl md:text-7xl font-black italic uppercase text-white drop-shadow-[4px_4px_0px_#c1121f]">Leaderboard</h1>
          </div>

          {/* TOGGLE SWITCH */}
          <div className="flex bg-[#003566] border-2 border-[#669bbc] rounded-full p-1 shadow-xl">
            <button 
              onClick={() => { setViewMode('batters'); setSortConfig({ key: 'ops', direction: 'desc' }); }}
              className={`px-8 py-3 rounded-full font-black italic uppercase tracking-widest text-sm transition-all ${viewMode === 'batters' ? 'bg-[#c1121f] text-white shadow-md' : 'text-[#669bbc] hover:text-white'}`}
            >
              Batting
            </button>
            <button 
              onClick={() => { setViewMode('pitchers'); setSortConfig({ key: 'era', direction: 'asc' }); }}
              className={`px-8 py-3 rounded-full font-black italic uppercase tracking-widest text-sm transition-all ${viewMode === 'pitchers' ? 'bg-[#c1121f] text-white shadow-md' : 'text-[#669bbc] hover:text-white'}`}
            >
              Pitching
            </button>
          </div>
        </header>

        <div className="bg-[#003566] border-2 border-[#669bbc] overflow-x-auto shadow-2xl">
          <table className="w-full text-center border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[#c1121f] text-white">
                <th onClick={() => handleSort('name')} className="p-4 text-left font-black italic uppercase cursor-pointer hover:bg-white/10">
                  PLAYER {sortConfig.key === 'name' ? (sortConfig.direction === 'desc' ? '↓' : '↑') : <span className="opacity-20">↕</span>}
                </th>
                {/* G IS FIXED AS THE FIRST STAT COLUMN HERE */}
                <Th label="G" k="g" />
                
                {viewMode === 'batters' ? (
                  <>
                    <Th label="PA" k="pa" /><Th label="AB" k="ab" /><Th label="H" k="h" />
                    <Th label="2B" k="double" /><Th label="3B" k="triple" /><Th label="HR" k="hr" />
                    <Th label="BB" k="bb" /><Th label="K" k="k" /><Th label="AVG" k="avg" highlight />
                    <Th label="OBP" k="obp" highlight /><Th label="OPS" k="ops" highlight />
                  </>
                ) : (
                  <>
                    <Th label="W" k="w" /><Th label="L" k="l" /><Th label="SHO" k="sho" />
                    <Th label="SV" k="sv" /><Th label="IP" k="outs" /><Th label="H" k="h" />
                    <Th label="R" k="r" /><Th label="ER" k="er" /><Th label="HR" k="hr" />
                    <Th label="BB" k="bb" /><Th label="K" k="k" /><Th label="ERA" k="era" highlight />
                    <Th label="WHIP" k="whip" highlight /><Th label="BBpG" k="bbpg" /><Th label="KpG" k="kpg" />
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#001d3d]">
              {getSortedData().map((p, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-left font-bold uppercase text-lg text-white whitespace-nowrap">
                    <span className="text-[#669bbc] font-black text-[10px] mr-3">{i + 1}.</span> 
                    {p.name}
                  </td>
                  
                  {/* G ROW FIXED HERE */}
                  <td className="p-4 font-bold text-white">{p.g}</td>
                  
                  {viewMode === 'batters' ? (
                    <>
                      <td className="p-4 font-bold text-[#669bbc]">{p.pa}</td>
                      <td className="p-4 font-bold text-[#669bbc]">{p.ab}</td>
                      <td className="p-4 font-bold text-white">{p.h}</td>
                      <td className="p-4 font-bold text-white">{p.double}</td>
                      <td className="p-4 font-bold text-white">{p.triple}</td>
                      <td className="p-4 font-bold text-white">{p.hr}</td>
                      <td className="p-4 font-bold text-slate-400">{p.bb}</td>
                      <td className="p-4 font-bold text-red-400">{p.k}</td>
                      <td className="p-4 font-black text-[#ffd60a] text-xl">{p.avg}</td>
                      <td className="p-4 font-black text-[#ffd60a] text-xl">{p.obp}</td>
                      <td className="p-4 font-black text-[#ffd60a] text-xl">{p.ops}</td>
                    </>
                  ) : (
                    <>
                      <td className="p-4 font-bold text-white">{p.w}</td>
                      <td className="p-4 font-bold text-white">{p.l}</td>
                      <td className="p-4 font-bold text-[#669bbc]">{p.sho}</td>
                      <td className="p-4 font-bold text-[#669bbc]">{p.sv}</td>
                      <td className="p-4 font-bold text-white">{p.ip}</td>
                      <td className="p-4 font-bold text-[#669bbc]">{p.h}</td>
                      <td className="p-4 font-bold text-red-400">{p.r}</td>
                      <td className="p-4 font-bold text-white">{p.er}</td>
                      <td className="p-4 font-bold text-white">{p.hr}</td>
                      <td className="p-4 font-bold text-slate-400">{p.bb}</td>
                      <td className="p-4 font-bold text-red-400">{p.k}</td>
                      <td className="p-4 font-black text-[#ffd60a] text-xl">{p.era}</td>
                      <td className="p-4 font-black text-[#ffd60a] text-xl">{p.whip}</td>
                      <td className="p-4 font-bold text-[#669bbc]">{p.bbpg}</td>
                      <td className="p-4 font-bold text-[#669bbc]">{p.kpg}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}