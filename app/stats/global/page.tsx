'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function GlobalStatsPage() {
  const [activeTab, setActiveTab] = useState<'hitting' | 'pitching'>('hitting');
  const [pitchers, setPitchers] = useState<any[]>([]);
  const [batters, setBatters] = useState<any[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- DYNAMIC YEAR STATE ---
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [loadingYears, setLoadingYears] = useState(true);

  const [leagueFilter, setLeagueFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [speedFilter, setSpeedFilter] = useState('all');
  
  // Fetch available years on mount
  useEffect(() => {
    async function fetchAvailableYears() {
      try {
        const res = await fetch('/api/public/stats/years');
        const data = await res.json();
        if (Array.isArray(data)) {
          const yearStrings = data.map(y => y.toString());
          setAvailableYears(yearStrings);
          
          // Fallback if current year has no data
          if (yearStrings.length > 0 && !yearStrings.includes(yearFilter)) {
            setYearFilter(yearStrings[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load available years:", err);
      } finally {
        setLoadingYears(false);
      }
    }
    fetchAvailableYears();
  }, []);

  // Fetch stats when filters change
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (leagueFilter !== 'all') params.append('leagueId', leagueFilter);
    if (yearFilter !== 'all') params.append('year', yearFilter);
    if (speedFilter !== 'all') params.append('style', speedFilter);

    fetch(`/api/public/stats/global?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setPitchers(data.pitchers || []);
        setBatters(data.batters || []);
        setLeagues(data.leagues || []);
        setLoading(false);
      });
  }, [leagueFilter, yearFilter, speedFilter]);

  // --- CSV EXPORT LOGIC ---
  const exportToCSV = () => {
    const dataToExport = activeTab === 'hitting' ? batters : pitchers;
    if (dataToExport.length === 0) return;

    const headers = activeTab === 'hitting' 
      ? ["Name", "League", "Speed", "GP", "PA", "AB", "H", "2B", "3B", "HR", "RBI", "R", "BB", "K", "AVG", "OBP", "OPS"]
      : ["Name", "League", "Speed", "W", "L", "SV", "GP", "IP", "H", "R", "ER", "BB", "K", "HR", "WHIP", "ERA"];

    const rows = dataToExport.map(p => activeTab === 'hitting' 
      ? [p.name, p.leagueDisplay, p.speedDisplay, p.gp, p.pa, p.ab, p.h, p.d, p.t, p.hr, p.rbi, p.r, p.bb, p.k, p.avg, p.obp, p.ops]
      : [p.name, p.leagueDisplay, p.speedDisplay, p.w, p.l, p.sv, p.gp, p.ip, p.h, p.r, p.er, p.bb, p.k, p.hr, p.whip, p.era]
    );

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `AWAA_Global_${activeTab}_${yearFilter}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#fdf0d5] text-[#001d3d] p-4 md:p-12 border-[16px] border-[#001d3d]">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-8 border-b-8 border-[#c1121f] pb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <Link href="/" className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#c1121f] mb-4 block transition-colors">← STAT HUB</Link>
            <h1 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter drop-shadow-[6px_6px_0px_#ffd60a]">
              {yearFilter === 'all' ? 'All-Time' : yearFilter} Global
            </h1>
          </div>
          <button 
            onClick={exportToCSV}
            className="bg-[#c1121f] text-white border-4 border-[#001d3d] px-6 py-4 font-black uppercase italic hover:bg-[#ffd60a] hover:text-[#001d3d] transition-all shadow-[6px_6px_0px_#001d3d] active:translate-y-1 active:shadow-none"
          >
            ↓ Export CSV
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <select value={leagueFilter} onChange={(e) => setLeagueFilter(e.target.value)} className="w-full bg-white border-4 border-[#001d3d] p-4 font-black italic uppercase text-sm outline-none shadow-[6px_6px_0px_#001d3d]">
            <option value="all">ALL LEAGUES</option>
            {leagues.map(l => <option key={l.id} value={l.id.toString()}>{l.shortName || l.name}</option>)}
          </select>

          {/* DYNAMIC YEAR FILTER */}
          <select 
            value={yearFilter} 
            onChange={(e) => setYearFilter(e.target.value)} 
            disabled={loadingYears}
            className="w-full bg-white border-4 border-[#001d3d] p-4 font-black italic uppercase text-sm outline-none shadow-[6px_6px_0px_#001d3d] cursor-pointer max-h-60 overflow-y-auto"
          >
            <option value="all">ALL YEARS</option>
            {loadingYears ? (
              <option disabled className="italic">Loading...</option>
            ) : (
              availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))
            )}
          </select>

          <select value={speedFilter} onChange={(e) => setSpeedFilter(e.target.value)} className="w-full bg-white border-4 border-[#001d3d] p-4 font-black italic uppercase text-sm outline-none shadow-[6px_6px_0px_#001d3d]">
            <option value="all">ALL SPEEDS</option>
            <option value="fast">FAST (Unrestricted)</option>
            <option value="medium">MEDIUM (Restricted)</option>
          </select>
        </div>

        <div className="flex gap-2 mb-8">
          <button onClick={() => setActiveTab('hitting')} className={`flex-1 py-4 font-black italic uppercase text-xl border-4 transition-all ${activeTab === 'hitting' ? 'bg-[#001d3d] text-white border-[#001d3d] shadow-[8px_8px_0px_#c1121f]' : 'bg-white border-[#001d3d]'}`}>Hitting</button>
          <button onClick={() => setActiveTab('pitching')} className={`flex-1 py-4 font-black italic uppercase text-xl border-4 transition-all ${activeTab === 'pitching' ? 'bg-[#ffd60a] text-[#001d3d] border-[#001d3d] shadow-[8px_8px_0px_#c1121f]' : 'bg-white border-[#001d3d]'}`}>Pitching</button>
        </div>

        <div className="bg-white border-4 border-[#001d3d] shadow-[12px_12px_0px_#000] overflow-hidden min-h-[400px]">
          {loading ? (
             <div className="flex items-center justify-center h-full py-20 font-black italic text-4xl text-[#001d3d] animate-pulse uppercase tracking-tighter">Pulling Files...</div>
          ) : (
            <div className="overflow-x-auto">
              {activeTab === 'hitting' ? <HittingTable data={batters} /> : <PitchingTable data={pitchers} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ... Rest of your sortArray, PitchingTable, and HittingTable components follow exactly as before

const sortArray = (data: any[], sortConfig: { key: string, direction: 'asc' | 'desc' }) => {
  return [...data].sort((a, b) => {
    let aVal = a[sortConfig.key], bVal = b[sortConfig.key];
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
  const sortedData = sortArray(activePitchers, sortConfig);
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (['era', 'whip', 'h', 'r', 'er', 'bb', 'k', 'hr'].includes(key)) direction = 'asc';
    if (sortConfig.key === key) direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const SortIndicator = ({ columnKey }: { columnKey: string }) => sortConfig.key === columnKey ? <span className="ml-1 text-[#c1121f]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span> : null;

  return (
    <table className="w-full text-left border-collapse whitespace-nowrap">
      <thead className="bg-[#001d3d] text-[#ffd60a] text-[10px] font-black uppercase italic tracking-widest select-none">
        <tr>
          <th className="p-4 border-r border-white/10 cursor-pointer" onClick={() => handleSort('name')}>Player <SortIndicator columnKey="name" /></th>
          <th className="p-4 text-center cursor-pointer" onClick={() => handleSort('leagueDisplay')}>LEAGUE <SortIndicator columnKey="leagueDisplay" /></th>
          <th className="p-4 text-center cursor-pointer" onClick={() => handleSort('speedDisplay')}>SPEED <SortIndicator columnKey="speedDisplay" /></th>
          <th className="px-3 py-4 text-center cursor-pointer" onClick={() => handleSort('w')}>W <SortIndicator columnKey="w" /></th>
          <th className="px-3 py-4 text-center cursor-pointer" onClick={() => handleSort('l')}>L <SortIndicator columnKey="l" /></th>
          <th className="px-3 py-4 text-center cursor-pointer text-[#669bbc]" onClick={() => handleSort('sv')}>SV <SortIndicator columnKey="sv" /></th>
          <th className="px-4 py-4 text-center cursor-pointer" onClick={() => handleSort('ip')}>IP <SortIndicator columnKey="ip" /></th>
          <th className="px-3 py-4 text-center cursor-pointer" onClick={() => handleSort('h')}>H <SortIndicator columnKey="h" /></th>
          <th className="px-3 py-4 text-center cursor-pointer text-[#c1121f]" onClick={() => handleSort('r')}>R <SortIndicator columnKey="r" /></th>
          <th className="px-3 py-4 text-center cursor-pointer text-[#c1121f]" onClick={() => handleSort('er')}>ER <SortIndicator columnKey="er" /></th>
          <th className="px-3 py-4 text-center cursor-pointer" onClick={() => handleSort('bb')}>BB <SortIndicator columnKey="bb" /></th>
          <th className="px-4 py-4 text-center cursor-pointer" onClick={() => handleSort('k')}>K <SortIndicator columnKey="k" /></th>
          <th className="px-3 py-4 text-center text-[#c1121f] cursor-pointer" onClick={() => handleSort('hr')}>HR <SortIndicator columnKey="hr" /></th>
          <th className="px-4 py-4 text-center text-[#669bbc] cursor-pointer" onClick={() => handleSort('whip')}>WHIP <SortIndicator columnKey="whip" /></th>
          <th className="px-4 py-4 text-center cursor-pointer" onClick={() => handleSort('era')}>ERA <SortIndicator columnKey="era" /></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {sortedData.map((p, idx) => (
          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
            <td className="p-4 font-black italic uppercase text-lg border-r border-slate-100"><span className="text-slate-300 mr-2 tabular-nums">{idx + 1}</span><Link href={`/players/${p.id}`} className="hover:text-[#c1121f]">{p.name}</Link></td>
            <td className="p-4 text-center font-black text-[#669bbc] text-xs uppercase">{p.leagueDisplay}</td>
            <td className={`p-4 text-center font-black text-[10px] uppercase ${p.speedDisplay?.startsWith('FAST') ? 'text-[#c1121f]' : p.speedDisplay?.startsWith('MED') ? 'text-[#669bbc]' : 'text-[#001d3d]'}`}>{p.speedDisplay}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums opacity-70">{p.w}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums opacity-70">{p.l}</td>
            <td className="px-3 py-3 text-center font-black text-[#669bbc] tabular-nums">{p.sv}</td>
            <td className="px-4 py-3 text-center font-black text-xl tabular-nums">{p.ip}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums">{p.h}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums text-[#c1121f] opacity-80">{p.r}</td>
            <td className="px-3 py-3 text-center font-black tabular-nums text-[#c1121f]">{p.er}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums opacity-50">{p.bb}</td>
            <td className="px-4 py-3 text-center font-black text-[#003566] text-xl tabular-nums">{p.k}</td>
            <td className="px-3 py-3 text-center font-black text-[#c1121f] text-xl tabular-nums bg-red-50/30">{p.hr || 0}</td>
            <td className="px-4 py-3 text-center font-black text-[#669bbc] text-xl tabular-nums">{p.whip}</td>
            <td className="px-4 py-3 text-center font-black text-[#c1121f] text-2xl italic tracking-tighter tabular-nums bg-slate-50">{p.era}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function HittingTable({ data }: { data: any[] }) {
  const activeBatters = data.filter(b => b.pa > 0);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'ops', direction: 'desc' });
  const sortedData = sortArray(activeBatters, sortConfig);
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key) direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };
  const SortIndicator = ({ columnKey }: { columnKey: string }) => sortConfig.key === columnKey ? <span className="ml-1 text-[#c1121f]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span> : null;

  return (
    <table className="w-full text-left border-collapse whitespace-nowrap">
      <thead className="bg-[#001d3d] text-[#ffd60a] text-[10px] font-black uppercase italic tracking-widest select-none">
        <tr>
          <th className="px-4 py-4 border-r border-white/10 cursor-pointer" onClick={() => handleSort('name')}>Player <SortIndicator columnKey="name" /></th>
          <th className="px-3 py-4 text-center cursor-pointer" onClick={() => handleSort('leagueDisplay')}>LEAGUE <SortIndicator columnKey="leagueDisplay" /></th>
          <th className="px-3 py-4 text-center cursor-pointer" onClick={() => handleSort('speedDisplay')}>SPEED <SortIndicator columnKey="speedDisplay" /></th>
          <th className="px-3 py-4 text-center cursor-pointer opacity-60" onClick={() => handleSort('gp')}>GP <SortIndicator columnKey="gp" /></th>
          <th className="px-3 py-4 text-center cursor-pointer opacity-60" onClick={() => handleSort('pa')}>PA <SortIndicator columnKey="pa" /></th>
          <th className="px-3 py-4 text-center cursor-pointer" onClick={() => handleSort('ab')}>AB <SortIndicator columnKey="ab" /></th>
          <th className="px-3 py-4 text-center cursor-pointer" onClick={() => handleSort('h')}>H <SortIndicator columnKey="h" /></th>
          <th className="px-3 py-4 text-center cursor-pointer opacity-60" onClick={() => handleSort('d')}>2B <SortIndicator columnKey="d" /></th>
          <th className="px-3 py-4 text-center cursor-pointer opacity-60" onClick={() => handleSort('t')}>3B <SortIndicator columnKey="t" /></th>
          <th className="px-3 py-4 text-center text-[#c1121f] cursor-pointer" onClick={() => handleSort('hr')}>HR <SortIndicator columnKey="hr" /></th>
          <th className="px-3 py-4 text-center cursor-pointer" onClick={() => handleSort('rbi')}>RBI <SortIndicator columnKey="rbi" /></th>
          <th className="px-3 py-4 text-center cursor-pointer" onClick={() => handleSort('r')}>R <SortIndicator columnKey="r" /></th>
          <th className="px-3 py-4 text-center cursor-pointer opacity-60" onClick={() => handleSort('bb')}>BB <SortIndicator columnKey="bb" /></th>
          <th className="px-3 py-4 text-center cursor-pointer opacity-60" onClick={() => handleSort('k')}>K <SortIndicator columnKey="k" /></th>
          <th className="px-3 py-4 text-center cursor-pointer" onClick={() => handleSort('avg')}>AVG <SortIndicator columnKey="avg" /></th>
          <th className="px-3 py-4 text-center cursor-pointer opacity-60" onClick={() => handleSort('obp')}>OBP <SortIndicator columnKey="obp" /></th>
          <th className="px-4 py-4 text-center cursor-pointer" onClick={() => handleSort('ops')}>OPS <SortIndicator columnKey="ops" /></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {sortedData.map((b, idx) => (
          <tr key={b.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3 font-black italic uppercase text-lg border-r border-slate-100"><span className="text-slate-300 mr-2 tabular-nums">{idx + 1}</span><Link href={`/players/${b.id}`} className="hover:text-[#c1121f]">{b.name}</Link></td>
            <td className="px-3 py-3 text-center font-black text-[#669bbc] text-xs uppercase">{b.leagueDisplay}</td>
            <td className={`px-3 py-3 text-center font-black text-[10px] uppercase ${b.speedDisplay?.startsWith('FAST') ? 'text-[#c1121f]' : b.speedDisplay?.startsWith('MED') ? 'text-[#669bbc]' : 'text-[#001d3d]'}`}>{b.speedDisplay}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums opacity-60">{b.gp}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums opacity-60">{b.pa}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums">{b.ab}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums">{b.h}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums opacity-60">{b.d}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums opacity-60">{b.t}</td>
            <td className="px-3 py-3 text-center font-black text-[#c1121f] text-xl tabular-nums">{b.hr}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums">{b.rbi}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums">{b.r}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums opacity-60">{b.bb}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums opacity-60">{b.k}</td>
            <td className="px-3 py-3 text-center font-black text-[#003566] text-xl font-mono tabular-nums">{b.avg}</td>
            <td className="px-3 py-3 text-center font-black text-[#669bbc] font-mono tabular-nums opacity-80">{b.obp}</td>
            <td className="px-4 py-3 text-center font-black text-[#c1121f] text-2xl italic font-mono tabular-nums bg-red-50/30">{b.ops}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}