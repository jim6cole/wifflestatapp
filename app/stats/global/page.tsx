'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function GlobalLeaderboard() {
  const currentYearInt = new Date().getFullYear();
  
  const [stats, setStats] = useState<{batters: any[], pitchers: any[], year: number | null}>({ batters: [], pitchers: [], year: null });
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState<'batters' | 'pitchers'>('batters');
  const [sortConfig, setSortConfig] = useState({ key: 'ops', direction: 'desc' });
  
  // Filters
  const [pitchStyle, setPitchStyle] = useState('all');
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [selectedYear, setSelectedYear] = useState(currentYearInt.toString());

  // Generate an array of years from 2024 up to the current year
  const availableYears = Array.from({ length: currentYearInt - 2024 + 1 }, (_, i) => (2024 + i).toString()).reverse();

  // Fetch Available Leagues on mount
  useEffect(() => {
    fetch('/api/public/leagues')
      .then(res => res.json())
      .then(data => setLeagues(data))
      .catch(() => console.error("Failed to load leagues"));
  }, []);

  // Fetch Stats when filters change
  useEffect(() => {
    setLoading(true);
    
    // Build query parameters dynamically
    const params = new URLSearchParams();
    if (pitchStyle !== 'all') params.append('style', pitchStyle);
    if (selectedLeague !== 'all') params.append('leagueId', selectedLeague);
    if (selectedYear) params.append('year', selectedYear);

    fetch(`/api/public/stats/global?${params.toString()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => { 
        setStats(data); 
        setLoading(false); 
      });
  }, [pitchStyle, selectedLeague, selectedYear]);

  // Enforce rule: "Selecting a specific league forces current year"
  const handleLeagueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLeague = e.target.value;
    setSelectedLeague(newLeague);
    if (newLeague !== 'all') {
      setSelectedYear(currentYearInt.toString());
    }
  };

  const requestSort = (key: string) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  const getSortedData = () => {
    const data = viewMode === 'batters' ? [...stats.batters] : [...stats.pitchers];
    return data.sort((a, b) => {
      const valA = isNaN(parseFloat(a[sortConfig.key])) ? a[sortConfig.key] : parseFloat(a[sortConfig.key]);
      const valB = isNaN(parseFloat(b[sortConfig.key])) ? b[sortConfig.key] : parseFloat(b[sortConfig.key]);

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const displayData = getSortedData();

  // --- CSV EXPORT LOGIC ---
  const exportToCSV = () => {
    if (!displayData || displayData.length === 0) return;

    let csvContent = "";
    let headers = [];

    if (viewMode === 'batters') {
      headers = ["Rank", "Player", "League", "Speed", "AB", "H", "2B", "3B", "HR", "BB", "RBI", "AVG", "OBP", "OPS"];
      csvContent += headers.join(",") + "\n";
      displayData.forEach((p, index) => {
        const row = [
          index + 1,
          `"${p.name}"`, 
          `"${p.leagueDisplay}"`, 
          `"${p.speedDisplay}"`, 
          p.ab, p.h, p.d, p.t, p.hr, p.bb, p.rbi,
          p.avg, p.obp, p.ops
        ];
        csvContent += row.join(",") + "\n";
      });
    } else {
      headers = ["Rank", "Player", "League", "Speed", "IP", "K", "H", "BB", "HR", "R", "WHIP", "ERA"];
      csvContent += headers.join(",") + "\n";
      displayData.forEach((p, index) => {
        const row = [
          index + 1,
          `"${p.name}"`, 
          `"${p.leagueDisplay}"`,
          `"${p.speedDisplay}"`,  
          p.ip, p.k, p.h, p.bb, p.hr, p.r,
          p.whip, p.era
        ];
        csvContent += row.join(",") + "\n";
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const filterDesc = selectedLeague === 'all' ? 'GLOBAL' : `LEAGUE_${selectedLeague}`;
    link.setAttribute("download", `AWAA_${stats.year || 'Career'}_${filterDesc}_${viewMode.toUpperCase()}_${pitchStyle.toUpperCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#fdf0d5] text-[#001d3d] p-4 md:p-16 border-[16px] border-[#001d3d] selection:bg-[#ffd60a]">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-12 flex flex-col xl:flex-row xl:items-end justify-between border-b-8 border-[#c1121f] pb-8 gap-6">
          <div>
            <Link href="/stats/select" className="text-xs font-black uppercase text-[#669bbc] hover:text-[#c1121f] mb-4 block tracking-widest">← STAT HUB</Link>
            <h1 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter text-[#001d3d] drop-shadow-[6px_6px_0px_#ffd60a]">
              {stats.year} {selectedLeague === 'all' ? 'GLOBAL' : 'LEAGUE'}
            </h1>
          </div>

          <div className="flex flex-col xl:items-end gap-4 w-full xl:w-auto">
            
            {/* TOP ROW: Dropdown Filters */}
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              
              <div className="bg-[#001d3d] p-1 border-4 border-[#001d3d] shadow-[4px_4px_0px_#c1121f] flex-1">
                <select 
                  value={selectedLeague} 
                  onChange={handleLeagueChange}
                  className="w-full bg-white text-[#001d3d] px-4 py-3 font-black italic uppercase text-sm outline-none cursor-pointer hover:bg-[#ffd60a] transition-all"
                >
                  <option value="all">ALL LEAGUES</option>
                  {leagues.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="bg-[#001d3d] p-1 border-4 border-[#001d3d] shadow-[4px_4px_0px_#c1121f]">
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)}
                  disabled={selectedLeague !== 'all'}
                  className="w-full bg-white text-[#001d3d] px-4 py-3 font-black italic uppercase text-sm outline-none cursor-pointer hover:bg-[#ffd60a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="bg-[#001d3d] p-1 border-4 border-[#001d3d] shadow-[4px_4px_0px_#c1121f] flex-1">
                <select 
                  value={pitchStyle} 
                  onChange={(e) => setPitchStyle(e.target.value)}
                  className="w-full bg-white text-[#001d3d] px-4 py-3 font-black italic uppercase text-sm outline-none cursor-pointer hover:bg-[#ffd60a] transition-all"
                >
                  <option value="all">ALL SPEEDS</option>
                  <option value="fast">FAST PITCH</option>
                  <option value="medium">MEDIUM PITCH</option>
                </select>
              </div>
            </div>

            {/* BOTTOM ROW: Controls */}
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-between xl:justify-end mt-2">
              <button 
                onClick={exportToCSV} 
                className="bg-[#2b9348] text-white px-6 py-3 font-black italic uppercase text-sm border-4 border-[#001d3d] shadow-[8px_8px_0px_#c1121f] hover:bg-white hover:text-[#2b9348] transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                EXPORT CSV
              </button>

              <div className="flex bg-[#001d3d] border-4 border-[#001d3d] shadow-[8px_8px_0px_#c1121f]">
                <button onClick={() => { setViewMode('batters'); setSortConfig({key: 'ops', direction: 'desc'}); }} 
                  className={`px-8 py-4 font-black italic uppercase text-sm transition-all w-1/2 sm:w-auto ${viewMode === 'batters' ? 'bg-[#ffd60a] text-[#001d3d]' : 'text-white hover:text-[#ffd60a]'}`}>HITTING</button>
                <button onClick={() => { setViewMode('pitchers'); setSortConfig({key: 'era', direction: 'asc'}); }} 
                  className={`px-8 py-4 font-black italic uppercase text-sm transition-all w-1/2 sm:w-auto ${viewMode === 'pitchers' ? 'bg-[#ffd60a] text-[#001d3d]' : 'text-white hover:text-[#ffd60a]'}`}>PITCHING</button>
              </div>
            </div>

          </div>
        </header>

        {loading ? (
          <div className="py-20 text-center font-black uppercase text-[#001d3d] animate-pulse italic text-4xl">LOADING STATS...</div>
        ) : (
          <div className="bg-white border-4 border-[#001d3d] overflow-x-auto shadow-[12px_12px_0px_#ffd60a]">
            <table className="w-full text-center border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-[#001d3d] text-[#fdf0d5]">
                  <th className="p-6 text-left font-black italic uppercase border-r border-[#fdf0d5]/10">Player</th>
                  <th className="p-6 font-black italic uppercase border-r border-[#fdf0d5]/10">League</th>
                  {/* NEW SPEED COLUMN HEADER */}
                  <th className="p-6 font-black italic uppercase border-r border-[#fdf0d5]/10">Speed</th>
                  
                  {viewMode === 'batters' ? (
                    <>
                      <SortHeader label="AB" k="ab" cur={sortConfig} req={requestSort} />
                      <SortHeader label="H" k="h" cur={sortConfig} req={requestSort} />
                      <SortHeader label="2B" k="d" cur={sortConfig} req={requestSort} />
                      <SortHeader label="3B" k="t" cur={sortConfig} req={requestSort} />
                      <SortHeader label="HR" k="hr" cur={sortConfig} req={requestSort} />
                      <SortHeader label="BB" k="bb" cur={sortConfig} req={requestSort} />
                      <SortHeader label="RBI" k="rbi" cur={sortConfig} req={requestSort} />
                      <SortHeader label="AVG" k="avg" cur={sortConfig} req={requestSort} />
                      <SortHeader label="OBP" k="obp" cur={sortConfig} req={requestSort} />
                      <SortHeader label="OPS" k="ops" cur={sortConfig} req={requestSort} />
                    </>
                  ) : (
                    <>
                      <SortHeader label="IP" k="ipRaw" cur={sortConfig} req={requestSort} />
                      <SortHeader label="K" k="k" cur={sortConfig} req={requestSort} />
                      <SortHeader label="H" k="h" cur={sortConfig} req={requestSort} />
                      <SortHeader label="BB" k="bb" cur={sortConfig} req={requestSort} />
                      <SortHeader label="HR" k="hr" cur={sortConfig} req={requestSort} />
                      <SortHeader label="R" k="r" cur={sortConfig} req={requestSort} />
                      <SortHeader label="WHIP" k="whip" cur={sortConfig} req={requestSort} />
                      <SortHeader label="ERA" k="era" cur={sortConfig} req={requestSort} />
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y-4 divide-[#fdf0d5]">
                {displayData.map((p, i) => (
                  <tr key={i} className="hover:bg-[#ffd60a]/10 transition-colors group">
                    <td className="p-6 text-left font-black italic uppercase text-2xl border-r-4 border-[#fdf0d5]">
                      <span className="text-[#c1121f] text-xs mr-4 not-italic font-bold">{i + 1}</span> 
                      <Link href={`/players/${p.id}`} className="hover:text-[#c1121f] hover:underline transition-all">
                        {p.name}
                      </Link>
                    </td>
                    <td className="p-6 border-r-4 border-[#fdf0d5]">
                      <span className="bg-[#669bbc] text-white px-4 py-1 font-black text-xs uppercase italic rounded-sm shadow-md">
                        {p.leagueDisplay}
                      </span>
                    </td>
                    {/* NEW SPEED DATA CELL */}
                    <td className="p-6 border-r-4 border-[#fdf0d5]">
                      <span className="bg-slate-600 text-white px-3 py-1 font-black text-[10px] uppercase italic rounded-sm shadow-md whitespace-nowrap">
                        {p.speedDisplay}
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
                        <td className="p-6 font-black text-xl">{p.whip}</td>
                        <td className="p-6 font-black text-[#c1121f] text-4xl group-hover:scale-110 transition-transform">{p.era}</td>
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
                        <td className="p-6 font-black text-xl">{p.avg}</td>
                        <td className="p-6 font-black text-xl">{p.obp}</td>
                        <td className="p-6 font-black text-[#c1121f] text-4xl group-hover:scale-110 transition-transform">{p.ops}</td>
                      </>
                    )}
                  </tr>
                ))}
                {displayData.length === 0 && (
                  <tr>
                    <td colSpan={11} className="p-12 text-center text-xl font-bold text-slate-400 italic">No stats found for this filter combination.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SortHeader({ label, k, cur, req }: any) {
  const isActive = cur.key === k;
  return (
    <th 
      onClick={() => req(k)} 
      className={`p-4 font-black italic uppercase cursor-pointer transition-colors border-r border-[#fdf0d5]/10 hover:bg-[#ffd60a] hover:text-[#001d3d] ${
        isActive ? 'bg-[#ffd60a] text-[#001d3d]' : 'text-white'
      }`}
    >
      <div className="flex items-center justify-center gap-1">
        {label}
        {isActive && <span>{cur.direction === 'desc' ? '▼' : '▲'}</span>}
      </div>
    </th>
  );
}