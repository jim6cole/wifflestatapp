'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function SeasonStandingsPage() {
  const params = useParams();
  const leagueId = params.leagueId as string;
  const seasonId = params.seasonId as string;

  const [standings, setStandings] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [seasonName, setSeasonName] = useState('Season');
  const [loading, setLoading] = useState(true);

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    if (!seasonId) return;
    setLoading(true);
    
    const url = `/api/public/seasons/${seasonId}/standings${selectedEventId ? `?eventId=${selectedEventId}` : ''}`;
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setStandings(data.standings || []);
        setSeasonName(data.seasonName || 'Standings');
        if (data.events) setEvents(data.events); 
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load standings", err);
        setLoading(false);
      });
  }, [seasonId, selectedEventId]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (key === 'name' || key === 'ra') direction = 'asc';
    if (sortConfig?.key === key) {
      direction = sortConfig.direction === 'desc' ? 'asc' : 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortArray = (data: any[]) => {
    if (!sortConfig) return data;
    return [...data].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'pct') { aVal = a.pctValue; bVal = b.pctValue; }
      if (sortConfig.key === 'streak') {
        const parseStreak = (s: string) => {
          if (!s || s === '-') return 0;
          const num = parseInt(s.substring(1));
          return s.startsWith('W') ? num : -num;
        };
        aVal = parseStreak(a.streak); bVal = parseStreak(b.streak);
      }
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
        
        <header className="mb-12 border-b-8 border-[#c1121f] pb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
          <div>
            <Link href={`/leagues/${leagueId}/standings`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#c1121f] mb-4 block transition-colors">
              ← STANDINGS HUB
            </Link>
            <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter drop-shadow-[6px_6px_0px_#ffd60a]">
              {seasonName}
            </h1>
          </div>

          <div className="bg-[#001d3d] p-4 border-4 border-[#001d3d] shadow-[4px_4px_0px_#c1121f] flex items-center gap-4">
             <label className="text-[10px] font-black uppercase text-[#ffd60a] italic">Filter By Event:</label>
             <select 
               value={selectedEventId} 
               onChange={(e) => setSelectedEventId(e.target.value)}
               className="bg-white border-2 border-[#ffd60a] px-3 py-2 text-xs font-black uppercase italic outline-none cursor-pointer hover:bg-[#fdf0d5] transition-colors min-w-[200px]"
             >
               <option value="">-- FULL SEASON STANDINGS --</option>
               {events.map(ev => (
                 <option key={ev.id} value={ev.id}>🏆 {ev.name}</option>
               ))}
             </select>
          </div>
        </header>

        <div className="bg-white border-4 border-[#001d3d] shadow-[12px_12px_0px_#000] overflow-hidden min-h-[400px]">
          {loading ? (
             <div className="flex items-center justify-center h-full py-32 font-black italic text-4xl text-[#001d3d] animate-pulse uppercase tracking-tighter">
               Syncing Stats...
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-[#001d3d] text-[#ffd60a] text-sm md:text-lg font-black uppercase italic tracking-widest select-none">
                  <tr>
                    <th className="p-4 md:p-6 border-r border-white/10 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => handleSort('name')}>Team <SortIndicator columnKey="name" /></th>
                    <th className="p-4 md:p-6 text-center opacity-70 cursor-pointer" onClick={() => handleSort('w')}>W <SortIndicator columnKey="w" /></th>
                    <th className="p-4 md:p-6 text-center opacity-70 cursor-pointer" onClick={() => handleSort('l')}>L <SortIndicator columnKey="l" /></th>
                    <th className="p-4 md:p-6 text-center text-[#669bbc] cursor-pointer" onClick={() => handleSort('t')}>T <SortIndicator columnKey="t" /></th>
                    <th className="p-4 md:p-6 text-center text-[#ffd60a] cursor-pointer" onClick={() => handleSort('pct')}>PCT <SortIndicator columnKey="pct" /></th>
                    <th className="p-4 md:p-6 text-center cursor-pointer" onClick={() => handleSort('streak')}>STRK <SortIndicator columnKey="streak" /></th>
                    <th className="p-4 md:p-6 text-center opacity-50 cursor-pointer" onClick={() => handleSort('rf')}>RF <SortIndicator columnKey="rf" /></th>
                    <th className="p-4 md:p-6 text-center opacity-50 cursor-pointer" onClick={() => handleSort('ra')}>RA <SortIndicator columnKey="ra" /></th>
                    <th className="p-4 md:p-6 text-center text-[#c1121f] cursor-pointer" onClick={() => handleSort('rd')}>RD <SortIndicator columnKey="rd" /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedStandings.map((team, idx) => (
                    <tr key={team.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 md:p-6 font-black italic uppercase text-xl md:text-3xl border-r border-slate-100 flex items-center gap-4">
                        <span className="text-slate-300 tabular-nums w-8 text-right">{!sortConfig ? idx + 1 : '-'}</span>
                        <Link 
                          href={`/leagues/${leagueId}/teams/${team.id}`}
                          className="text-[#001d3d] hover:text-[#c1121f] transition-colors tracking-tighter flex items-center gap-2 underline decoration-transparent hover:decoration-[#c1121f]"
                        >
                          {team.name}
                          {team.tournamentWins > 0 && (
                            <span className="text-[#ffd60a] text-xl not-italic flex" title={`${team.tournamentWins} Win(s)`}>
                              {Array(team.tournamentWins).fill('⭐').join('')}
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="p-4 md:p-6 text-center font-black text-2xl tabular-nums">{team.w}</td>
                      <td className="p-4 md:p-6 text-center font-black text-2xl tabular-nums">{team.l}</td>
                      <td className="p-4 md:p-6 text-center font-black text-[#669bbc] text-2xl tabular-nums">{team.t}</td>
                      <td className="p-4 md:p-6 text-center font-black text-[#003566] text-3xl font-mono tabular-nums bg-[#ffd60a]/10">{team.pct}</td>
                      <td className={`p-4 md:p-6 text-center font-black text-xl tabular-nums ${team.streak.startsWith('W') ? 'text-green-600' : team.streak.startsWith('L') ? 'text-[#c1121f]' : 'text-slate-500'}`}>{team.streak}</td>
                      <td className="p-4 md:p-6 text-center font-bold text-xl tabular-nums opacity-50">{team.rf}</td>
                      <td className="p-4 md:p-6 text-center font-bold text-xl tabular-nums opacity-50">{team.ra}</td>
                      <td className={`p-4 md:p-6 text-center font-black text-2xl tabular-nums bg-slate-50 ${team.rd > 0 ? 'text-green-600' : team.rd < 0 ? 'text-[#c1121f]' : 'text-slate-500'}`}>{team.rd > 0 ? `+${team.rd}` : team.rd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}