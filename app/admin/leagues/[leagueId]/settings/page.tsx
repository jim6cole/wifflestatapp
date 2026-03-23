'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LeagueSettings({ params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = use(params);
  const router = useRouter();
  
  const [league, setLeague] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteInput, setDeleteInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/leagues/${leagueId}`)
      .then(res => res.json())
      .then(data => {
        setLeague(data);
        setLoading(false);
      });
  }, [leagueId]);

  const toggleStatus = async (isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/leagues/${leagueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });
      if (res.ok) {
        setLeague({ ...league, isActive });
        router.refresh(); // Refresh dashboard states
      }
    } catch (error) {
      alert("Failed to update status.");
    }
  };

  const handleDelete = async () => {
    if (deleteInput !== league.name) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/leagues/${leagueId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        alert("Failed to delete league. Ensure you have Root or Commish access.");
        setIsDeleting(false);
      }
    } catch (error) {
      alert("Error processing deletion.");
      setIsDeleting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#fdf0d5] flex items-center justify-center font-black uppercase text-[#001d3d] animate-pulse italic text-2xl">Accessing Network...</div>;

  return (
    <div className="min-h-screen bg-[#fdf0d5] text-[#001d3d] font-sans p-8 md:p-16 border-[16px] border-[#001d3d]">
      <div className="max-w-4xl mx-auto">
        
        <header className="mb-12 border-b-8 border-[#c1121f] pb-8">
          <Link href="/admin/dashboard" className="text-xs font-black uppercase text-[#669bbc] hover:text-[#c1121f] mb-4 block tracking-widest">
            ← Back to Operations
          </Link>
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-[#001d3d] drop-shadow-[4px_4px_0px_#ffd60a] leading-none">
            Settings
          </h1>
          <p className="text-[#c1121f] font-black uppercase text-sm tracking-[0.4em] mt-3 italic">{league.name} Directory</p>
        </header>

        <div className="space-y-12">
          
          {/* STATUS TOGGLE */}
          <section className="bg-white border-4 border-[#001d3d] p-8 shadow-[12px_12px_0px_#ffd60a]">
            <h2 className="text-3xl font-black italic uppercase text-[#001d3d] mb-2">Network Status</h2>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Control public visibility in the global directory.</p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => toggleStatus(true)}
                className={`flex-1 p-6 font-black italic uppercase text-xl border-4 transition-all ${league.isActive ? 'bg-[#001d3d] text-white border-[#001d3d] shadow-inner' : 'bg-white text-slate-400 border-slate-200 hover:border-[#001d3d]'}`}
              >
                Active (Live)
              </button>
              <button 
                onClick={() => toggleStatus(false)}
                className={`flex-1 p-6 font-black italic uppercase text-xl border-4 transition-all ${!league.isActive ? 'bg-[#c1121f] text-white border-[#c1121f] shadow-inner' : 'bg-white text-slate-400 border-slate-200 hover:border-[#c1121f]'}`}
              >
                Retired (Archived)
              </button>
            </div>
            
            {!league.isActive && (
              <div className="mt-6 p-4 bg-[#c1121f]/10 border-2 border-[#c1121f] text-[#c1121f]">
                <p className="font-black text-xs uppercase tracking-widest">⚠️ This league is currently hidden from the public launcher.</p>
              </div>
            )}
          </section>

          {/* DANGER ZONE */}
          <section className="bg-[#001d3d] border-4 border-[#c1121f] p-8 shadow-[12px_12px_0px_#c1121f] mt-16">
            <h2 className="text-3xl font-black italic uppercase text-white mb-2">Danger Zone</h2>
            <p className="text-sm font-bold text-[#c1121f] uppercase tracking-widest mb-6">Permanent destructive actions.</p>
            
            <div className="bg-black/30 border border-[#c1121f]/50 p-6 space-y-4">
              <p className="text-white font-bold text-sm">
                Deleting this league will permanently erase all associated <span className="text-[#ffd60a]">Seasons, Teams, Games, At-Bats, and Stats</span>. This cannot be undone.
              </p>
              
              <div className="pt-4">
                <label className="block text-[10px] font-black uppercase text-[#669bbc] mb-2 tracking-widest">
                  Type <span className="text-white">"{league.name}"</span> to confirm
                </label>
                <input 
                  type="text" 
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  className="w-full bg-black border-2 border-[#669bbc] p-4 text-xl font-black uppercase text-white outline-none focus:border-[#c1121f] transition-colors"
                  placeholder="League Name"
                />
              </div>

              <button 
                onClick={handleDelete}
                disabled={deleteInput !== league.name || isDeleting}
                className="w-full mt-4 bg-[#c1121f] text-white font-black italic uppercase p-5 border-2 border-[#c1121f] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white hover:text-[#c1121f] transition-colors"
              >
                {isDeleting ? 'PURGING DATA...' : 'PERMANENTLY DELETE LEAGUE'}
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}