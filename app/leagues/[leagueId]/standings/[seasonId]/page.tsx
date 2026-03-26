'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function SeasonStandingsPage() {
  const params = useParams();
  const leagueId = params.leagueId as string;
  const seasonId = params.seasonId as string;

  const [standings, setStandings] = useState<any[]>([]);
  const [seasonName, setSeasonName] = useState('Season');
  const [loading, setLoading] = useState(true);

  // Sorting State (Null by default so it uses the API's official W -> PCT -> RD formula initially)
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    if (!seasonId) return;
    setLoading(true);
    
    fetch(`/api/public/seasons/${seasonId}/standings`)
      .then(res => res.json())
      .then(data => {
        setStandings(data.standings || []);
        setSeasonName(data.seasonName || 'Standings');
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load standings", err);
        setLoading(false);
      });
  }, [seasonId]);

  // --- SORTING LOGIC ---
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc'; // Default to highest first
    if (key === 'name' || key === 'ra') direction = 'asc'; // Names and Runs Against default to lowest first
    
    if (sortConfig?.key === key) {
      direction = sortConfig.direction === 'desc' ? 'asc' : 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortArray = (data: any[]) => {
    if (!sortConfig) return data; // Keep API's complex tie-breaker sort if no header clicked

    return [...data].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Special handling for Win Percentage (Use the raw float, not the '.500' string)
      if (sortConfig.key === 'pct') {
        aVal = a.pctValue;
        bVal = b.pctValue;
      }

      // Special handling for Streaks (Convert W3 to +3, L2 to -2 for proper math sorting)
      if (sortConfig.key === 'streak') {
        const parseStreak = (s: string) => {
          if (!s || s === '-') return 0;
          const num = parseInt(s.substring(1));
          return s.startsWith('W') ? num : -num;
        };
        aVal = parseStreak(a.streak);
        bVal = parseStreak(b.streak);
      }

      // Standard number conversion
      if (typeof aVal === 'string' && !isNaN(parseFloat(aVal))) aVal = parseFloat(aVal);
      if (typeof bVal === 'string' && !isNaN(parseFloat(bVal))) bVal = parseFloat(bVal);

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedStandings = sortArray(standings);

  const SortIndicator = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return null;
    return <span className="ml-2 text-[#c1121f]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="min-h-screen bg-[#fdf0d5] text-[#001d3d] p-4 md:p-12 border-[16px] border-[#001d3d]">
      <div className="max-w-[1400px] mx-auto">
        
        {/* --- HEADER --- */}
        <header className="mb-12 border-b-8 border-[#c1121f] pb-6">
          <Link href={`/leagues/${leagueId}/standings`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#c1121f] mb-4 block transition-colors">
            ← STANDINGS HUB
          </Link>
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter drop-shadow-[6px_6px_0px_#ffd60a]">
            {seasonName} Standings
          </h1>
        </header>

        {/* --- STANDINGS TABLE --- */}
        <div className="bg-white border-4 border-[#001d3d] shadow-[12px_12px_0px_#000] overflow-hidden min-h-[400px]">
          {loading ? (
             <div className="flex items-center justify-center h-full py-32 font-black italic text-4xl text-[#001d3d] animate-pulse uppercase tracking-tighter">
               Calculating Records...
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-[#001d3d] text-[#ffd60a] text-sm md:text-lg font-black uppercase italic tracking-widest select-none">
                  <tr>
                    <th className="p-4 md:p-6 border-r border-white/10 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort('name')}>
                      Team <SortIndicator columnKey="name" />
                    </th>
                    <th className="p-4 md:p-6 text-center opacity-70 cursor-pointer hover:bg-white/10" onClick={() => handleSort('w')}>
                      W <SortIndicator columnKey="w" />
                    </th>
                    <th className="p-4 md:p-6 text-center opacity-70 cursor-pointer hover:bg-white/10" onClick={() => handleSort('l')}>
                      L <SortIndicator columnKey="l" />
                    </th>
                    <th className="p-4 md:p-6 text-center text-[#669bbc] cursor-pointer hover:bg-white/10" onClick={() => handleSort('t')}>
                      T <SortIndicator columnKey="t" />
                    </th>
                    <th className="p-4 md:p-6 text-center text-[#ffd60a] cursor-pointer hover:bg-white/10" onClick={() => handleSort('pct')}>
                      PCT <SortIndicator columnKey="pct" />
                    </th>
                    <th className="p-4 md:p-6 text-center cursor-pointer hover:bg-white/10" onClick={() => handleSort('streak')}>
                      STRK <SortIndicator columnKey="streak" />
                    </th>
                    <th className="p-4 md:p-6 text-center opacity-50 cursor-pointer hover:bg-white/10" onClick={() => handleSort('rf')}>
                      RF <SortIndicator columnKey="rf" />
                    </th>
                    <th className="p-4 md:p-6 text-center opacity-50 cursor-pointer hover:bg-white/10" onClick={() => handleSort('ra')}>
                      RA <SortIndicator columnKey="ra" />
                    </th>
                    <th className="p-4 md:p-6 text-center text-[#c1121f] cursor-pointer hover:bg-white/10" onClick={() => handleSort('rd')}>
                      RD <SortIndicator columnKey="rd" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedStandings.map((team, idx) => (
                    <tr key={team.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 md:p-6 font-black italic uppercase text-xl md:text-3xl border-r border-slate-100 flex items-center gap-4">
                        <span className="text-slate-300 tabular-nums w-8 text-right">
                          {/* Only show numeric rank if using the default API sort */}
                          {!sortConfig ? idx + 1 : '-'}
                        </span>
                        <span className="text-[#001d3d] tracking-tighter">{team.name}</span>
                      </td>
                      
                      {/* Record */}
                      <td className="p-4 md:p-6 text-center font-black text-2xl tabular-nums">{team.w}</td>
                      <td className="p-4 md:p-6 text-center font-black text-2xl tabular-nums">{team.l}</td>
                      <td className="p-4 md:p-6 text-center font-black text-[#669bbc] text-2xl tabular-nums">{team.t}</td>
                      
                      {/* Percentage */}
                      <td className="p-4 md:p-6 text-center font-black text-[#003566] text-3xl font-mono tabular-nums bg-[#ffd60a]/10">{team.pct}</td>
                      
                      {/* Streak */}
                      <td className={`p-4 md:p-6 text-center font-black text-xl tabular-nums ${team.streak.startsWith('W') ? 'text-green-600' : team.streak.startsWith('L') ? 'text-[#c1121f]' : 'text-slate-500'}`}>
                        {team.streak}
                      </td>

                      {/* Run Data */}
                      <td className="p-4 md:p-6 text-center font-bold text-xl tabular-nums opacity-50">{team.rf}</td>
                      <td className="p-4 md:p-6 text-center font-bold text-xl tabular-nums opacity-50">{team.ra}</td>
                      
                      {/* Run Differential */}
                      <td className={`p-4 md:p-6 text-center font-black text-2xl tabular-nums bg-slate-50 ${team.rd > 0 ? 'text-green-600' : team.rd < 0 ? 'text-[#c1121f]' : 'text-slate-500'}`}>
                        {team.rd > 0 ? `+${team.rd}` : team.rd}
                      </td>
                    </tr>
                  ))}
                  {sortedStandings.length === 0 && (
                    <tr><td colSpan={9} className="p-12 text-center text-slate-400 font-bold italic uppercase">No games played in this season yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}