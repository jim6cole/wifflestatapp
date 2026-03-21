'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function GlobalLeagueManager() {
  const [leagues, setLeagues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Safety States
  const [nukeTarget, setNukeTarget] = useState<number | null>(null);
  const [nukeConfirm, setNukeConfirm] = useState(false);

  useEffect(() => { fetchLeagues(); }, []);

  async function fetchLeagues() {
    const res = await fetch('/api/admin/leagues/all');
    if (res.ok) setLeagues(await res.json());
    setLoading(false);
  }

  const toggleArchive = async (league: any) => {
    const res = await fetch(`/api/admin/leagues/${league.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !league.isActive }),
    });
    if (res.ok) fetchLeagues();
  };

  const executeNuke = async (id: number) => {
    const res = await fetch(`/api/admin/leagues/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setLeagues(leagues.filter(l => l.id !== id));
      setNukeTarget(null);
      setNukeConfirm(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center italic text-white animate-pulse">Scanning Satellite Feeds...</div>;

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] font-sans p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 border-b-4 border-[#669bbc] pb-6 flex justify-between items-end">
          <div>
            <Link href="/admin/dashboard" className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white transition-colors">← System Root</Link>
            <h1 className="text-7xl font-black italic uppercase tracking-tighter text-white mt-4">Affiliate Map</h1>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {leagues.map((league) => (
            <div key={league.id} className={`bg-[#003566] border-2 ${league.isActive ? 'border-[#669bbc]' : 'border-slate-800 opacity-70'} p-8 shadow-2xl relative group transition-all`}>
              {/* STATUS BADGE */}
              <div className={`absolute top-0 right-0 p-4 font-black italic skew-x-[-15deg] transform translate-x-2 -translate-y-2 border-b border-l z-10 ${league.isActive ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                {league.isActive ? 'ACTIVE' : 'ARCHIVED'}
              </div>

              <h2 className="text-4xl font-black italic uppercase text-white mb-2 truncate pr-20">{league.name}</h2>
              <p className="text-sm font-bold uppercase text-[#669bbc] mb-6 tracking-widest">ID: {league.id}</p>

              <div className="grid grid-cols-2 gap-4">
                <InterceptLink title="Manage" href={`/admin/leagues/${league.id}`} />
                <button 
                  onClick={() => toggleArchive(league)}
                  className="bg-black/20 border border-white/10 p-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all"
                >
                  {league.isActive ? 'Archive League' : 'Unarchive League'}
                </button>

                {/* DANGER ZONE: PERMANENT DELETE */}
                <div className="col-span-2 pt-4 border-t border-white/5 mt-2">
                  {nukeTarget !== league.id ? (
                    <button onClick={() => setNukeTarget(league.id)} className="text-[9px] font-black uppercase text-red-600/50 hover:text-red-500 tracking-tighter transition-colors">
                      Permanent Delete (Test Leagues Only)
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
                      {!nukeConfirm ? (
                        <button onClick={() => setNukeConfirm(true)} className="flex-1 bg-red-600 text-white p-2 text-[10px] font-black uppercase animate-pulse">
                          Confirm Data Wipe?
                        </button>
                      ) : (
                        <button onClick={() => executeNuke(league.id)} className="flex-1 bg-white text-red-600 p-2 text-[10px] font-black uppercase border-2 border-red-600">
                          ERASE DATABASE RECORD
                        </button>
                      )}
                      <button onClick={() => { setNukeTarget(null); setNukeConfirm(false); }} className="px-4 text-[10px] font-bold text-slate-500 uppercase">Cancel</button>
                    </div>
                  )}
                </div>
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
    <Link href={href} className="bg-[#c1121f] border border-[#fdf0d5] p-3 text-center text-[10px] font-black uppercase tracking-widest text-white hover:bg-white hover:text-[#c1121f] transition-all flex items-center justify-center min-h-[50px]">
      {title}
    </Link>
  );
}