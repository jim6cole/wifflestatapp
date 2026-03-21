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
    const res = await fetch(`/api/admin/seasons/${seasonId}`);
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
  };

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

  if (loading || isDeleting) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black text-white animate-pulse italic">PROCESSING...</div>;

  const isCompleted = season?.status === 'COMPLETED';

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-16 border-b-4 border-[#669bbc] pb-8 relative">
          <button onClick={() => router.back()} className="text-[10px] font-black uppercase text-[#669bbc] mb-4 block">← Back</button>
          <h1 className="text-8xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f] leading-none">
            {season?.name}
          </h1>
          <div className="mt-4 flex items-center gap-4">
            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'bg-slate-700 text-slate-400' : 'bg-green-600 text-white animate-pulse'}`}>
              {season?.status}
            </span>
            <p className="text-[#669bbc] font-bold uppercase text-xs tracking-[0.5em]">Season Terminal</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          <SeasonActionCard title="Stat Leaderboard" desc="Review records & leaders." href={`/admin/leagues/${leagueId}/seasons/${seasonId}/stats`} highlight icon="★" />
          <SeasonActionCard title="Team Architect" desc="Manage rosters & talent." href={`/admin/leagues/${leagueId}/seasons/${seasonId}/teams`} icon="⚒" />
          
          {/* SCHEDULE BUTTON (Disabled if season is completed) */}
          <SeasonActionCard 
            title="Schedule Games" 
            desc={isCompleted ? "Season is closed for scheduling." : "Initialize new matchups."} 
            href={isCompleted ? "#" : `/admin/leagues/${leagueId}/seasons/${seasonId}/schedule/new`} 
            icon="📅"
            disabled={isCompleted}
          />

          {/* SYSTEM CONTROL CARD (Level 2 & 3 Only) */}
          {user?.role >= 2 && (
            <div className="bg-black/40 border-2 border-red-900 p-8 shadow-[8px_8px_0px_#c1121f] flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-black uppercase italic text-red-600 mb-2 leading-tight">System Control</h3>
                <p className="text-[10px] font-bold uppercase text-slate-500 mb-6">Manage Lifecycle & Authorization</p>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => updateStatus(isCompleted ? 'ACTIVE' : 'COMPLETED')}
                  className={`w-full p-4 font-black uppercase italic text-xs border transition-all ${
                    isCompleted 
                      ? 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white' 
                      : 'border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white'
                  }`}
                >
                  {isCompleted ? 'Re-Activate Season' : 'End Season (Lock Schedule)'}
                </button>

                <button 
                  onClick={deleteSeason}
                  className="w-full p-4 font-black uppercase italic text-xs border border-red-900 text-red-900 hover:bg-red-900 hover:text-white transition-all"
                >
                  Delete Season (Purge)
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
    <div className="bg-slate-900/50 border-2 border-white/5 p-8 opacity-30 grayscale cursor-not-allowed">
      <h3 className="text-3xl font-black italic uppercase text-white mb-2">{title}</h3>
      <p className="text-xs font-bold uppercase text-[#669bbc]">{desc}</p>
    </div>
  );

  return (
    <Link href={href} className="group">
      <div className={`h-full p-8 border-2 transition-all duration-300 ${highlight ? 'bg-[#c1121f] border-white shadow-[8px_8px_0px_#003566] group-hover:-translate-y-1' : 'bg-[#003566] border-[#669bbc] group-hover:border-white shadow-[8px_8px_0px_#c1121f] group-hover:-translate-y-1'}`}>
        <div className="flex justify-between mb-6">
          <span className="text-4xl">{icon}</span>
          <span className={`text-[10px] font-black uppercase px-2 py-1 ${highlight ? 'bg-white text-[#c1121f]' : 'bg-[#c1121f] text-white'}`}>Module</span>
        </div>
        <h3 className="text-3xl font-black italic uppercase text-white mb-2 leading-tight">{title}</h3>
        <p className={`text-xs font-bold uppercase ${highlight ? 'text-red-100' : 'text-[#669bbc]'}`}>{desc}</p>
      </div>
    </Link>
  );
}