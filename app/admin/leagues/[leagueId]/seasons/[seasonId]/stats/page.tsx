'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function SeasonStatsPage({ params }: { params: Promise<{ leagueId: string, seasonId: string }> }) {
  const { leagueId, seasonId } = use(params);

  const [activeTab, setActiveTab] = useState<'hitting' | 'pitching'>('hitting');
  const [pitchers, setPitchers] = useState<any[]>([]);
  const [batters, setBatters] = useState<any[]>([]);
  const [seasonName, setSeasonName] = useState('Season Leaderboard');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!seasonId) return;
    setLoading(true);
    
    // Using the public API to ensure 1:1 data parity (includes GP for fielders)
    fetch(`/api/public/stats/global?seasonId=${seasonId}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setPitchers(data.pitchers || []);
        setBatters(data.batters || []);
        setSeasonName(data.seasonName || 'Season Leaderboard');
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load season stats", err);
        setLoading(false);
      });
  }, [seasonId]); 

  // --- CSV EXPORT LOGIC ---
  const exportToCSV = () => {
    const dataToExport = activeTab === 'hitting' ? batters : pitchers;
    if (dataToExport.length === 0) return;

    const headers = activeTab === 'hitting' 
      ? ["Name", "GP", "PA", "AB", "H", "2B", "3B", "HR", "RBI", "R", "BB", "K", "AVG", "OBP", "OPS"]
      : ["Name", "W", "L", "SV", "GP", "IP", "H", "R", "ER", "BB", "K", "HR", "WHIP", "ERA"];

    const rows = dataToExport.map(p => activeTab === 'hitting' 
      ? [p.name, p.gp, p.pa, p.ab, p.h, p.d, p.t, p.hr, p.rbi, p.r, p.bb, p.k, p.avg, p.obp, p.ops]
      : [p.name, p.w, p.l, p.sv, p.gp, p.ip, p.h, p.r, p.er, p.bb, p.k, p.hr, p.whip, p.era]
    );

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Season_${seasonId}_${activeTab}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] p-4 md:p-12 border-[12px] border-[#c1121f]">
      <div className="max-w-[1400px] mx-auto">
        
        {/* --- HEADER --- */}
        <header className="mb-8 border-b-4 border-[#669bbc] pb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
          <div>
            <Link href={`/admin/leagues/${leagueId}/seasons/${seasonId}`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white mb-4 block transition-colors">
              ← BACK TO TERMINAL
            </Link>
            <h1 className="text-6xl md:text-7xl font-black italic uppercase text-white drop-shadow-[4px_4px_0px_#c1121f] leading-none">
              {seasonName}
            </h1>
          </div>

          <div className="shrink-0">
             <button 
               onClick={exportToCSV}
               className="hidden md:block text-[10px] font-black uppercase text-[#ffd60a] border-2 border-[#ffd60a] px-6 py-3 hover:bg-[#ffd60a] hover:text-[#001d3d] transition-colors tracking-widest"
             >
               ↓ Export CSV
             </button>
          </div>
        </header>

        {/* --- TAB TOGGLES --- */}
        <div className="flex gap-2 mb-8 bg-[#003566] border-2 border-[#669bbc] rounded-full p-1 shadow-xl w-fit">
          <button 
            onClick={() => setActiveTab('hitting')}
            className={`px-8 py-3 rounded-full font-black italic uppercase tracking-widest text-sm transition-all ${activeTab === 'hitting' ? 'bg-[#c1121f] text-white shadow-md' : 'text-[#669bbc] hover:text-white'}`}
          >
            Hitting
          </button>
          <button 
            onClick={() => setActiveTab('pitching')}
            className={`px-8 py-3 rounded-full font-black italic uppercase tracking-widest text-sm transition-all ${activeTab === 'pitching' ? 'bg-[#c1121f] text-white shadow-md' : 'text-[#669bbc] hover:text-white'}`}
          >
            Pitching
          </button>
        </div>

        {/* --- STATS TABLE --- */}
        <div className="bg-[#003566] border-2 border-[#669bbc] shadow-[12px_12px_0px_#000] overflow-hidden min-h-[400px]">
          {loading ? (
             <div className="flex items-center justify-center h-full py-20 font-black italic text-3xl text-white animate-pulse uppercase tracking-widest">
               Pulling Records...
             </div>
          ) : (
            <div className="overflow-x-auto">
              {activeTab === 'hitting' ? (
                <HittingTable data={batters} />
              ) : (
                <PitchingTable data={pitchers} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- UTILITY SORT FUNCTION ---
const sortArray = (data: any[], sortConfig: { key: string, direction: 'asc' | 'desc' }) => {
  return [...data].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];
    if (typeof aVal === 'string' && !isNaN(parseFloat(aVal))) aVal = parseFloat(aVal);
    if (typeof bVal === 'string' && !isNaN(parseFloat(bVal))) bVal = parseFloat(bVal);
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });
};

function PitchingTable({ data }: { data: any[] }) {
  const activePitchers = data.filter(p => parseFloat(p.ip) > 0 || p.w > 0 || p.l > 0 || p.sv > 0);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'era', direction: 'asc' });

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc'; 
    if (['era', 'whip', 'h', 'r', 'er', 'bb', 'hr'].includes(key)) direction = 'asc'; 
    if (sortConfig.key === key) direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const sortedData = sortArray(activePitchers, sortConfig);
  const SortIndicator = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return null;
    return <span className="ml-1 text-[#ffd60a]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <table className="w-full text-left border-collapse whitespace-nowrap">
      <thead className="bg-[#c1121f] text-white text-[10px] font-black uppercase italic tracking-widest select-none">
        <tr>
          <th className="p-4 border-r border-white/10 cursor-pointer hover:bg-white/10" onClick={() => handleSort('name')}>Player <SortIndicator columnKey="name" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('w')}>W <SortIndicator columnKey="w" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('l')}>L <SortIndicator columnKey="l" /></th>
          <th className="p-4 text-center cursor-pointer text-[#ffd60a] hover:bg-white/10" onClick={() => handleSort('sv')}>SV <SortIndicator columnKey="sv" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('ip')}>IP <SortIndicator columnKey="ip" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('h')}>H <SortIndicator columnKey="h" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('r')}>R <SortIndicator columnKey="r" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('er')}>ER <SortIndicator columnKey="er" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('bb')}>BB <SortIndicator columnKey="bb" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('k')}>K <SortIndicator columnKey="k" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('hr')}>HR <SortIndicator columnKey="hr" /></th>
          <th className="p-4 text-center text-[#ffd60a] cursor-pointer hover:bg-white/10" onClick={() => handleSort('whip')}>WHIP <SortIndicator columnKey="whip" /></th>
          <th className="p-4 text-center text-[#ffd60a] cursor-pointer hover:bg-white/10" onClick={() => handleSort('era')}>ERA <SortIndicator columnKey="era" /></th>
        </tr>
      </thead>
      <tbody className="divide-y-2 divide-[#001d3d]">
        {sortedData.map((p, idx) => (
          <tr key={p.id} className="hover:bg-white/5 transition-colors text-white">
            <td className="p-4 font-black italic uppercase text-lg border-r border-[#001d3d]">
              <span className="text-[#669bbc] mr-3 tabular-nums text-[10px]">{idx + 1}.</span>
              {p.name}
            </td>
            <td className="p-4 text-center font-bold tabular-nums">{p.w}</td>
            <td className="p-4 text-center font-bold tabular-nums">{p.l}</td>
            <td className="p-4 text-center font-black text-[#669bbc] tabular-nums">{p.sv}</td>
            <td className="p-4 text-center font-black text-xl tabular-nums">{p.ip}</td>
            <td className="p-4 text-center font-bold tabular-nums">{p.h}</td>
            <td className="p-4 text-center font-bold tabular-nums text-red-400">{p.r}</td>
            <td className="p-4 text-center font-black tabular-nums">{p.er}</td>
            <td className="p-4 text-center font-bold tabular-nums text-slate-400">{p.bb}</td>
            <td className="p-4 text-center font-black text-red-400 text-xl tabular-nums">{p.k}</td>
            <td className="p-4 text-center font-black text-xl tabular-nums">{p.hr || 0}</td>
            <td className="p-4 text-center font-black text-[#ffd60a] text-xl tabular-nums">{p.whip}</td>
            <td className="p-4 text-center font-black text-[#ffd60a] text-2xl tabular-nums">{p.era}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function HittingTable({ data }: { data: any[] }) {
  // Ensure we only show players who actually had an appearance or game played
  const activeBatters = data.filter(b => b.pa > 0 || b.gp > 0);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'ops', direction: 'desc' });

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc'; 
    if (sortConfig.key === key) direction = sortConfig.direction === 'desc' ? 'asc' : 'desc';
    setSortConfig({ key, direction });
  };

  const sortedData = sortArray(activeBatters, sortConfig);
  const SortIndicator = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return null;
    return <span className="ml-1 text-[#ffd60a]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <table className="w-full text-left border-collapse whitespace-nowrap">
      <thead className="bg-[#c1121f] text-white text-[10px] font-black uppercase italic tracking-widest select-none">
        <tr>
          <th className="p-4 border-r border-white/10 cursor-pointer hover:bg-white/10" onClick={() => handleSort('name')}>Player <SortIndicator columnKey="name" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('gp')}>GP <SortIndicator columnKey="gp" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('pa')}>PA <SortIndicator columnKey="pa" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('ab')}>AB <SortIndicator columnKey="ab" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('h')}>H <SortIndicator columnKey="h" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('d')}>2B <SortIndicator columnKey="d" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('t')}>3B <SortIndicator columnKey="t" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('hr')}>HR <SortIndicator columnKey="hr" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('rbi')}>RBI <SortIndicator columnKey="rbi" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('r')}>R <SortIndicator columnKey="r" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('bb')}>BB <SortIndicator columnKey="bb" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('k')}>K <SortIndicator columnKey="k" /></th>
          <th className="p-4 text-center text-[#ffd60a] cursor-pointer hover:bg-white/10" onClick={() => handleSort('avg')}>AVG <SortIndicator columnKey="avg" /></th>
          <th className="p-4 text-center text-[#ffd60a] cursor-pointer hover:bg-white/10" onClick={() => handleSort('obp')}>OBP <SortIndicator columnKey="obp" /></th>
          <th className="p-4 text-center text-[#ffd60a] cursor-pointer hover:bg-white/10" onClick={() => handleSort('ops')}>OPS <SortIndicator columnKey="ops" /></th>
        </tr>
      </thead>
      <tbody className="divide-y-2 divide-[#001d3d]">
        {sortedData.map((b, idx) => (
          <tr key={b.id} className="hover:bg-white/5 transition-colors text-white">
            <td className="p-4 font-black italic uppercase text-lg border-r border-[#001d3d]">
              <span className="text-[#669bbc] mr-3 tabular-nums text-[10px]">{idx + 1}.</span>
              {b.name}
            </td>
            <td className="p-4 text-center font-bold tabular-nums text-[#669bbc]">{b.gp}</td>
            <td className="p-4 text-center font-bold tabular-nums text-[#669bbc]">{b.pa}</td>
            <td className="p-4 text-center font-bold tabular-nums text-[#669bbc]">{b.ab}</td>
            <td className="p-4 text-center font-bold tabular-nums">{b.h}</td>
            <td className="p-4 text-center font-bold tabular-nums">{b.d}</td>
            <td className="p-4 text-center font-bold tabular-nums">{b.t}</td>
            <td className="p-4 text-center font-black text-xl tabular-nums">{b.hr}</td>
            <td className="p-4 text-center font-bold tabular-nums">{b.rbi}</td>
            <td className="p-4 text-center font-bold tabular-nums">{b.r}</td>
            <td className="p-4 text-center font-bold tabular-nums text-slate-400">{b.bb}</td>
            <td className="p-4 text-center font-bold tabular-nums text-red-400">{b.k}</td>
            <td className="p-4 text-center font-black text-[#ffd60a] text-xl font-mono tabular-nums">{b.avg}</td>
            <td className="p-4 text-center font-black text-[#ffd60a] font-mono tabular-nums">{b.obp}</td>
            <td className="p-4 text-center font-black text-[#ffd60a] text-xl font-mono tabular-nums">{b.ops}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}