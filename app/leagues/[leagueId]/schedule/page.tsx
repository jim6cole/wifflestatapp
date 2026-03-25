'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function PublicScheduleSelector() {
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

  const activeSeasons = seasons.filter(s => s.status === 'ACTIVE');
  const upcomingSeasons = seasons.filter(s => s.status === 'UPCOMING' || s.status === 'PLANNING');

  return (
    <div className="min-h-screen bg-[#fdf0d5] p-8 md:p-16 border-[16px] border-[#001d3d] flex flex-col items-center">
      <div className="max-w-5xl w-full">
        
        {/* HEADER */}
        <header className="mb-12 border-b-8 border-[#c1121f] pb-8 flex justify-between items-end">
          <div>
            <Link href={`/leagues/${leagueId}`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#c1121f] transition-colors">
              ← League Hub
            </Link>
            <h1 className="text-7xl md:text-8xl font-black italic uppercase text-[#001d3d] tracking-tighter mt-4">
              Schedules
            </h1>
          </div>
        </header>

        {loading ? (
          <div className="text-4xl font-black italic uppercase animate-pulse text-[#001d3d]">Synchronizing Calendar...</div>
        ) : (
          <div className="space-y-16">
            
            {/* ACTIVE SEASONS SECTION */}
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="h-1 w-12 bg-[#c1121f]"></div>
                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-[#c1121f] italic">Live Events & Tournaments</h2>
              </div>
              
              <div className="grid gap-6">
                {activeSeasons.map(s => (
                  <Link 
                    key={s.id} 
                    href={`/leagues/${leagueId}/schedule/${s.id}`} 
                    className="group bg-[#001d3d] p-10 text-white flex flex-col md:flex-row justify-between items-start md:items-center border-4 border-[#001d3d] shadow-[12px_12px_0px_#c1121f] hover:bg-[#c1121f] transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="w-3 h-3 bg-[#ffd60a] rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#ffd60a]">Live Now</span>
                      </div>
                      <h3 className="text-4xl md:text-5xl font-black italic uppercase leading-none group-hover:translate-x-2 transition-transform">
                        {s.name}
                      </h3>
                    </div>
                    <div className="mt-6 md:mt-0 bg-[#ffd60a] text-[#001d3d] px-6 py-3 font-black text-sm uppercase italic group-hover:bg-white transition-colors flex items-center gap-2">
                      Enter Gameday Board <span>↗</span>
                    </div>
                  </Link>
                ))}
                {activeSeasons.length === 0 && (
                  <div className="p-12 border-4 border-dashed border-[#001d3d]/10 text-center">
                    <p className="text-slate-400 font-black uppercase italic">No active games currently in progress.</p>
                  </div>
                )}
              </div>
            </section>

            {/* UPCOMING SEASONS SECTION */}
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="h-1 w-12 bg-[#669bbc]"></div>
                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-[#669bbc] italic">Upcoming Schedule</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {upcomingSeasons.map(s => (
                  <Link 
                    key={s.id} 
                    href={`/leagues/${leagueId}/schedule/${s.id}`} 
                    className="group bg-white border-4 border-[#001d3d] p-8 shadow-[8px_8px_0px_#669bbc] hover:shadow-[8px_8px_0px_#ffd60a] hover:-translate-y-1 transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest">
                        {s.isTournament ? 'Tournament' : 'Season'}
                      </span>
                      <span className="text-xl font-black text-[#001d3d] group-hover:text-[#669bbc]">↗</span>
                    </div>
                    <h3 className="text-3xl font-black italic uppercase text-[#001d3d]">
                      {s.name}
                    </h3>
                  </Link>
                ))}
              </div>
              {upcomingSeasons.length === 0 && activeSeasons.length === 0 && (
                <p className="text-slate-400 font-black uppercase italic text-center">Calendar is currently empty.</p>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}