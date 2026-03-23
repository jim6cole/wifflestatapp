'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function GlobalStaffApprovals() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/admin/staff', { cache: 'no-store' });
      if (res.ok) setRequests(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleUpdate = async (id: number, isApproved: boolean, roleLevel: number) => {
    try {
      const res = await fetch(`/api/admin/leagues/all/staff`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId: id, isApproved, roleLevel })
      });
      if (res.ok) fetchRequests();
    } catch (err) { alert("Couldn't process that call."); }
  };

  const pending = requests.filter(r => !r.isApproved);
  const approved = requests.filter(r => r.isApproved);

  if (loading) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black uppercase text-white animate-pulse italic text-2xl">Checking the Dugout...</div>;

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] font-sans p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-16 border-b-4 border-[#669bbc] pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <Link href="/admin/dashboard" className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white block mb-4">
              ← Back to Home Base
            </Link>
            <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f] leading-none">
              Signings
            </h1>
            <p className="text-[#ffd60a] font-black uppercase text-xs tracking-[0.4em] mt-3 italic">Who's joining the crew?</p>
          </div>
          
          <div className="bg-[#c1121f] border-4 border-white p-6 shadow-[8px_8px_0px_#000] skew-x-[-15deg]">
            <p className="text-[10px] font-black uppercase tracking-widest skew-x-[15deg]">On Deck</p>
            <p className="text-4xl font-black uppercase italic skew-x-[15deg] text-white">{pending.length} <span className="text-xs opacity-50">Waiting</span></p>
          </div>
        </header>

        <div className="space-y-16">
          <section>
            <h2 className="text-3xl font-black italic uppercase text-white mb-8 border-b-4 border-[#ffd60a] pb-2 inline-block">
              Needs a Call
            </h2>
            {pending.length === 0 ? (
              <div className="bg-[#003566] border-4 border-dashed border-[#669bbc] p-12 text-center opacity-40">
                <p className="text-xl font-black uppercase italic text-white">Dugout is empty!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {pending.map(req => (
                  <StaffCard key={req.id} req={req} onUpdate={handleUpdate} />
                ))}
              </div>
            )}
          </section>

          <section className="opacity-80">
            <h2 className="text-2xl font-black italic uppercase text-[#669bbc] mb-8 border-b-2 border-white/10 pb-2 inline-block">
              In the Game
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {approved.map(req => (
                <StaffCard key={req.id} req={req} onUpdate={handleUpdate} compact />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StaffCard({ req, onUpdate, compact = false }: any) {
  return (
    <div className={`bg-[#003566] border-4 ${req.isApproved ? 'border-[#669bbc]' : 'border-[#ffd60a] animate-bounce-short'} p-6 flex flex-col lg:flex-row justify-between items-center gap-6 shadow-[8px_8px_0px_#000]`}>
      <div className="flex-1 text-center lg:text-left">
        <p className="text-[10px] font-black uppercase text-[#ffd60a] mb-1 tracking-widest">{req.league.name}</p>
        <h3 className={`${compact ? 'text-xl' : 'text-3xl'} font-black italic uppercase text-white`}>{req.user.name}</h3>
        <p className="text-xs font-bold text-[#669bbc] uppercase mt-1">{req.user.email}</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
        <select 
          value={req.roleLevel}
          onChange={(e) => onUpdate(req.id, req.isApproved, parseInt(e.target.value))}
          className="bg-[#001d3d] border-2 border-[#ffd60a] text-white p-3 font-black uppercase text-[10px] outline-none cursor-pointer w-full sm:w-auto"
        >
          <option value="1">Scorekeeper</option>
          <option value="2">Coach (Commish)</option>
        </select>

        <button 
          onClick={() => onUpdate(req.id, !req.isApproved, req.roleLevel)}
          className={`w-full sm:w-auto px-8 py-3 font-black uppercase italic text-xs tracking-widest transition-all border-4 ${
            req.isApproved 
              ? 'border-[#c1121f] text-[#c1121f] hover:bg-[#c1121f] hover:text-white' 
              : 'bg-[#ffd60a] border-white text-[#001d3d] hover:scale-105 shadow-[4px_4px_0px_#c1121f]'
          }`}
        >
          {req.isApproved ? 'Cut' : 'Sign \'em!'}
        </button>
      </div>
    </div>
  );
}