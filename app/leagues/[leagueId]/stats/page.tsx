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
        setSeasons(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [leagueId]);

  return (
    <div className="min-h-screen bg-[#fdf0d5] p-8 md:p-24 border-[16px] border-[#c1121f] flex flex-col items-center">
      <div className="max-w-4xl w-full">
        <header className="mb-16 border-b-8 border-[#001d3d] pb-8">
          <Link href={`/leagues/${leagueId}`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#c1121f] transition-colors">
            ← League Hub
          </Link>
          <h1 className="text-7xl md:text-9xl font-black italic uppercase text-[#001d3d] tracking-tighter mt-4">
            League Stats
          </h1>
        </header>

        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-[#c1121f] mb-8 italic">Select Season to View Leaderboards</h2>

        {loading ? (
          <div className="text-4xl font-black italic uppercase animate-pulse text-[#001d3d]">Retrieving Archives...</div>
        ) : (
          <div className="grid gap-6">
            {seasons.map((s) => (
              <Link 
                key={s.id} 
                href={`/leagues/${leagueId}/stats/${s.id}`} 
                className="group bg-white border-4 border-[#001d3d] p-10 shadow-[12px_12px_0px_#001d3d] hover:shadow-[12px_12px_0px_#ffd60a] hover:-translate-y-1 transition-all flex justify-between items-center"
              >
                <div>
                  <h3 className="text-4xl md:text-6xl font-black italic uppercase text-[#001d3d] group-hover:text-[#c1121f] transition-colors">
                    {s.name}
                  </h3>
                  <div className="flex gap-4 mt-2">
                    <span className={`text-[10px] font-black uppercase px-2 py-1 ${s.status === 'ACTIVE' ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                      {s.status}
                    </span>
                    <span className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest self-center">
                      {s.isTournament ? 'Tournament' : 'Regular Season'}
                    </span>
                  </div>
                </div>
                <span className="text-4xl font-black text-[#001d3d] group-hover:translate-x-4 transition-transform italic">GO</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}