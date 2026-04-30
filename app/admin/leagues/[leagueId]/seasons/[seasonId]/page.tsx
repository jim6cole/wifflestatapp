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

  // Checks if they are Level 2+ or Global Admin
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
    if (!confirm("Hold up! This will permanently erase this season. Are you sure?")) return;
    setIsDeleting(true);
    const res = await fetch(`/api/admin/seasons/${seasonId}`, { method: 'DELETE' });
    if (res.ok) router.push(`/admin/leagues/${leagueId}`);
    else {
      alert("Couldn't scrub the season.");
      setIsDeleting(false);
    }
  };

  if (loading || isDeleting) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black text-white animate-bounce italic text-xl uppercase">Prepping the Field...</div>;

  const isCompleted = season?.status === 'COMPLETED';
  const isActive = season?.status === 'ACTIVE';
  const isHistoric = season?.status === 'HISTORIC';

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] p-2 sm:p-4 md:p-6 border-[6px] sm:border-[12px] border-[#c1121f]">
      <div className="max-w-[1200px] mx-auto">
        
        <header className="mb-4 sm:mb-6 border-b-4 border-[#669bbc] pb-3 sm:pb-4 relative">
          <Link href={`/admin/leagues/${leagueId}`} className="text-[10px] font-black uppercase text-[#ffd60a] tracking-widest hover:text-white transition-colors mb-2 block">
            ← Back to League Hub
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2 sm:gap-4">
            <div className="w-full md:w-auto">
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-white drop-shadow-[2px_2px_0px_#c1121f] leading-none">
                {season?.name}
              </h1>
              <p className="text-[#669bbc] font-bold uppercase text-[9px] sm:text-[10px] tracking-[0.3em] mt-1 sm:mt-2">
                The Dugout // {isCommish ? 'Commissioner Tools' : 'Gameday Operations'}
              </p>
            </div>
            
            <div className={`px-4 sm:px-6 py-1.5 font-black italic uppercase tracking-widest text-xs sm:text-sm border-2 shadow-[2px_2px_0px_#001d3d] ${
              isActive ? 'bg-[#22c55e] text-white border-white animate-pulse' :
              isHistoric ? 'bg-[#669bbc] text-white border-white' :
              season?.status === 'UPCOMING' ? 'bg-[#ffd60a] text-[#001d3d] border-white' :
              'bg-slate-800 text-slate-400 border-slate-600'
            }`}>
              {season?.status}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          
          <SeasonActionCard 
            title="Play Ball!" 
            desc="Score live games" 
            href={!isActive ? "#" : `/admin/leagues/${leagueId}/seasons/${seasonId}/play`} 
            icon="⚾"
            highlight
            disabled={!isActive}
          />
          <SeasonActionCard 
            title="Matchups" 
            desc={isCompleted || isHistoric ? "Archived" : "Single game"} 
            href={isCompleted || isHistoric ? "#" : `/admin/leagues/${leagueId}/seasons/${seasonId}/schedule/new`} 
            icon="📅"
            disabled={isCompleted || isHistoric}
          />
          <SeasonActionCard 
            title="Scorecard" 
            desc="Manual entry" 
            href={!isActive ? "#" : `/admin/leagues/${leagueId}/seasons/${seasonId}/manual-scores`} 
            icon="📝"
            disabled={!isActive}
          />

          {isCommish && (
            <>
              <SeasonActionCard title="Leaders" desc="Stats & Standings" href={`/admin/leagues/${leagueId}/seasons/${seasonId}/stats`} highlight icon="★" />
              <SeasonActionCard title="Rosters" desc="Teams & trades" href={`/admin/leagues/${leagueId}/seasons/${seasonId}/teams`} icon="⚒" disabled={isCompleted || isHistoric} />
              <SeasonActionCard 
                title="Tournaments" 
                desc="Sub-Events" 
                href={`/admin/leagues/${leagueId}/seasons/${seasonId}/events`} 
                icon="🏆"
                highlight
              />
              <SeasonActionCard 
                title="Auto-Gen" 
                desc={isCompleted || isHistoric ? "Archived" : "Round-Robin"} 
                href={isCompleted || isHistoric ? "#" : `/admin/leagues/${leagueId}/events/generator?seasonId=${seasonId}`} 
                icon="⚙️"
                disabled={isCompleted || isHistoric}
              />
              <SeasonActionCard 
                title="The Archives" 
                desc="Review box scores" 
                href={`/admin/leagues/${leagueId}/seasons/${seasonId}/history`} 
                icon="📜" 
                highlight 
              />
            </>
          )}

          {isCommish && !isHistoric && (
            <div className="col-span-2 md:col-span-3 lg:col-span-4 bg-black/30 border-2 border-[#c1121f] p-2 sm:p-3 shadow-[2px_2px_0px_#c1121f] flex flex-col xl:flex-row xl:items-center justify-between gap-2 mt-1">
              <div>
                <h3 className="text-sm sm:text-lg font-black uppercase italic text-white mb-0.5 leading-none">Coach's Controls</h3>
                <p className="text-[7px] sm:text-[9px] font-bold uppercase text-[#ffd60a] tracking-widest leading-none mt-1">Lifecycle Management</p>
              </div>

              <div className="flex flex-wrap gap-1.5 w-full xl:w-auto">
                <button 
                  onClick={() => updateStatus('UPCOMING')}
                  className={`flex-1 sm:flex-none px-2 py-1 font-black uppercase italic text-[9px] sm:text-[10px] border-2 transition-all ${season?.status === 'UPCOMING' ? 'bg-[#ffd60a] text-[#001d3d] border-[#ffd60a]' : 'border-[#ffd60a] text-[#ffd60a] hover:bg-[#ffd60a] hover:text-[#001d3d]'}`}
                >Planning</button>
                
                <button 
                  onClick={() => updateStatus('ACTIVE')}
                  className={`flex-1 sm:flex-none px-2 py-1 font-black uppercase italic text-[9px] sm:text-[10px] border-2 transition-all ${isActive ? 'bg-[#22c55e] text-white border-white' : 'border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e] hover:text-white'}`}
                >Go Live</button>
                
                <button 
                  onClick={() => updateStatus('COMPLETED')}
                  className={`flex-1 sm:flex-none px-2 py-1 font-black uppercase italic text-[9px] sm:text-[10px] border-2 transition-all ${isCompleted ? 'bg-slate-500 text-white border-white' : 'border-slate-400 text-slate-400 hover:bg-slate-500 hover:text-white'}`}
                >End</button>

                <Link 
                  href={`/admin/leagues/${leagueId}/seasons/${seasonId}/settings`}
                  className="border border-white/20 text-white/70 px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-colors"
                >
                  View/Edit Settings
                </Link>

                <button 
                  onClick={deleteSeason}
                  className="w-full sm:w-auto px-3 py-1 font-black uppercase italic text-[9px] sm:text-[10px] border-2 border-[#c1121f] text-[#c1121f] hover:bg-[#c1121f] hover:text-white transition-all sm:ml-auto"
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
  // Shrink-wrapped: No height rules. Icon and text cluster together.
  const containerClasses = `p-2 sm:p-3 border-2 flex flex-col gap-1 transition-all duration-200 ${
    disabled 
      ? 'bg-black/40 border-white/10 opacity-50 cursor-not-allowed' 
      : highlight 
        ? 'bg-[#c1121f] border-white shadow-[2px_2px_0px_#ffd60a] hover:-translate-y-0.5 active:translate-y-0' 
        : 'bg-[#003566] border-[#669bbc] hover:border-[#ffd60a] shadow-[2px_2px_0px_#000] hover:-translate-y-0.5 active:translate-y-0'
  }`;

  const content = (
    <div className={containerClasses}>
      <div className="flex justify-between items-start">
        <span className={`text-xl sm:text-2xl leading-none ${disabled ? 'grayscale' : ''}`}>{icon}</span>
        <span className={`text-[6px] sm:text-[7px] font-black uppercase px-1 py-0.5 border ${
          disabled 
            ? 'bg-black text-white/40 border-white/10' 
            : highlight 
              ? 'bg-white text-[#c1121f] border-white' 
              : 'bg-[#ffd60a] text-[#001d3d] border-[#ffd60a]'
        }`}>
          {disabled ? 'Locked' : 'Module'}
        </span>
      </div>
      
      <div>
        <h3 className={`text-[11px] sm:text-[13px] font-black italic uppercase leading-none truncate transition-colors ${
          disabled ? 'text-white/50' : highlight ? 'text-white' : 'text-white group-hover:text-[#ffd60a]'
        }`}>
          {title}
        </h3>
        <p className={`text-[7px] sm:text-[8px] font-bold uppercase tracking-widest leading-none mt-1 truncate ${
          disabled ? 'text-[#669bbc]/50' : highlight ? 'text-red-100' : 'text-[#669bbc] group-hover:text-white'
        }`}>
          {desc}
        </p>
      </div>
    </div>
  );

  return disabled ? content : <Link href={href} className="group block">{content}</Link>;
}