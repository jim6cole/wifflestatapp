'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function LeagueHub({ params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = use(params);
  
  const [league, setLeague] = useState<any>(null);
  const [seasons, setSeasons] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const leagueRes = await fetch(`/api/admin/leagues/${leagueId}`, { cache: 'no-store' });
        const seasonsRes = await fetch(`/api/admin/leagues/${leagueId}/seasons`, { cache: 'no-store' });
        
        if (leagueRes.ok) setLeague(await leagueRes.json());
        if (seasonsRes.ok) setSeasons(await seasonsRes.json());
      } catch (error) {
        console.error("Error loading hub data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [leagueId]);

  if (loading) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black uppercase text-white animate-pulse italic text-2xl tracking-tighter">Accessing League Mainframe...</div>;

  const activeSeasons = seasons.filter(s => s.status === 'ACTIVE');
  const latestActiveSeason = activeSeasons.length > 0 ? activeSeasons[0] : null;

  return (
    <div className="min-h-screen bg-[#001d3d] text-white font-sans p-4 sm:p-6 md:p-12 lg:p-16 border-[8px] md:border-[16px] border-[#c1121f] selection:bg-[#ffd60a] selection:text-[#001d3d]">
      <div className="max-w-[1600px] mx-auto">
        
        {/* --- HEADER SECTION --- */}
        <header className="mb-8 md:mb-16 border-b-8 border-[#669bbc]/30 pb-8 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8">
          <div className="w-full xl:w-2/3">
            <Link href="/admin/dashboard" className="text-[10px] font-black uppercase text-[#ffd60a] tracking-[0.3em] hover:text-white transition-colors block mb-6">
              ← System Dashboard
            </Link>
            <h1 className="text-[clamp(2.5rem,7vw,8rem)] font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f] leading-[0.9] break-words">
              {league?.name} <span className="text-[#c1121f] not-italic text-[0.4em] inline-block ml-2 align-middle border-l-8 border-[#c1121f] pl-4 md:pl-6 bg-white px-2 shadow-[4px_4px_0px_#ffd60a]">HUB</span>
            </h1>
            <p className="text-[#669bbc] font-bold uppercase text-[clamp(0.75rem,1.2vw,0.9rem)] tracking-[0.35em] mt-8 italic max-w-2xl leading-relaxed">
              {league?.description || 'League Operations & Franchise Management'}
            </p>
          </div>
          
          <div className="bg-[#c1121f] text-white italic font-black px-6 py-3 md:px-8 md:py-4 shadow-[6px_6px_0px_#ffd60a] border-4 border-white text-sm md:text-xl shrink-0">
            AFFILIATE // {leagueId}
          </div>
        </header>

        {/* --- COMMAND GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          
          {/* COLUMN 1: PERSONNEL */}
          <HubColumn title="Personnel" icon="👥">
            <HubButton 
              title="Edit Teams" 
              subtitle="Franchise Management" 
              href={`/admin/leagues/${leagueId}/teams`} 
            />
            <HubButton 
              title="Edit Rosters" 
              subtitle="Active Player Pool" 
              href={latestActiveSeason ? `/admin/leagues/${leagueId}/seasons/${latestActiveSeason.id}/players` : '#'}
              disabled={!latestActiveSeason}
            />
            <HubButton 
              title="User Access" 
              subtitle="Permissions Hub" 
              href={`/admin/leagues/${leagueId}/staff`} 
            />
          </HubColumn>

          {/* COLUMN 2: CAMPAIGNS */}
          <HubColumn title="Campaigns" icon="🏆">
            <div className="space-y-4 mb-4">
              {activeSeasons.map((s) => (
                <HubButton 
                  key={s.id}
                  title={s.name} 
                  subtitle="Open Operation Terminal" 
                  href={`/admin/leagues/${leagueId}/seasons/${s.id}`} 
                  highlight 
                />
              ))}
            </div>

            <div className="space-y-4 border-t-8 border-[#001d3d]/5 pt-6">
              <HubButton 
                title="+ Season Wizard" 
                subtitle="Standard League Play" 
                href={`/admin/leagues/${leagueId}/seasons/new`} 
              />
              <HubButton 
                title="+ Tournament Circuit Wizard" 
                subtitle="Multi-Event Summer Tour" 
                href={`/admin/leagues/${leagueId}/circuits/new`} 
                highlight
              />
              <HubButton 
                title="+ Standalone Tournament Wizard" 
                subtitle="One-Off Tournament" 
                href={`/admin/leagues/${leagueId}/tournaments/new`} 
              />
            </div>
          </HubColumn>

          {/* COLUMN 3: GAME DAY */}
          <HubColumn title="Game Day" icon="⚾" highlight>
            <HubButton 
              title="Live Action" 
              subtitle="Active Scoreboard" 
              href={`/admin/games/active?leagueId=${leagueId}`}
              highlight
            />
           
            <HubButton 
              title="Auto-Gen" 
              subtitle="Matchup Engine" 
              href={latestActiveSeason 
                ? `/admin/leagues/${leagueId}/events/generator?seasonId=${latestActiveSeason.id}` 
                : `/admin/leagues/${leagueId}/events/generator`}
            />
             <HubButton 
              title="Schedule" 
              subtitle="League Calendar" 
              href={latestActiveSeason ? `/admin/leagues/${leagueId}/seasons/${latestActiveSeason.id}/schedule` : '#'}
              disabled={!latestActiveSeason}
            />
            <HubButton 
              title="Season Archives" 
              subtitle="Historical Stats" 
              href={`/admin/leagues/${leagueId}/seasons`} 
            />
          </HubColumn>

        </div>
      </div>
    </div>
  );
}

// Column Container Fix for Navy Background
function HubColumn({ title, icon, children, highlight = false }: any) {
  return (
    <div className={`flex flex-col bg-white border-4 border-[#c1121f] p-6 md:p-8 relative shadow-[12px_12px_0px_#000] ${highlight ? 'ring-8 ring-[#ffd60a]/20' : ''}`}>
      <div className="flex justify-between items-center mb-8 border-b-4 border-[#001d3d] pb-4">
        <h2 className="text-2xl md:text-3xl font-black italic uppercase text-[#001d3d] tracking-tighter">{title}</h2>
        <span className="text-3xl">{icon}</span>
      </div>
      <div className="flex flex-col gap-4 flex-1">
        {children}
      </div>
    </div>
  );
}

// Button Styling Fix for White Cards on Navy
function HubButton({ title, subtitle, href, highlight = false, disabled = false }: any) {
  if (disabled) {
    return (
      <div className="block bg-slate-50 border-4 border-slate-200 p-6 opacity-40 cursor-not-allowed">
        <h3 className="text-lg font-black italic uppercase text-slate-400 leading-tight">{title}</h3>
        <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest mt-1">LOCKED</p>
      </div>
    );
  }

  return (
    <Link 
      href={href} 
      className={`block p-6 transition-all group border-4 active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_#001d3d] ${
        highlight 
          ? 'bg-[#c1121f] border-[#001d3d] hover:bg-[#ffd60a] hover:border-[#001d3d]' 
          : 'bg-white border-[#001d3d] hover:bg-[#ffd60a]'
      }`}
    >
      <h3 className={`font-black italic uppercase leading-none transition-colors text-[clamp(1rem,2vw,1.75rem)] tracking-tight ${
        highlight ? 'text-white group-hover:text-[#001d3d]' : 'text-[#001d3d]'
      }`}>
        {title}
      </h3>
      <p className={`text-[clamp(0.5rem,1vw,0.7rem)] font-bold uppercase tracking-[0.2em] mt-3 transition-colors ${
        highlight ? 'text-red-100 group-hover:text-[#001d3d]' : 'text-[#669bbc] group-hover:text-[#001d3d]'
      }`}>
        {subtitle}
      </p>
    </Link>
  );
}