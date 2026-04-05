'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function TeamStatsPage() {
  const { leagueId, teamId } = useParams();
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'hitting' | 'pitching'>('hitting');
  const [loading, setLoading] = useState(true);

  // --- FILTERS ---
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');

  useEffect(() => {
    if (!teamId) return;
    setLoading(true);
    let url = `/api/public/teams/${teamId}/stats?`;
    if (selectedYear) url += `year=${selectedYear}&`;
    if (selectedSeasonId) url += `seasonId=${selectedSeasonId}&`;
    if (selectedEventId) url += `eventId=${selectedEventId}&`;

    fetch(url)
      .then(res => res.json())
      .then(d => { 
        setData(d); 
        setLoading(false); 
      })
      .catch(err => {
        console.error("Failed to load team stats:", err);
        setLoading(false);
      });
  }, [teamId, selectedYear, selectedSeasonId, selectedEventId]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#001d3d] flex items-center justify-center">
        <div className="font-black text-white italic text-5xl animate-pulse uppercase">Syncing Franchise...</div>
      </div>
    );
  }

  const filteredSeasons = selectedYear && data?.seasons 
    ? data.seasons.filter((s:any) => s.year === parseInt(selectedYear)) 
    : data?.seasons || [];

  const filteredEvents = selectedSeasonId && data?.seasons 
    ? data.seasons.find((s:any) => String(s.id) === selectedSeasonId)?.events || [] 
    : [];

  return (
    <div className="min-h-screen bg-[#fdf0d5] text-[#001d3d] p-4 md:p-12 border-[16px] border-[#001d3d]">
      <div className="max-w-[1500px] mx-auto">
        
        {/* --- TEAM LEGACY CARD --- */}
        <div className="bg-[#001d3d] border-8 border-[#c1121f] p-8 md:p-12 shadow-[16px_16px_0px_#ffd60a] mb-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <Link href={`/leagues/${leagueId}/standings`} className="text-[9px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white transition-colors mb-6 block">
              ← Back to League Standings
            </Link>
            <h1 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter leading-none mb-4">
              {data?.teamName || "Team Stats"}
            </h1>
            <div className="flex flex-wrap gap-8 items-end">
              <div>
                <p className="text-[10px] font-black uppercase text-[#ffd60a] tracking-widest mb-1">Franchise Record</p>
                <p className="text-6xl font-black italic tracking-tight">
                  {data?.record?.w || 0}-{data?.record?.l || 0}-{data?.record?.t || 0}
                </p>
              </div>
              <div className="bg-white/5 px-6 py-3 border-2 border-white/10">
                <p className="text-[9px] font-black uppercase text-white/50 mb-1">Franchise Win %</p>
                <p className="text-3xl font-black italic text-[#ffd60a]">{data?.record?.pct || ".000"}</p>
              </div>
            </div>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] text-[220px] font-black italic text-white/5 pointer-events-none select-none uppercase">TEAM</div>
        </div>

        {/* --- HORIZONTAL FILTER BAR --- */}
        <div className="bg-[#001d3d] p-4 border-x-4 border-t-4 border-[#001d3d] flex flex-wrap items-center gap-8 shadow-inner">
           <div className="flex items-center gap-3">
              <label className="text-[10px] font-black uppercase text-[#ffd60a] italic">Year:</label>
              <select value={selectedYear} onChange={(e) => { setSelectedYear(e.target.value); setSelectedSeasonId(''); setSelectedEventId(''); }} className="bg-white border-2 border-[#ffd60a] px-3 py-1.5 text-xs font-black uppercase italic outline-none">
                <option value="">All-Time</option>
                {data?.years?.map((y:any) => <option key={y} value={y}>{y}</option>)}
              </select>
           </div>
           <div className="flex items-center gap-3">
              <label className="text-[10px] font-black uppercase text-[#ffd60a] italic">Season:</label>
              <select value={selectedSeasonId} onChange={(e) => { setSelectedSeasonId(e.target.value); setSelectedEventId(''); }} className="bg-white border-2 border-[#ffd60a] px-3 py-1.5 text-xs font-black uppercase italic outline-none min-w-[150px]">
                <option value="">All Seasons</option>
                {filteredSeasons.map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
           </div>
           <div className="flex items-center gap-3">
              <label className="text-[10px] font-black uppercase text-[#ffd60a] italic">Tournament:</label>
              <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} disabled={!selectedSeasonId} className="bg-white border-2 border-[#ffd60a] px-3 py-1.5 text-xs font-black uppercase italic outline-none min-w-[150px] disabled:opacity-30">
                <option value="">Entire Season</option>
                {filteredEvents.map((ev:any) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
           </div>
        </div>

        {/* --- TABS --- */}
        <div className="flex gap-2 mb-4">
           <button onClick={() => setActiveTab('hitting')} className={`flex-1 py-4 font-black uppercase italic text-xl border-4 transition-all ${activeTab === 'hitting' ? 'bg-[#001d3d] text-white border-[#001d3d] shadow-[8px_8px_0px_#c1121f]' : 'bg-white border-[#001d3d]'}`}>Franchise Hitting</button>
           <button onClick={() => setActiveTab('pitching')} className={`flex-1 py-4 font-black uppercase italic text-xl border-4 transition-all ${activeTab === 'pitching' ? 'bg-[#ffd60a] text-[#001d3d] border-[#001d3d] shadow-[8px_8px_0px_#c1121f]' : 'bg-white border-[#001d3d]'}`}>Franchise Pitching</button>
        </div>

        <div className="bg-white border-4 border-[#001d3d] shadow-[12px_12px_0px_#000] overflow-hidden min-h-[400px]">
           {loading ? (
             <div className="flex items-center justify-center h-64 font-black italic text-4xl text-[#001d3d] animate-pulse uppercase">Filtering Records...</div>
           ) : (
             <div className="overflow-x-auto">
               {activeTab === 'hitting' ? <HittingTable data={data?.batters || []} /> : <PitchingTable data={data?.pitchers || []} />}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

// --- UTILITY COMPONENTS ---

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
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'era', direction: 'asc' });

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc'; 
    if (['era', 'whip', 'h', 'r', 'er', 'bb', 'hr'].includes(key)) direction = 'asc'; 
    if (sortConfig.key === key) direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const sortedData = sortArray(data, sortConfig);
  const SortIndicator = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return null;
    return <span className="ml-1 text-[#c1121f]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <table className="w-full text-left border-collapse whitespace-nowrap">
      <thead className="bg-[#001d3d] text-[#ffd60a] text-[10px] font-black uppercase italic tracking-widest border-b-4 border-[#001d3d]">
        <tr>
          <th className="px-4 py-4 border-r border-white/10 cursor-pointer" onClick={() => handleSort('name')}>Player <SortIndicator columnKey="name" /></th>
          <th className="px-3 py-4 text-center cursor-pointer" onClick={() => handleSort('gp')}>GP <SortIndicator columnKey="gp" /></th>
          <th className="px-3 py-4 text-center cursor-pointer" onClick={() => handleSort('w')}>W <SortIndicator columnKey="w" /></th>
          <th className="px-4 py-4 text-center cursor-pointer" onClick={() => handleSort('ip')}>IP <SortIndicator columnKey="ip" /></th>
          <th className="px-3 py-4 text-center cursor-pointer" onClick={() => handleSort('k')}>K <SortIndicator columnKey="k" /></th>
          <th className="px-4 py-4 text-center cursor-pointer" onClick={() => handleSort('era')}>ERA <SortIndicator columnKey="era" /></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {sortedData.map((p) => (
          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3 font-black italic uppercase text-lg border-r border-slate-100">
              <Link href={`/players/${p.id}`} className="hover:text-[#c1121f]">{p.name}</Link>
            </td>
            <td className="px-3 py-3 text-center font-bold">{p.gp}</td>
            <td className="px-3 py-3 text-center font-bold">{p.w}</td>
            <td className="px-4 py-3 text-center font-black">{p.ip}</td>
            <td className="px-3 py-3 text-center font-black text-[#003566]">{p.pk}</td>
            <td className="px-4 py-3 text-center font-black text-[#c1121f] text-xl tabular-nums bg-slate-50">{p.era}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function HittingTable({ data }: { data: any[] }) {
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'ops', direction: 'desc' });

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc'; 
    if (sortConfig.key === key) direction = sortConfig.direction === 'desc' ? 'asc' : 'desc';
    setSortConfig({ key, direction });
  };

  const sortedData = sortArray(data, sortConfig);
  const SortIndicator = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return null;
    return <span className="ml-1 text-[#c1121f]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <table className="w-full text-left border-collapse whitespace-nowrap">
      <thead className="bg-[#001d3d] text-[#ffd60a] text-[10px] font-black uppercase italic tracking-widest border-b-4 border-[#001d3d]">
        <tr>
          <th className="px-4 py-4 border-r border-white/10 cursor-pointer" onClick={() => handleSort('name')}>Player <SortIndicator columnKey="name" /></th>
          <th className="px-3 py-4 text-center cursor-pointer" onClick={() => handleSort('gp')}>GP <SortIndicator columnKey="gp" /></th>
          <th className="px-3 py-4 text-center cursor-pointer" onClick={() => handleSort('h')}>H <SortIndicator columnKey="h" /></th>
          <th className="px-3 py-4 text-center cursor-pointer" onClick={() => handleSort('hr')}>HR <SortIndicator columnKey="hr" /></th>
          <th className="px-3 py-4 text-center cursor-pointer" onClick={() => handleSort('rbi')}>RBI <SortIndicator columnKey="rbi" /></th>
          <th className="px-3 py-4 text-center cursor-pointer" onClick={() => handleSort('avg')}>AVG <SortIndicator columnKey="avg" /></th>
          <th className="px-4 py-4 text-center cursor-pointer" onClick={() => handleSort('ops')}>OPS <SortIndicator columnKey="ops" /></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {sortedData.map((b) => (
          <tr key={b.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3 font-black italic uppercase text-lg border-r border-slate-100">
              <Link href={`/players/${b.id}`} className="hover:text-[#c1121f]">{b.name}</Link>
            </td>
            <td className="px-3 py-3 text-center font-bold">{b.gp}</td>
            <td className="px-3 py-3 text-center font-bold">{b.h}</td>
            <td className="px-3 py-3 text-center font-black text-[#c1121f] text-xl">{b.hr}</td>
            <td className="px-3 py-3 text-center font-bold">{b.rbi}</td>
            <td className="px-3 py-3 text-center font-black text-[#003566] text-xl font-mono">{b.avg}</td>
            <td className="px-4 py-3 text-center font-black text-[#c1121f] text-2xl italic font-mono bg-red-50/30">{b.ops}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}