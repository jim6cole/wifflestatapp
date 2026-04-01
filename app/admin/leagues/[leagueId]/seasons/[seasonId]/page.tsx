'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function SeasonDugout({ params }: { params: Promise<{ leagueId: string, seasonId: string }> }) {
  const { leagueId, seasonId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;

  const [season, setSeason] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Secure Multi-Tenant Check for Commissioner Powers
  const isCommish = user?.isGlobalAdmin || user?.memberships?.some(
    (m: any) => Number(m.leagueId) === Number(leagueId) && m.roleLevel >= 2 && m.isApproved
  );

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
    if (!confirm("Hold up! This will permanently erase this season and all its games from the record books. Are you absolutely sure?")) return;
    setIsDeleting(true);
    const res = await fetch(`/api/admin/seasons/${seasonId}`, { method: 'DELETE' });
    if (res.ok) router.push(`/admin/leagues/${leagueId}`);
    else {
      alert("Couldn't scrub the season. Make sure to delete all the scheduled games inside it first!");
      setIsDeleting(false);
    }
  };

  if (loading || isDeleting) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black text-white animate-bounce italic text-2xl uppercase">Prepping the Field...</div>;

  const isCompleted = season?.status === 'COMPLETED';
  const isActive = season?.status === 'ACTIVE';

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-[1400px] mx-auto">
        
        <header className="mb-16 border-b-4 border-[#669bbc] pb-8 relative">
          <Link href={`/admin/leagues/${leagueId}`} className="text-[10px] font-black uppercase text-[#ffd60a] tracking-widest hover:text-white transition-colors mb-4 block">
            ← Back to League Hub
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f] leading-none">
                {season?.name}
              </h1>
              <p className="text-[#669bbc] font-bold uppercase text-xs tracking-[0.5em] mt-4">The Dugout // Season Operations</p>
            </div>
            
            <div className={`px-8 py-4 font-black italic uppercase tracking-widest text-xl border-4 shadow-[6px_6px_0px_#001d3d] ${
              isActive ? 'bg-[#22c55e] text-white border-white animate-pulse' :
              season?.status === 'UPCOMING' ? 'bg-[#ffd60a] text-[#001d3d] border-white' :
              'bg-slate-800 text-slate-400 border-slate-600'
            }`}>
              {season?.status}
            </div>
          </div>
        </header>

        {/* Action Grid - 3 rows or 6 columns for balance */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          
          <SeasonActionCard title="Leaders" desc="Stats & Standings." href={`/admin/leagues/${leagueId}/seasons/${seasonId}/stats`} highlight icon="★" />
          
          <SeasonActionCard title="Rosters" desc="Teams & trades." href={`/admin/leagues/${leagueId}/seasons/${seasonId}/teams`} icon="⚒" disabled={isCompleted} />
          
          <SeasonActionCard 
            title="Matchups" 
            desc={isCompleted ? "Season closed." : "Single game."} 
            href={isCompleted ? "#" : `/admin/leagues/${leagueId}/seasons/${seasonId}/schedule/new`} 
            icon="📅"
            disabled={isCompleted}
          />

          <SeasonActionCard 
            title="Auto-Gen" 
            desc={isCompleted ? "Season closed." : "Round-Robin."} 
            href={isCompleted ? "#" : `/admin/leagues/${leagueId}/events/generator?seasonId=${seasonId}`} 
            icon="⚙️"
            disabled={isCompleted}
          />

          <SeasonActionCard 
            title="Tournaments" 
            desc="Manage Sub-Events & Winners." 
            href={`/admin/leagues/${leagueId}/seasons/${seasonId}/events`} 
            icon="🏆"
            highlight
          />

          {/* MANUAL ENTRY CARD */}
          <SeasonActionCard 
            title="Scorecard" 
            desc={!isActive ? "Requires Active." : "Manual box scores."} 
            href={!isActive ? "#" : `/admin/leagues/${leagueId}/seasons/${seasonId}/manual-scores`} 
            icon="📝"
            disabled={!isActive}
          />

          <SeasonActionCard 
            title="Play Ball!" 
            desc={!isActive ? "Requires Active." : "Score live games."} 
            href={!isActive ? "#" : `/admin/leagues/${leagueId}/seasons/${seasonId}/play`} 
            icon="⚾"
            highlight
            disabled={!isActive}
          />

          {/* GAME HISTORY: Only for Commissioners */}
          {isCommish && (
            <div className="xl:col-span-6 mt-4">
              <SeasonActionCard 
                title="The Archives (Box Scores)" 
                desc="Review and edit completed matchups." 
                href={`/admin/leagues/${leagueId}/seasons/${seasonId}/history`} 
                icon="📜" 
                highlight 
              />
            </div>
          )}

          {/* SYSTEM CONTROL CARD */}
          {isCommish && (
            <div className="xl:col-span-6 bg-black/30 border-4 border-[#c1121f] p-8 shadow-[8px_8px_0px_#c1121f] flex flex-col xl:flex-row xl:items-center justify-between gap-6 mt-8">
              <div>
                <h3 className="text-3xl font-black uppercase italic text-white mb-1 leading-tight">Coach's Controls</h3>
                <p className="text-[10px] font-bold uppercase text-[#ffd60a] tracking-widest">Season Lifecycle Management</p>
              </div>

              <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                <button 
                  onClick={() => updateStatus('UPCOMING')}
                  className={`px-6 py-3 font-black uppercase italic text-xs border-2 transition-all ${season?.status === 'UPCOMING' ? 'bg-[#ffd60a] text-[#001d3d] border-[#ffd60a]' : 'border-[#ffd60a] text-[#ffd60a] hover:bg-[#ffd60a] hover:text-[#001d3d]'}`}
                >Planning Phase</button>
                
                <button 
                  onClick={() => updateStatus('ACTIVE')}
                  className={`px-6 py-3 font-black uppercase italic text-xs border-2 transition-all ${isActive ? 'bg-[#22c55e] text-white border-white' : 'border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e] hover:text-white'}`}
                >Go Live</button>
                
                <button 
                  onClick={() => updateStatus('COMPLETED')}
                  className={`px-6 py-3 font-black uppercase italic text-xs border-2 transition-all ${isCompleted ? 'bg-slate-500 text-white border-white' : 'border-slate-400 text-slate-400 hover:bg-slate-500 hover:text-white'}`}
                >End Season</button>

                <div className="border-l-2 border-[#c1121f] mx-2 hidden sm:block"></div>

                <button 
                  onClick={deleteSeason}
                  className="px-6 py-3 font-black uppercase italic text-[10px] border-2 border-[#c1121f] text-[#c1121f] hover:bg-[#c1121f] hover:text-white transition-all sm:ml-auto"
                >
                  Scrub Season
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
    <div className="bg-black/40 border-4 border-white/10 p-8 opacity-50 cursor-not-allowed h-full flex flex-col justify-between">
      <div className="flex justify-between mb-6">
        <span className="text-4xl grayscale">{icon}</span>
        <span className="text-[10px] font-black uppercase px-2 py-1 bg-black text-white/40 border border-white/10">Locked</span>
      </div>
      <div>
        <h3 className="text-2xl font-black italic uppercase text-white/50 mb-1 leading-tight">{title}</h3>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#669bbc]/50">{desc}</p>
      </div>
    </div>
  );

  return (
    <Link href={href} className="group">
      <div className={`h-full p-8 border-4 transition-all duration-300 flex flex-col justify-between ${highlight ? 'bg-[#c1121f] border-white shadow-[8px_8px_0px_#ffd60a] group-hover:-translate-y-1' : 'bg-[#003566] border-[#669bbc] group-hover:border-[#ffd60a] shadow-[8px_8px_0px_#000] group-hover:-translate-y-1'}`}>
        <div className="flex justify-between mb-6">
          <span className="text-4xl group-hover:scale-110 transition-transform">{icon}</span>
          <span className={`text-[10px] font-black uppercase px-2 py-1 border-2 ${highlight ? 'bg-white text-[#c1121f] border-white' : 'bg-[#ffd60a] text-[#001d3d] border-[#ffd60a]'}`}>Module</span>
        </div>
        <div>
          <h3 className={`text-2xl font-black italic uppercase mb-1 leading-tight transition-colors ${highlight ? 'text-white' : 'text-white group-hover:text-[#ffd60a]'}`}>{title}</h3>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${highlight ? 'text-red-100' : 'text-[#669bbc] group-hover:text-white'}`}>{desc}</p>
        </div>
      </div>
    </Link>
  );
}