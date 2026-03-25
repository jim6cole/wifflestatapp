'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LeagueSelector() {
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/leagues')
      .then(res => res.json())
      .then(data => {
        setLeagues(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#fdf0d5] p-8 md:p-24 border-[16px] border-[#001d3d] flex flex-col items-center">
      <div className="max-w-4xl w-full">
        <header className="mb-16 border-b-8 border-[#c1121f] pb-8 flex justify-between items-end">
          <div>
            <Link href="/" className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#c1121f] transition-colors">
              ← Main Menu
            </Link>
            <h1 className="text-7xl md:text-9xl font-black italic uppercase text-[#001d3d] tracking-tighter mt-4">
              Select League
            </h1>
          </div>
        </header>

        {loading ? (
          <div className="text-4xl font-black italic uppercase animate-pulse text-[#001d3d]">Scanning Affiliates...</div>
        ) : (
          <div className="grid gap-6">
            {leagues.map((league) => (
              <Link 
                key={league.id} 
                href={`/leagues/${league.id}`} 
                className="group bg-white border-4 border-[#001d3d] p-10 shadow-[12px_12px_0px_#c1121f] hover:shadow-[12px_12px_0px_#ffd60a] hover:-translate-y-1 transition-all flex justify-between items-center"
              >
                <div>
                  <h2 className="text-4xl md:text-6xl font-black italic uppercase text-[#001d3d] group-hover:text-[#c1121f] transition-colors">
                    {league.name}
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#669bbc] mt-2 italic">
                    WIFF+ Certified Organization
                  </p>
                </div>
                <span className="text-4xl font-black text-[#001d3d] group-hover:translate-x-4 transition-transform italic">↗</span>
              </Link>
            ))}
            {leagues.length === 0 && <p className="text-slate-400 font-bold uppercase italic">No leagues found in system.</p>}
          </div>
        )}
      </div>
    </div>
  );
}