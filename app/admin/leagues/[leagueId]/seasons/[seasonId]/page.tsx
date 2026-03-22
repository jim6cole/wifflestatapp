'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function SeasonDashboard({ params }: { params: Promise<{ leagueId: string, seasonId: string }> }) {
  const { leagueId, seasonId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;

  const [season, setSeason] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchSeason();
  }, [seasonId]);

  async function fetchSeason() {
    const res = await fetch(`/api/admin/seasons/${seasonId}`, { cache: 'no-store' });
    if (res.ok) setSeason(await res.json());
    setLoading(false);
  }

  const updateStatus = async (newStatus: string) => {
    const res = await fetch(`/api/admin/seasons/${seasonId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) fetchSeason();
  }

  const deleteSeason = async () => {
    if (!confirm("CRITICAL WARNING: This will permanently erase this season and all associated games. Proceed?")) return;
    setIsDeleting(true);
    const res = await fetch(`/api/admin/seasons/${seasonId}`, { method: 'DELETE' });
    if (res.ok) router.push(`/admin/leagues/${leagueId}`);
    else {
      alert("Purge failed. Season must be empty of games before deletion.");
      setIsDeleting(false);
    }
  };

  if (loading || isDeleting) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black text-white animate-pulse italic text-2xl">PROCESSING...</div>;

  const isCompleted = season?.status === 'COMPLETED';
  const isActive = season?.status === 'ACTIVE';

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-16 border-b-4 border-[#669bbc] pb-8 relative">
          <Link href={`/admin/leagues/${leagueId}`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white transition-colors mb-4 block">
            ← Back to League Hub
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f] leading-none">
                {season?.name}
              </h1>
              <p className="text-[#669bbc] font-bold uppercase text-xs tracking-[0.5em] mt-4">Season Terminal</p>
            </div>
            
            <div className={`px-8 py-4 font-black italic uppercase tracking-widest text-xl border-2 shadow-[6px_6px_0px_#001d3d] ${
              isActive ? 'bg-green-600 text-white border-green-400 animate-pulse' :
              season?.status === 'UPCOMING' ? 'bg-[#ffd60a] text-[#001d3d] border-white' :
              'bg-slate-800 text-slate-400 border-slate-600'
            }`}>
              {season?.status}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          <SeasonActionCard title="Stat Leaderboard" desc="Review records & leaders." href={`/admin/leagues/${leagueId}/seasons/${seasonId}/stats`} highlight icon="★" />
          
          <SeasonActionCard title="Team Architect" desc="Manage rosters & talent." href={`/admin/leagues/${leagueId}/seasons/${seasonId}/teams`} icon="⚒" disabled={isCompleted} />
          
          {/* Can schedule games in UPCOMING or ACTIVE, but not COMPLETED */}
          <SeasonActionCard 
            title="Schedule Games" 
            desc={isCompleted ? "Season closed." : "Initialize new matchups."} 
            href={isCompleted ? "#" : `/admin/leagues/${leagueId}/seasons/${seasonId}/schedule/new`} 
            icon="📅"
            disabled={isCompleted}
          />

          {/* GAME DAY: Only available when ACTIVE */}
          <SeasonActionCard 
            title="Game Day" 
            desc={!isActive ? "Requires Active Status." : "Set lineups & score live."} 
            href={!isActive ? "#" : `/admin/leagues/${leagueId}/seasons/${seasonId}/play`} 
            icon="⚾"
            disabled={!isActive}
          />

          {/* SYSTEM CONTROL CARD (Level 2 & 3 Only) */}
          {user?.role >= 2 && (
            <div className="lg:col-span-4 bg-black/40 border-2 border-red-900 p-8 shadow-[8px_8px_0px_#c1121f] flex flex-col xl:flex-row xl:items-center justify-between gap-6 mt-8">
              <div>
                <h3 className="text-2xl font-black uppercase italic text-red-600 mb-1 leading-tight">Lifecycle Control</h3>
                <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Authorized Personnel Only</p>
              </div>

              <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                <button 
                  onClick={() => updateStatus('UPCOMING')}
                  className={`px-6 py-3 font-black uppercase italic text-xs border transition-all ${season?.status === 'UPCOMING' ? 'bg-[#ffd60a] text-[#001d3d] border-[#ffd60a]' : 'border-[#ffd60a] text-[#ffd60a] hover:bg-[#ffd60a] hover:text-[#001d3d]'}`}
                >Set Upcoming</button>
                
                <button 
                  onClick={() => updateStatus('ACTIVE')}
                  className={`px-6 py-3 font-black uppercase italic text-xs border transition-all ${isActive ? 'bg-green-600 text-white border-green-400' : 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white'}`}
                >Set Active</button>
                
                <button 
                  onClick={() => updateStatus('COMPLETED')}
                  className={`px-6 py-3 font-black uppercase italic text-xs border transition-all ${isCompleted ? 'bg-slate-700 text-slate-400 border-slate-500' : 'border-slate-500 text-slate-500 hover:bg-slate-700 hover:text-slate-400'}`}
                >End Season</button>

                <div className="border-l border-red-900/50 mx-2 hidden sm:block"></div>

                <button 
                  onClick={deleteSeason}
                  className="px-6 py-3 font-black uppercase italic text-[10px] border border-red-900 text-red-900 hover:bg-red-900 hover:text-white transition-all sm:ml-auto"
                >
                  Purge Database
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SeasonActionCard({ title, desc, href, icon, highlight = false, disabled = false }: any) {
  if (disabled) return (
    <div className="bg-slate-900/50 border-2 border-white/5 p-8 opacity-40 grayscale cursor-not-allowed">
      <div className="flex justify-between mb-6">
        <span className="text-4xl">{icon}</span>
        <span className="text-[10px] font-black uppercase px-2 py-1 bg-slate-800 text-slate-500">Locked</span>
      </div>
      <h3 className="text-2xl xl:text-3xl font-black italic uppercase text-white mb-2 leading-tight">{title}</h3>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#669bbc]">{desc}</p>
    </div>
  );

  return (
    <Link href={href} className="group">
      <div className={`h-full p-8 border-2 transition-all duration-300 ${highlight ? 'bg-[#c1121f] border-white shadow-[8px_8px_0px_#003566] group-hover:-translate-y-1' : 'bg-[#003566] border-[#669bbc] group-hover:border-white shadow-[8px_8px_0px_#c1121f] group-hover:-translate-y-1'}`}>
        <div className="flex justify-between mb-6">
          <span className="text-4xl">{icon}</span>
          <span className={`text-[10px] font-black uppercase px-2 py-1 ${highlight ? 'bg-white text-[#c1121f]' : 'bg-[#c1121f] text-white'}`}>Module</span>
        </div>
        <h3 className="text-2xl xl:text-3xl font-black italic uppercase text-white mb-2 leading-tight">{title}</h3>
        <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 ${highlight ? 'text-red-100' : 'text-[#669bbc]'}`}>{desc}</p>
      </div>
    </Link>
  );
}