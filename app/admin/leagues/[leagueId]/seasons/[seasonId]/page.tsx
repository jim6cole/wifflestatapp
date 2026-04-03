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
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] p-3 sm:p-8 md:p-12 border-[6px] sm:border-[12px] border-[#c1121f]">
      <div className="max-w-[1400px] mx-auto">
        
        <header className="mb-8 sm:mb-12 border-b-4 border-[#669bbc] pb-6 sm:pb-8 relative">
          <Link href={`/admin/leagues/${leagueId}`} className="text-[10px] font-black uppercase text-[#ffd60a] tracking-widest hover:text-white transition-colors mb-4 block">
            ← Back to League Hub
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 sm:gap-6">
            <div className="w-full md:w-auto">
              <h1 className="text-4xl sm:text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-white drop-shadow-[3px_3px_0px_#c1121f] leading-none">
                {season?.name}
              </h1>
              <p className="text-[#669bbc] font-bold uppercase text-[9px] sm:text-xs tracking-[0.3em] sm:tracking-[0.5em] mt-2 sm:mt-4">The Dugout // Season Operations</p>
            </div>
            
            <div className={`px-4 sm:px-8 py-2 sm:py-4 font-black italic uppercase tracking-widest text-sm sm:text-xl border-2 sm:border-4 shadow-[4px_4px_0px_#001d3d] ${
              isActive ? 'bg-[#22c55e] text-white border-white animate-pulse' :
              isHistoric ? 'bg-[#669bbc] text-white border-white' :
              season?.status === 'UPCOMING' ? 'bg-[#ffd60a] text-[#001d3d] border-white' :
              'bg-slate-800 text-slate-400 border-slate-600'
            }`}>
              {season?.status}
            </div>
          </div>
        </header>

        {/* CLEAN RESPONSIVE GRID: 
          Mobile: 2 columns 
          Desktop (lg): 4 columns 
        */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          
          {/* ROW 1 ON PC */}
          <SeasonActionCard title="Leaders" desc="Stats & Standings." href={`/admin/leagues/${leagueId}/seasons/${seasonId}/stats`} highlight icon="★" />
          <SeasonActionCard title="Rosters" desc="Teams & trades." href={`/admin/leagues/${leagueId}/seasons/${seasonId}/teams`} icon="⚒" disabled={isCompleted || isHistoric} />
          <SeasonActionCard 
            title="Matchups" 
            desc={isCompleted || isHistoric ? "Archived." : "Single game."} 
            href={isCompleted || isHistoric ? "#" : `/admin/leagues/${leagueId}/seasons/${seasonId}/schedule/new`} 
            icon="📅"
            disabled={isCompleted || isHistoric}
          />
          <SeasonActionCard 
            title="Auto-Gen" 
            desc={isCompleted || isHistoric ? "Archived." : "Round-Robin."} 
            href={isCompleted || isHistoric ? "#" : `/admin/leagues/${leagueId}/events/generator?seasonId=${seasonId}`} 
            icon="⚙️"
            disabled={isCompleted || isHistoric}
          />

          {/* ROW 2 ON PC */}
          <SeasonActionCard 
            title="Tournaments" 
            desc="Sub-Events." 
            href={`/admin/leagues/${leagueId}/seasons/${seasonId}/events`} 
            icon="🏆"
            highlight
          />
          <SeasonActionCard 
            title="Scorecard" 
            desc="Manual entry." 
            href={!isActive ? "#" : `/admin/leagues/${leagueId}/seasons/${seasonId}/manual-scores`} 
            icon="📝"
            disabled={!isActive}
          />
          <SeasonActionCard 
            title="Play Ball!" 
            desc="Score live games." 
            href={!isActive ? "#" : `/admin/leagues/${leagueId}/seasons/${seasonId}/play`} 
            icon="⚾"
            highlight
            disabled={!isActive}
          />
          {isCommish && (
            <SeasonActionCard 
              title="The Archives" 
              desc="Review box scores." 
              href={`/admin/leagues/${leagueId}/seasons/${seasonId}/history`} 
              icon="📜" 
              highlight 
            />
          )}

          {/* COACH'S CONTROLS - Spans full width on both Mobile and PC */}
          {isCommish && !isHistoric && (
            <div className="col-span-2 lg:col-span-4 bg-black/30 border-2 sm:border-4 border-[#c1121f] p-4 sm:p-8 shadow-[4px_4px_0px_#c1121f] flex flex-col xl:flex-row xl:items-center justify-between gap-4 sm:gap-6 mt-2 sm:mt-4">
              <div>
                <h3 className="text-xl sm:text-3xl font-black uppercase italic text-white mb-1 leading-tight">Coach's Controls</h3>
                <p className="text-[8px] sm:text-[10px] font-bold uppercase text-[#ffd60a] tracking-widest">Season Lifecycle Management</p>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3 w-full xl:w-auto">
                <button 
                  onClick={() => updateStatus('UPCOMING')}
                  className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 font-black uppercase italic text-[10px] sm:text-xs border-2 transition-all ${season?.status === 'UPCOMING' ? 'bg-[#ffd60a] text-[#001d3d] border-[#ffd60a]' : 'border-[#ffd60a] text-[#ffd60a] hover:bg-[#ffd60a] hover:text-[#001d3d]'}`}
                >Planning</button>
                
                <button 
                  onClick={() => updateStatus('ACTIVE')}
                  className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 font-black uppercase italic text-[10px] sm:text-xs border-2 transition-all ${isActive ? 'bg-[#22c55e] text-white border-white' : 'border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e] hover:text-white'}`}
                >Go Live</button>
                
                <button 
                  onClick={() => updateStatus('COMPLETED')}
                  className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 font-black uppercase italic text-[10px] sm:text-xs border-2 transition-all ${isCompleted ? 'bg-slate-500 text-white border-white' : 'border-slate-400 text-slate-400 hover:bg-slate-500 hover:text-white'}`}
                >End</button>

                <button 
                  onClick={deleteSeason}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 font-black uppercase italic text-[10px] border-2 border-[#c1121f] text-[#c1121f] hover:bg-[#c1121f] hover:text-white transition-all sm:ml-auto"
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
  const containerClasses = `h-full p-3 sm:p-6 md:p-8 border-2 sm:border-4 transition-all duration-300 flex flex-col justify-between ${
    disabled 
      ? 'bg-black/40 border-white/10 opacity-50 cursor-not-allowed' 
      : highlight 
        ? 'bg-[#c1121f] border-white shadow-[4px_4px_0px_#ffd60a] sm:shadow-[8px_8px_0px_#ffd60a] hover:-translate-y-1 active:translate-y-0' 
        : 'bg-[#003566] border-[#669bbc] hover:border-[#ffd60a] shadow-[4px_4px_0px_#000] sm:shadow-[8px_8px_0px_#000] hover:-translate-y-1 active:translate-y-0'
  }`;

  const content = (
    <div className={containerClasses}>
      <div className="flex justify-between items-start mb-3 sm:mb-6 gap-1">
        <span className={`text-2xl sm:text-4xl leading-none ${disabled ? 'grayscale' : ''}`}>{icon}</span>
        <span className={`flex-shrink-0 text-[7px] sm:text-[10px] font-black uppercase px-1.5 sm:px-2 py-0.5 border ${
          disabled 
            ? 'bg-black text-white/40 border-white/10' 
            : highlight 
              ? 'bg-white text-[#c1121f] border-white' 
              : 'bg-[#ffd60a] text-[#001d3d] border-[#ffd60a]'
        }`}>
          {disabled ? 'Locked' : 'Module'}
        </span>
      </div>
      <div className="mt-auto pt-2">
        {/* Strictly controls font sizing to fit 2 cols on mobile, 4 on PC. break-normal prevents mid-word splitting. */}
        <h3 className={`text-[12px] min-[400px]:text-[14px] sm:text-xl lg:text-2xl font-black italic uppercase mb-1 leading-tight tracking-tighter sm:tracking-tight transition-colors break-normal hyphens-none ${
          disabled ? 'text-white/50' : highlight ? 'text-white' : 'text-white group-hover:text-[#ffd60a]'
        }`}>
          {title}
        </h3>
        <p className={`text-[8px] sm:text-[10px] lg:text-xs font-bold uppercase tracking-tight sm:tracking-widest leading-tight ${
          disabled ? 'text-[#669bbc]/50' : highlight ? 'text-red-100' : 'text-[#669bbc] group-hover:text-white'
        } line-clamp-2`}>
          {desc}
        </p>
      </div>
    </div>
  );

  return disabled ? content : <Link href={href} className="group block h-full">{content}</Link>;
}