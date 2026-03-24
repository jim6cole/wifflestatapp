'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function GlobalLeaderboard() {
  const [stats, setStats] = useState<{batters: any[], pitchers: any[], year: number | null}>({ batters: [], pitchers: [], year: null });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'batters' | 'pitchers'>('batters');
  const [sortConfig, setSortConfig] = useState({ key: 'ops', direction: 'desc' });
  const [pitchStyle, setPitchStyle] = useState('all'); // NEW: all, fast, medium

  useEffect(() => {
    setLoading(true);
    const styleQuery = pitchStyle !== 'all' ? `?style=${pitchStyle}` : '';
    fetch(`/api/public/stats/global${styleQuery}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => { 
        setStats(data); 
        setLoading(false); 
      });
  }, [pitchStyle]); // Re-fetch data when pitchStyle changes

  const requestSort = (key: string) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = () => {
    const data = viewMode === 'batters' ? [...stats.batters] : [...stats.pitchers];
    return data.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const displayData = getSortedData();

  return (
    <div className="min-h-screen bg-[#fdf0d5] text-[#001d3d] p-4 md:p-16 border-[16px] border-[#001d3d] selection:bg-[#ffd60a]">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between border-b-8 border-[#c1121f] pb-8 gap-6">
          <div>
            <Link href="/stats/select" className="text-xs font-black uppercase text-[#669bbc] hover:text-[#c1121f] mb-4 block tracking-widest">← STAT HUB</Link>
            <h1 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter text-[#001d3d] drop-shadow-[6px_6px_0px_#ffd60a]">
              {stats.year} GLOBAL
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* PITCH SPEED DROPDOWN */}
            <div className="bg-[#001d3d] p-1 border-4 border-[#001d3d] shadow-[8px_8px_0px_#c1121f]">
              <select 
                value={pitchStyle} 
                onChange={(e) => setPitchStyle(e.target.value)}
                className="bg-white text-[#001d3d] px-4 py-3 font-black italic uppercase text-sm outline-none cursor-pointer hover:bg-[#ffd60a] transition-all"
              >
                <option value="all">ALL LEAGUES</option>
                <option value="fast">FAST PITCH (UNRESTRICTED)</option>
                <option value="medium">MEDIUM PITCH (RESTRICTED)</option>
              </select>
            </div>

            <div className="flex bg-[#001d3d] border-4 border-[#001d3d] shadow-[8px_8px_0px_#c1121f]">
              <button onClick={() => { setViewMode('batters'); setSortConfig({key: 'ops', direction: 'desc'}); }} 
                className={`px-10 py-4 font-black italic uppercase text-sm transition-all ${viewMode === 'batters' ? 'bg-[#ffd60a] text-[#001d3d]' : 'text-white hover:text-[#ffd60a]'}`}>HITTING</button>
              <button onClick={() => { setViewMode('pitchers'); setSortConfig({key: 'era', direction: 'asc'}); }} 
                className={`px-10 py-4 font-black italic uppercase text-sm transition-all ${viewMode === 'pitchers' ? 'bg-[#ffd60a] text-[#001d3d]' : 'text-white hover:text-[#ffd60a]'}`}>PITCHING</button>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="py-20 text-center font-black uppercase text-[#001d3d] animate-pulse italic text-4xl">LOADING STATS...</div>
        ) : (
          <div className="bg-white border-4 border-[#001d3d] overflow-x-auto shadow-[12px_12px_0px_#ffd60a]">
            <table className="w-full text-center border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-[#001d3d] text-[#fdf0d5]">
                  <th className="p-6 text-left font-black italic uppercase border-r border-[#fdf0d5]/10">Player</th>
                  <th className="p-6 font-black italic uppercase border-r border-[#fdf0d5]/10">League</th>
                  {viewMode === 'batters' ? (
                    <>
                      <SortHeader label="AB" k="ab" cur={sortConfig} req={requestSort} />
                      <SortHeader label="H" k="h" cur={sortConfig} req={requestSort} />
                      <SortHeader label="2B" k="d" cur={sortConfig} req={requestSort} />
                      <SortHeader label="3B" k="t" cur={sortConfig} req={requestSort} />
                      <SortHeader label="HR" k="hr" cur={sortConfig} req={requestSort} />
                      <SortHeader label="BB" k="bb" cur={sortConfig} req={requestSort} />
                      <SortHeader label="RBI" k="rbi" cur={sortConfig} req={requestSort} />
                      <SortHeader label="AVG" k="avg" cur={sortConfig} req={requestSort} highlight />
                      <SortHeader label="OBP" k="obp" cur={sortConfig} req={requestSort} highlight />
                      <SortHeader label="OPS" k="ops" cur={sortConfig} req={requestSort} highlight red />
                    </>
                  ) : (
                    <>
                      <SortHeader label="IP" k="ipRaw" cur={sortConfig} req={requestSort} />
                      <SortHeader label="K" k="k" cur={sortConfig} req={requestSort} />
                      <SortHeader label="H" k="h" cur={sortConfig} req={requestSort} />
                      <SortHeader label="BB" k="bb" cur={sortConfig} req={requestSort} />
                      <SortHeader label="HR" k="hr" cur={sortConfig} req={requestSort} />
                      <SortHeader label="R" k="r" cur={sortConfig} req={requestSort} />
                      <SortHeader label="WHIP" k="whip" cur={sortConfig} req={requestSort} highlight />
                      <SortHeader label="ERA" k="era" cur={sortConfig} req={requestSort} highlight red />
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y-4 divide-[#fdf0d5]">
                {displayData.map((p, i) => (
                  <tr key={i} className="hover:bg-[#ffd60a]/10 transition-colors group">
                    <td className="p-6 text-left font-black italic uppercase text-2xl border-r-4 border-[#fdf0d5]">
                      <span className="text-[#c1121f] text-xs mr-4 not-italic font-bold">{i + 1}</span> {p.name}
                    </td>
                    <td className="p-6 border-r-4 border-[#fdf0d5]">
                      <span className="bg-[#669bbc] text-white px-4 py-1 font-black text-xs uppercase italic rounded-sm shadow-md">
                        {p.leagueDisplay}
                      </span>
                    </td>
                    {viewMode === 'pitchers' ? (
                      <>
                        <td className="p-6 font-bold">{p.ip}</td>
                        <td className="p-6 font-bold text-[#669bbc]">{p.k}</td>
                        <td className="p-6 font-bold">{p.h}</td>
                        <td className="p-6 font-bold text-green-600">{p.bb}</td>
                        <td className="p-6 font-bold text-[#c1121f]">{p.hr}</td>
                        <td className="p-6 font-bold">{p.r}</td>
                        <td className="p-6 font-black text-xl">{p.whip.toFixed(2)}</td>
                        <td className="p-6 font-black text-[#c1121f] text-4xl group-hover:scale-110 transition-transform">{p.era.toFixed(2)}</td>
                      </>
                    ) : (
                      <>
                        <td className="p-6 font-bold text-[#669bbc]">{p.ab}</td>
                        <td className="p-6 font-bold">{p.h}</td>
                        <td className="p-6 font-bold text-slate-400">{p.d}</td>
                        <td className="p-6 font-bold text-slate-400">{p.t}</td>
                        <td className="p-6 font-black text-[#c1121f]">{p.hr}</td>
                        <td className="p-6 font-bold text-green-600">{p.bb}</td>
                        <td className="p-6 font-bold">{p.rbi}</td>
                        <td className="p-6 font-black text-xl">{p.avg.toFixed(3).replace(/^0/, '')}</td>
                        <td className="p-6 font-black text-xl">{p.obp.toFixed(3).replace(/^0/, '')}</td>
                        <td className="p-6 font-black text-[#c1121f] text-4xl group-hover:scale-110 transition-transform">{p.ops.toFixed(3).replace(/^0/, '')}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SortHeader({ label, k, cur, req, highlight = false, red = false }: any) {
  const isActive = cur.key === k;
  return (
    <th 
      onClick={() => req(k)} 
      className={`p-4 font-black italic uppercase cursor-pointer transition-colors border-r border-[#fdf0d5]/10 hover:bg-[#ffd60a] hover:text-[#001d3d] ${
        isActive ? 'bg-[#ffd60a] text-[#001d3d]' : ''
      } ${highlight ? 'text-[#ffd60a]' : ''} ${red && !isActive ? 'text-[#c1121f]' : ''}`}
    >
      <div className="flex items-center justify-center gap-1">
        {label}
        {isActive && <span>{cur.direction === 'desc' ? '▼' : '▲'}</span>}
      </div>
    </th>
  );
}