'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function GlobalStatsPage() {
  const [activeTab, setActiveTab] = useState<'hitting' | 'pitching'>('hitting');
  const [pitchers, setPitchers] = useState<any[]>([]);
  const [batters, setBatters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [leagueFilter, setLeagueFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [speedFilter, setSpeedFilter] = useState('all');
  
  const leagues = [
    { id: '2', name: 'Mid Atlantic Wiffle' }
  ];

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
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load global stats", err);
        setLoading(false);
      });
  }, [leagueFilter, yearFilter, speedFilter]);

  return (
    <div className="min-h-screen bg-[#fdf0d5] text-[#001d3d] p-4 md:p-12 border-[16px] border-[#001d3d]">
      <div className="max-w-[1400px] mx-auto">
        
        {/* --- HEADER --- */}
        <header className="mb-8 border-b-8 border-[#c1121f] pb-6">
          <Link href="/" className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#c1121f] mb-4 block transition-colors">← STAT HUB</Link>
          <h1 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter drop-shadow-[6px_6px_0px_#ffd60a]">
            {yearFilter === 'all' ? 'All-Time' : yearFilter} Global
          </h1>
        </header>

        {/* --- FILTER BAR --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <select 
            value={leagueFilter} 
            onChange={(e) => setLeagueFilter(e.target.value)}
            className="w-full bg-white border-4 border-[#001d3d] p-4 font-black italic uppercase text-sm outline-none focus:border-[#c1121f] cursor-pointer shadow-[6px_6px_0px_#001d3d]"
          >
            <option value="all">ALL LEAGUES</option>
            {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>

          <select 
            value={yearFilter} 
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-full bg-white border-4 border-[#001d3d] p-4 font-black italic uppercase text-sm outline-none focus:border-[#c1121f] cursor-pointer shadow-[6px_6px_0px_#001d3d]"
          >
            <option value="all">ALL YEARS</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>

          <select 
            value={speedFilter} 
            onChange={(e) => setSpeedFilter(e.target.value)}
            className="w-full bg-white border-4 border-[#001d3d] p-4 font-black italic uppercase text-sm outline-none focus:border-[#c1121f] cursor-pointer shadow-[6px_6px_0px_#001d3d]"
          >
            <option value="all">ALL SPEEDS</option>
            <option value="fast">FAST (Unrestricted)</option>
            <option value="medium">MEDIUM (Restricted)</option>
          </select>
        </div>

        {/* --- TAB TOGGLES --- */}
        <div className="flex gap-2 mb-8">
          <button 
            onClick={() => setActiveTab('hitting')}
            className={`flex-1 py-4 font-black italic uppercase text-xl border-4 transition-all ${activeTab === 'hitting' ? 'bg-[#001d3d] text-white border-[#001d3d] shadow-[8px_8px_0px_#c1121f]' : 'bg-white border-[#001d3d] hover:bg-[#ffd60a]'}`}
          >
            Hitting
          </button>
          <button 
            onClick={() => setActiveTab('pitching')}
            className={`flex-1 py-4 font-black italic uppercase text-xl border-4 transition-all ${activeTab === 'pitching' ? 'bg-[#ffd60a] text-[#001d3d] border-[#001d3d] shadow-[8px_8px_0px_#c1121f]' : 'bg-white border-[#001d3d] hover:bg-[#001d3d] hover:text-white'}`}
          >
            Pitching
          </button>
        </div>

        {/* --- STATS TABLE --- */}
        <div className="bg-white border-4 border-[#001d3d] shadow-[12px_12px_0px_#000] overflow-hidden min-h-[400px]">
          {loading ? (
             <div className="flex items-center justify-center h-full py-20 font-black italic text-4xl text-[#001d3d] animate-pulse uppercase tracking-tighter">
               Pulling Files...
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
  // Removes "ghost" pitchers with pure 0 stat lines
  const activePitchers = data.filter(p => 
    parseFloat(p.ip) > 0 || parseInt(p.k) > 0 || parseInt(p.h) > 0 || parseInt(p.bb) > 0 || parseInt(p.hr) > 0
  );

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'era', direction: 'asc' });

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc'; 
    if (key === 'era' || key === 'whip' || key === 'hr') direction = 'asc'; 
    
    if (sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = sortArray(activePitchers, sortConfig);

  const SortIndicator = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return null;
    return <span className="ml-1 text-[#c1121f]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <table className="w-full text-left border-collapse whitespace-nowrap">
      <thead className="bg-[#001d3d] text-[#ffd60a] text-[10px] font-black uppercase italic tracking-widest select-none">
        <tr>
          <th className="p-4 border-r border-white/10 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort('name')}>Player <SortIndicator columnKey="name" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('leagueDisplay')}>LGE <SortIndicator columnKey="leagueDisplay" /></th>
          <th className="p-4 text-center opacity-30 cursor-pointer hover:bg-white/10" onClick={() => handleSort('speedDisplay')}>SP <SortIndicator columnKey="speedDisplay" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('ip')}>IP <SortIndicator columnKey="ip" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('k')}>K <SortIndicator columnKey="k" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('h')}>H <SortIndicator columnKey="h" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('bb')}>BB <SortIndicator columnKey="bb" /></th>
          <th className="p-4 text-center text-[#c1121f] bg-black/10 cursor-pointer hover:bg-black/20" onClick={() => handleSort('hr')}>HR <SortIndicator columnKey="hr" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('whip')}>WHIP <SortIndicator columnKey="whip" /></th>
          <th className="p-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('era')}>ERA <SortIndicator columnKey="era" /></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {sortedData.map((p, idx) => (
          <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
            <td className="p-4 font-black italic uppercase text-lg border-r border-slate-100">
              <span className="text-slate-300 mr-2 tabular-nums">{idx + 1}</span>
              <Link href={`/players/${p.id}`} className="hover:text-[#c1121f] transition-colors">
                {p.name}
              </Link>
            </td>
            <td className="p-4 text-center font-black text-[#669bbc] text-xs uppercase">{p.leagueDisplay}</td>
            <td className="p-4 text-center font-black text-slate-200 text-[10px] uppercase">{p.speedDisplay}</td>
            <td className="p-4 text-center font-black text-xl tabular-nums">{p.ip}</td>
            <td className="p-4 text-center font-black text-[#003566] text-xl tabular-nums">{p.k}</td>
            <td className="p-4 text-center font-bold tabular-nums">{p.h}</td>
            <td className="p-4 text-center font-bold tabular-nums opacity-40">{p.bb}</td>
            <td className="p-4 text-center font-black text-[#c1121f] text-xl tabular-nums bg-red-50/30">{p.hr || 0}</td>
            <td className="p-4 text-center font-mono text-slate-400 tabular-nums">{p.whip}</td>
            <td className="p-4 text-center font-black text-[#c1121f] text-2xl italic tracking-tighter tabular-nums">{p.era}</td>
          </tr>
        ))}
        {sortedData.length === 0 && (
          <tr><td colSpan={10} className="p-8 text-center text-slate-400 font-bold italic uppercase">No active pitchers found for these filters.</td></tr>
        )}
      </tbody>
    </table>
  );
}

