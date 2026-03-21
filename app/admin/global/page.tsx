'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function GlobalLeagueManager() {
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeagues() {
      try {
        const res = await fetch('/api/admin/leagues/all');
        if (res.ok) {
          const data = await res.json();
          setLeagues(data);
        }
      } catch (error) {
        console.error("Failed to fetch leagues:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLeagues();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#001d3d] flex items-center justify-center">
        <p className="text-2xl font-black italic uppercase animate-pulse text-white">Initializing Affiliate Map...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] font-sans p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 border-b-4 border-[#669bbc] pb-6">
          <Link href="/admin/dashboard" className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white transition-colors">← System Root</Link>
          <h1 className="text-7xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f] mt-4">
            Affiliate Map
          </h1>
          <p className="text-[#669bbc] font-bold uppercase text-xs tracking-[0.4em] mt-2">Global Command // Select League to Intercept</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {leagues.map((league) => (
            <div key={league.id} className="bg-[#003566] border-2 border-[#669bbc] p-8 shadow-2xl relative group overflow-hidden hover:border-[#fdf0d5] transition-all">
              {/* League ID Badge */}
              <div className="absolute top-0 right-0 p-4 bg-[#c1121f] text-white font-black italic skew-x-[-15deg] transform translate-x-2 -translate-y-2 border-b border-l border-[#fdf0d5] z-10">
                ID: {league.id}
              </div>
              
              <h2 className="text-4xl font-black italic uppercase text-white mb-2 truncate pr-12">{league.name}</h2>
              <p className="text-sm font-bold uppercase text-[#669bbc] mb-6 tracking-widest">{league.fullName || 'No Designation'}</p>
              
              <div className="grid grid-cols-2 gap-4">
                {/* UPDATED SETTINGS LINK */}
                <InterceptLink title="Settings" href={`/admin/leagues/${league.id}`} />
                <InterceptLink title="Seasons" href={`/admin/leagues/${league.id}/seasons`} />
                <InterceptLink title="Stats" href={`/admin/leagues/${league.id}/stats`} />
                <InterceptLink title="Games" href={`/admin/leagues/${league.id}/games`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InterceptLink({ title, href }: { title: string, href: string }) {
  return (
    <Link 
      href={href} 
      className="bg-[#001d3d] border border-[#669bbc]/30 p-3 text-center text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#669bbc] hover:text-[#001d3d] transition-all flex items-center justify-center min-h-[50px]"
    >
      {title}
    </Link>
  );
}