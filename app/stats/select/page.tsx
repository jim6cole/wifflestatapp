'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StatSelectHub() {
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/leagues', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setLeagues(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black uppercase text-white animate-pulse italic text-2xl">Preparing Statistics...</div>;

  return (
    <div className="p-8 md:p-16 bg-[#001d3d] min-h-screen text-[#fdf0d5] border-[12px] border-[#c1121f]">
      <div className="max-w-5xl mx-auto">
        
        <header className="mb-16 border-b-4 border-[#669bbc] pb-8">
          <Link href="/" className="text-[10px] font-black uppercase text-[#669bbc] hover:text-white mb-4 block tracking-widest">← Back to Launcher</Link>
          <h1 className="text-8xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f]">
            Stat Hub
          </h1>
        </header>

        {/* GLOBAL STATS FEATURE */}
        <Link href="/stats/global" className="block bg-black border-4 border-[#ffd60a] p-12 mb-12 shadow-[12px_12px_0px_#c1121f] group relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] text-[200px] opacity-10 italic font-black text-[#ffd60a] rotate-12">YEAR</div>
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <p className="text-[#ffd60a] font-black uppercase text-[10px] tracking-[0.5em] mb-2">Authorized Global Data</p>
              <h2 className="text-6xl md:text-7xl font-black italic uppercase text-white leading-none">Global Leaders</h2>
              <p className="text-slate-500 font-bold uppercase text-sm mt-4 tracking-widest">Combined stats for {new Date().getFullYear()} across all affiliates</p>
            </div>
            <span className="text-6xl group-hover:translate-x-4 transition-transform text-[#ffd60a]">→</span>
          </div>
        </Link>

        {/* LEAGUE LIST */}
        <h3 className="text-[10px] font-black uppercase text-[#669bbc] tracking-[0.4em] mb-6">Affiliate Stat Portals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {leagues.map((league) => (
            <Link 
              key={league.id} 
              href={`/leagues/${league.id}/stats`}
              className="bg-[#003566] border-2 border-[#669bbc] p-8 hover:border-white transition-all group"
            >
              <h4 className="text-3xl font-black italic uppercase text-white mb-1">{league.name}</h4>
              <p className="text-[10px] font-bold uppercase text-[#669bbc] tracking-widest">View League Leaders →</p>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}