function HittingTable({ data }: { data: any[] }) {
  // Remove players who haven't registered an at-bat or walk
  const activeBatters = data.filter(b => b.pa > 0);

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'ops', direction: 'desc' });

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc'; 
    if (sortConfig.key === key) {
      direction = sortConfig.direction === 'desc' ? 'asc' : 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = sortArray(activeBatters, sortConfig);

  const SortIndicator = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return null;
    return <span className="ml-1 text-[#c1121f]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <table className="w-full text-left border-collapse whitespace-nowrap">
      <thead className="bg-[#001d3d] text-[#ffd60a] text-[10px] font-black uppercase italic tracking-widest select-none">
        <tr>
          <th className="px-4 py-4 border-r border-white/10 cursor-pointer hover:bg-white/10" onClick={() => handleSort('name')}>Player <SortIndicator columnKey="name" /></th>
          
          {/* ADDED LEAGUE & SPEED FOR HITTERS */}
          <th className="px-3 py-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('leagueDisplay')}>LGE <SortIndicator columnKey="leagueDisplay" /></th>
          <th className="px-3 py-4 text-center opacity-30 cursor-pointer hover:bg-white/10" onClick={() => handleSort('speedDisplay')}>SP <SortIndicator columnKey="speedDisplay" /></th>
          
          <th className="px-3 py-4 text-center cursor-pointer hover:bg-white/10 opacity-60" onClick={() => handleSort('gp')}>GP <SortIndicator columnKey="gp" /></th>
          <th className="px-3 py-4 text-center cursor-pointer hover:bg-white/10 opacity-60" onClick={() => handleSort('pa')}>PA <SortIndicator columnKey="pa" /></th>
          <th className="px-3 py-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('ab')}>AB <SortIndicator columnKey="ab" /></th>
          <th className="px-3 py-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('h')}>H <SortIndicator columnKey="h" /></th>
          <th className="px-3 py-4 text-center cursor-pointer hover:bg-white/10 opacity-60" onClick={() => handleSort('d')}>2B <SortIndicator columnKey="d" /></th>
          <th className="px-3 py-4 text-center cursor-pointer hover:bg-white/10 opacity-60" onClick={() => handleSort('t')}>3B <SortIndicator columnKey="t" /></th>
          <th className="px-3 py-4 text-center text-[#c1121f] cursor-pointer hover:bg-white/10" onClick={() => handleSort('hr')}>HR <SortIndicator columnKey="hr" /></th>
          <th className="px-3 py-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('rbi')}>RBI <SortIndicator columnKey="rbi" /></th>
          <th className="px-3 py-4 text-center cursor-pointer hover:bg-white/10 opacity-60" onClick={() => handleSort('bb')}>BB <SortIndicator columnKey="bb" /></th>
          <th className="px-3 py-4 text-center cursor-pointer hover:bg-white/10 opacity-60" onClick={() => handleSort('k')}>K <SortIndicator columnKey="k" /></th>
          <th className="px-3 py-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('avg')}>AVG <SortIndicator columnKey="avg" /></th>
          <th className="px-3 py-4 text-center cursor-pointer hover:bg-white/10 opacity-60" onClick={() => handleSort('obp')}>OBP <SortIndicator columnKey="obp" /></th>
          <th className="px-4 py-4 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('ops')}>OPS <SortIndicator columnKey="ops" /></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {sortedData.map((b, idx) => (
          <tr key={b.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3 font-black italic uppercase text-lg border-r border-slate-100">
              <span className="text-slate-300 mr-2 tabular-nums">{idx + 1}</span>
              <Link href={`/players/${b.id}`} className="hover:text-[#c1121f] transition-colors">
                {b.name}
              </Link>
            </td>
            <td className="px-3 py-3 text-center font-black text-[#669bbc] text-xs uppercase">{b.leagueDisplay}</td>
            <td className="px-3 py-3 text-center font-black text-slate-200 text-[10px] uppercase">{b.speedDisplay}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums opacity-60">{b.gp}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums opacity-60">{b.pa}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums">{b.ab}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums">{b.h}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums opacity-60">{b.d}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums opacity-60">{b.t}</td>
            <td className="px-3 py-3 text-center font-black text-[#c1121f] text-xl tabular-nums">{b.hr}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums">{b.rbi}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums opacity-60">{b.bb}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums opacity-60">{b.k}</td>
            <td className="px-3 py-3 text-center font-black text-[#003566] text-xl font-mono tabular-nums">{b.avg}</td>
            <td className="px-3 py-3 text-center font-black text-[#669bbc] font-mono tabular-nums opacity-80">{b.obp}</td>
            <td className="px-4 py-3 text-center font-black text-[#c1121f] text-2xl italic font-mono tabular-nums bg-red-50/30">{b.ops}</td>
          </tr>
        ))}
        {sortedData.length === 0 && (
          <tr><td colSpan={16} className="p-8 text-center text-slate-400 font-bold italic uppercase">No hitting stats found for these filters.</td></tr>
        )}
      </tbody>
    </table>
  );
}