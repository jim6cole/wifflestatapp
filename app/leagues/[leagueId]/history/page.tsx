'use client';
import { useState, useEffect, use } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function PublicHistorySelector({ params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = use(params);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/leagues/${leagueId}/seasons`)
      .then(res => res.json())
      .then(data => {
        setSeasons(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [leagueId]);

  // For history, we show COMPLETED seasons and ACTIVE ones (since active ones have finished games too)
  const availableSeasons = seasons.filter(s => s.status === 'COMPLETED' || s.status === 'ACTIVE');

  if (loading) return (
    <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black italic text-white text-5xl animate-pulse uppercase">
      Opening the Vault...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fdf0d5] text-[#001d3d] p-8 md:p-16 border-[16px] border-[#001d3d]">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-12 border-b-8 border-[#669bbc] pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <Link href={`/leagues/${leagueId}`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#c1121f] transition-colors mb-4 block">
              ← League Hub
            </Link>
            <h1 className="text-7xl md:text-8xl font-black italic uppercase text-[#001d3d] tracking-tighter leading-none">
              The <span className="text-[#669bbc]">Archives</span>
            </h1>
            <p className="text-[#c1121f] font-black uppercase text-xs tracking-[0.4em] mt-4">Select Season to View Box Scores</p>
          </div>
        </header>

        {/* SEASON LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {availableSeasons.map(s => (
            <Link 
              key={s.id} 
              href={`/leagues/${leagueId}/history/${s.id}`} 
              className={`group p-10 border-4 border-[#001d3d] transition-all hover:-translate-y-2 flex flex-col justify-between min-h-[200px] ${
                s.status === 'ACTIVE' 
                  ? 'bg-white shadow-[12px_12px_0px_#22c55e]' 
                  : 'bg-slate-100 shadow-[12px_12px_0px_#669bbc]'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 border-2 ${
                  s.status === 'ACTIVE' ? 'bg-[#22c55e] text-white border-[#001d3d]' : 'bg-slate-400 text-white border-[#001d3d]'
                }`}>
                  {s.status}
                </span>
                <span className="text-2xl font-black text-[#001d3d] group-hover:translate-x-2 transition-transform italic">↗</span>
              </div>
              
              <div>
                <h2 className="text-4xl font-black italic uppercase text-[#001d3d] leading-tight group-hover:text-[#c1121f]">
                  {s.name}
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#669bbc] mt-2">
                  {s.isTournament ? 'Tournament Event' : 'League Season'}
                </p>
              </div>
            </Link>
          ))}

          {availableSeasons.length === 0 && (
            <div className="col-span-full py-20 border-4 border-dashed border-[#001d3d]/10 text-center">
              <p className="text-slate-400 font-black uppercase italic text-2xl">No recorded history found.</p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer className="mt-16 text-center border-t-4 border-[#001d3d]/5 pt-8">
          <p className="text-[9px] font-black uppercase text-[#669bbc] tracking-[0.4em] opacity-50">
            Powered by WIFF+ // Official League Records
          </p>
        </footer>
      </div>
    </div>
  );
}