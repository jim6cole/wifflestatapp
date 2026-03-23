'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LeaguesDirectory() {
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

  if (loading) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black uppercase text-white animate-pulse italic text-2xl">Accessing Directory...</div>;

  return (
    <div className="p-8 md:p-16 bg-[#001d3d] min-h-screen text-[#fdf0d5] border-[12px] border-[#c1121f]">
      <div className="max-w-6xl mx-auto">
        <header className="mb-16 border-b-4 border-[#669bbc] pb-8">
          <Link href="/" className="text-[10px] font-black uppercase text-[#669bbc] hover:text-white mb-4 block tracking-widest">← Back to Launcher</Link>
          <h1 className="text-8xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f]">
            Active Leagues
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {leagues.map((league) => (
            <Link 
              key={league.id} 
              href={`/leagues/${league.id}`}
              className="bg-[#003566] border-2 border-[#669bbc] p-8 hover:bg-[#c1121f] transition-all group shadow-xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-4xl font-black italic uppercase text-white leading-none group-hover:scale-105 transition-transform origin-left">
                  {league.name}
                </h2>
                <span className="text-xl text-[#669bbc] group-hover:text-white">→</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#669bbc] group-hover:text-red-200">
                📍 {league.location || 'Undisclosed Sector'}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}