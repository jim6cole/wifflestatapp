'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function SeasonStatsPage() {
  const params = useParams();
  const leagueId = params.leagueId as string;
  const seasonId = params.seasonId as string;

  const [activeTab, setActiveTab] = useState<'hitting' | 'pitching'>('hitting');
  const [pitchers, setPitchers] = useState<any[]>([]);
  const [batters, setBatters] = useState<any[]>([]);
  const [seasonName, setSeasonName] = useState('Season');
  const [loading, setLoading] = useState(true);
  
  // TOURNAMENT FILTER STATE
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  useEffect(() => {
    if (!seasonId) return;
    setLoading(true);
    
    // Add eventId to the fetch URL if a specific event is selected
    const url = `/api/public/stats/global?seasonId=${seasonId}${selectedEventId ? `&eventId=${selectedEventId}` : ''}`;
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setPitchers(data.pitchers || []);
        setBatters(data.batters || []);
        setSeasonName(data.seasonName || 'Season Stats');
        // Store events for the dropdown
        if (data.events) setEvents(data.events); 
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load season stats", err);
        setLoading(false);
      });
  }, [seasonId, selectedEventId]); 

  return (
    <div className="min-h-screen bg-[#fdf0d5] text-[#001d3d] p-4 md:p-12 border-[16px] border-[#001d3d]">
      <div className="max-w-[1400px] mx-auto">
        
        {/* --- HEADER --- */}
        <header className="mb-8 border-b-8 border-[#c1121f] pb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
          <div>
            <Link href={`/leagues/${leagueId}`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#c1121f] mb-4 block transition-colors">
              ← BACK TO LEAGUE
            </Link>
            <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter drop-shadow-[6px_6px_0px_#ffd60a] leading-none">
              {seasonName}
            </h1>
          </div>

          {/* TOURNAMENT FILTER DROPDOWN */}
          <div className="shrink-0 w-full md:w-auto">
            <label className="block text-[10px] font-black uppercase text-[#c1121f] tracking-widest mb-2 italic">Filter By Event</label>
            <select 
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-white border-4 border-[#001d3d] p-3 md:p-4 text-[#001d3d] font-black italic uppercase tracking-tight outline-none focus:border-[#c1121f] cursor-pointer shadow-[6px_6px_0px_#001d3d] hover:bg-[#fdf0d5] transition-colors"
            >
              <option value="">-- ALL CIRCUIT STATS --</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>🏆 {ev.name}</option>
              ))}
            </select>
          </div>
        </header>

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
    return <span className="ml-1 text-[#c1121f]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <table className="w-full text-left border-collapse whitespace-nowrap">
      <thead className="bg-[#001d3d] text-[#ffd60a] text-[10px] font-black uppercase italic tracking-widest select-none">
        <tr>
          <th className="px-4 py-4 border-r border-white/10 cursor-pointer" onClick={() => handleSort('name')}>Player <SortIndicator columnKey="name" /></th>
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
            <td className="px-4 py-3 font-black italic uppercase text-lg border-r border-slate-100">
              <span className="text-slate-300 mr-2 tabular-nums">{idx + 1}</span>
              <Link href={`/players/${p.id}`} className="hover:text-[#c1121f]">{p.name}</Link>
            </td>
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

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc'; 
    if (sortConfig.key === key) direction = sortConfig.direction === 'desc' ? 'asc' : 'desc';
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
          <th className="px-4 py-4 border-r border-white/10 cursor-pointer" onClick={() => handleSort('name')}>Player <SortIndicator columnKey="name" /></th>
          <th className="px-3 py-4 text-center cursor-pointer opacity-60" onClick={() => handleSort('gp')}>GP <SortIndicator columnKey="gp" /></th>
          <th className="px-3 py-4 text-center cursor-pointer opacity-60" onClick={() => handleSort('pa')}>PA <SortIndicator columnKey="pa" /></th>
          <th className="px-3 py-4 text-center cursor-pointer" onClick={() => handleSort('ab')}>AB <SortIndicator columnKey="ab" /></th>
          <th className="px-3 py-4 text-center cursor-pointer" onClick={() => handleSort('h')}>H <SortIndicator columnKey="h" /></th>
          <th className="px-3 py-4 text-center" onClick={() => handleSort('d')}>2B <SortIndicator columnKey="d" /></th>
          <th className="px-3 py-4 text-center" onClick={() => handleSort('t')}>3B <SortIndicator columnKey="t" /></th>
          <th className="px-3 py-4 text-center text-[#c1121f] cursor-pointer" onClick={() => handleSort('hr')}>HR <SortIndicator columnKey="hr" /></th>
          <th className="px-3 py-4 text-center cursor-pointer" onClick={() => handleSort('rbi')}>RBI <SortIndicator columnKey="rbi" /></th>
          <th className="px-3 py-4 text-center cursor-pointer" onClick={() => handleSort('r')}>R <SortIndicator columnKey="r" /></th>
          <th className="px-3 py-4 text-center opacity-60" onClick={() => handleSort('bb')}>BB <SortIndicator columnKey="bb" /></th>
          <th className="px-3 py-4 text-center opacity-60" onClick={() => handleSort('k')}>K <SortIndicator columnKey="k" /></th>
          <th className="px-3 py-4 text-center cursor-pointer" onClick={() => handleSort('avg')}>AVG <SortIndicator columnKey="avg" /></th>
          <th className="px-3 py-4 text-center opacity-60" onClick={() => handleSort('obp')}>OBP <SortIndicator columnKey="obp" /></th>
          <th className="px-4 py-4 text-center cursor-pointer" onClick={() => handleSort('ops')}>OPS <SortIndicator columnKey="ops" /></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {sortedData.map((b, idx) => (
          <tr key={b.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3 font-black italic uppercase text-lg border-r border-slate-100">
              <span className="text-slate-300 mr-2 tabular-nums">{idx + 1}</span>
              <Link href={`/players/${b.id}`} className="hover:text-[#c1121f]">{b.name}</Link>
            </td>
            <td className="px-3 py-3 text-center font-bold tabular-nums opacity-60">{b.gp}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums opacity-60">{b.pa}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums">{b.ab}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums">{b.h}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums">{b.d}</td>
            <td className="px-3 py-3 text-center font-bold tabular-nums">{b.t}</td>
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