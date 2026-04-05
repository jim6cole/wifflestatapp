'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function PublicStatsSeasonSelector() {
  const { leagueId } = useParams();
  const [seasons, setSeasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leagueId) return;
    fetch(`/api/public/leagues/${leagueId}/seasons`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const sortedSeasons = [...data].sort((a, b) => {
            if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
            if (b.status === 'ACTIVE' && a.status !== 'ACTIVE') return 1;
            const yearDiff = (b.year || 0) - (a.year || 0);
            if (yearDiff !== 0) return yearDiff;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          setSeasons(sortedSeasons);
        } else {
          setSeasons([]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [leagueId]);

  return (
    <div className="min-h-screen bg-[#fdf0d5] p-8 md:p-24 border-[16px] border-[#c1121f] flex flex-col items-center">
      <div className="max-w-4xl w-full">
        <header className="mb-12 border-b-8 border-[#001d3d] pb-8">
          <Link href={`/leagues/${leagueId}`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#c1121f] transition-colors">
            ← League Hub
          </Link>
          <h1 className="text-7xl md:text-9xl font-black italic uppercase text-[#001d3d] tracking-tighter mt-4">
            League Stats
          </h1>
        </header>

        <div className="flex flex-col gap-8 w-full">
          {/* THE GLOBAL STATS HERO BUTTON */}
          <Link 
            href={`/leagues/${leagueId}/stats/lifetime`}
            className="group relative bg-[#001d3d] border-8 border-[#c1121f] p-10 overflow-hidden shadow-[12px_12px_0px_#ffd60a] hover:-translate-y-2 transition-transform w-full text-left"
          >
             <div className="relative z-10">
               <h2 className="text-4xl md:text-6xl font-black uppercase italic text-white mb-2 group-hover:text-[#ffd60a] transition-colors">
                  Lifetime Global Stats
               </h2>
               <p className="text-[#669bbc] font-bold uppercase tracking-widest text-xs">
                  View aggregated records and career leaderboards across all seasons.
               </p>
             </div>
             <div className="absolute right-10 top-1/2 -translate-y-1/2 text-8xl font-black italic text-white/5 group-hover:text-white/10 transition-all pointer-events-none">
                HISTORY
             </div>
          </Link>

          <div className="w-full">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-[#c1121f] mb-6 italic">Or Select a Specific Season</h2>
            
            {loading ? (
              <div className="text-4xl font-black italic uppercase animate-pulse text-[#001d3d]">Retrieving Archives...</div>
            ) : (
              <div className="grid gap-6">
                {seasons.length === 0 ? (
                  <div className="p-12 border-4 border-dashed border-[#001d3d]/20 text-center">
                     <p className="text-[#001d3d]/50 font-black uppercase italic text-xl">No season stats available yet.</p>
                  </div>
                ) : (
                  seasons.map((s) => (
                    <Link 
                      key={s.id} 
                      href={`/leagues/${leagueId}/stats/${s.id}`} 
                      className="group bg-white border-4 border-[#001d3d] p-8 shadow-[10px_10px_0px_#001d3d] hover:shadow-[10px_10px_0px_#ffd60a] hover:-translate-y-1 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div>
                        <h3 className="text-3xl md:text-5xl font-black italic uppercase text-[#001d3d] group-hover:text-[#c1121f] transition-colors">
                          {s.name}
                        </h3>
                        <div className="flex flex-wrap gap-4 mt-2 items-center">
                          <span className={`text-[9px] font-black uppercase px-2 py-1 ${
                            s.status === 'ACTIVE' ? 'bg-green-500 text-white' : 
                            s.status === 'HISTORIC' ? 'bg-[#c1121f] text-white' : 
                            'bg-slate-200 text-slate-500'
                          }`}>
                            {s.status}
                          </span>
                          <span className="text-[9px] font-black uppercase text-[#669bbc] tracking-widest">
                            {s.year ? `Year: ${s.year}` : (s.isTournament ? 'Tournament' : 'Regular Season')}
                          </span>
                        </div>
                      </div>
                      <span className="text-3xl font-black text-[#001d3d] group-hover:translate-x-3 transition-transform italic">GO</span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}