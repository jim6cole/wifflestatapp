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
        if (seasonsRes.ok) {
          const data = await seasonsRes.json();
          setSeasons(data); 
        }
      } catch (error) {
        console.error("Error loading hub data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [leagueId]);

  if (loading) return <div className="min-h-screen bg-[#fdf0d5] flex items-center justify-center font-black uppercase text-[#001d3d] animate-pulse italic text-2xl">Accessing League Mainframe...</div>;

  const activeSeasons = seasons.filter(s => s.status === 'ACTIVE');
  const latestActiveSeason = activeSeasons.length > 0 ? activeSeasons[0] : null;

  return (
    <div className="min-h-screen bg-[#fdf0d5] text-[#001d3d] font-sans p-8 md:p-16 border-[16px] border-[#001d3d]">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER SECTION */}
        <header className="mb-12 border-b-8 border-[#c1121f] pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            {/* FIXED BACK BUTTON */}
            <Link href="/admin/dashboard" className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#c1121f] transition-colors block mb-4">
              ← Back to Dashboard
            </Link>
            <div className="flex items-center gap-4 mt-4">
              <h1 className="text-7xl md:text-8xl font-black italic uppercase tracking-tighter text-[#001d3d] drop-shadow-[6px_6px_0px_#ffd60a]">
                {league?.name} <span className="text-[#c1121f] not-italic text-4xl ml-2">HUB</span>
              </h1>
            </div>
            <p className="text-[#c1121f] font-bold uppercase text-sm tracking-[0.4em] mt-2 italic">{league?.description || 'League Operations'}</p>
          </div>
          <div className="bg-[#001d3d] text-white italic font-black px-8 py-4 shadow-[8px_8px_0px_#c1121f] border-4 border-[#001d3d] text-xl">
            AFFILIATE ID: {leagueId}
          </div>
        </header>

        {/* COMMAND GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* COLUMN 1: PERSONNEL MANAGEMENT */}
          <div className="bg-white border-4 border-[#001d3d] p-8 relative shadow-[12px_12px_0px_#ffd60a]">
            <h2 className="text-3xl font-black italic uppercase text-[#001d3d] mb-2 border-b-4 border-[#c1121f] pb-2">Personnel</h2>
            <div className="space-y-4 mt-8">
              <HubButton 
                title="Edit Teams" 
                subtitle="Franchise Management" 
                href={latestActiveSeason ? `/admin/leagues/${leagueId}/seasons/${latestActiveSeason.id}/teams` : '#'} 
                disabled={!latestActiveSeason}
              />
              <HubButton 
                title="Edit Rosters" 
                subtitle="Player Assignments" 
                href={latestActiveSeason ? `/admin/leagues/${leagueId}/seasons/${latestActiveSeason.id}/players` : '#'}
                disabled={!latestActiveSeason}
              />
              <HubButton 
                title="User Access" 
                subtitle="Staff Approvals" 
                href={`/admin/leagues/${leagueId}/staff`} 
              />
            </div>
          </div>

          {/* COLUMN 2: OPERATIONAL CAMPAIGNS */}
          <div className="bg-white border-4 border-[#001d3d] p-8 relative shadow-[12px_12px_0px_#ffd60a] flex flex-col">
            <h2 className="text-3xl font-black italic uppercase text-[#001d3d] mb-2 border-b-4 border-[#c1121f] pb-2">Campaigns</h2>
            
            {/* Scrollable list of only ACTIVE seasons */}
            <div className="space-y-4 mt-8 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {activeSeasons.map((s) => (
                <HubButton 
                  key={s.id}
                  title={s.name} 
                  subtitle="Open Terminal" 
                  href={`/admin/leagues/${leagueId}/seasons/${s.id}`} 
                  highlight 
                />
              ))}
              {activeSeasons.length === 0 && (
                <p className="text-[#669bbc] font-black italic uppercase text-center py-10 opacity-50">No Active Seasons</p>
              )}
            </div>

            <div className="pt-6 mt-4 border-t-4 border-[#001d3d]/10 space-y-4">
              <HubButton 
                title="+ Season Wizard" 
                subtitle="Standard League Play" 
                href={`/admin/leagues/${leagueId}/seasons/new`} 
              />
              <HubButton 
                title="+ Tournament Circuit" 
                subtitle="Multi-Event Summer Tour" 
                href={`/admin/leagues/${leagueId}/circuits/new`} 
                highlight
              />
              <HubButton 
                title="+ Standalone Event" 
                subtitle="One-Off Tournament" 
                href={`/admin/leagues/${leagueId}/tournaments/new`} 
              />
            </div>
          </div>

          {/* COLUMN 3: GAME COMMAND */}
          <div className="bg-white border-4 border-[#001d3d] p-8 relative shadow-[12px_12px_0px_#ffd60a]">
            <h2 className="text-3xl font-black italic uppercase text-[#001d3d] mb-2 border-b-4 border-[#c1121f] pb-2">Game Command</h2>
            <div className="space-y-4 mt-8">
              <HubButton 
                title="Schedule Game" 
                subtitle="Deploy Matchup" 
                href={latestActiveSeason ? `/admin/leagues/${leagueId}/seasons/${latestActiveSeason.id}/schedule/new` : '#'}
                disabled={!latestActiveSeason}
              />
              <HubButton 
                title="Live Action" 
                subtitle="Scorekeeper Terminal" 
                href="/admin/games/active"
              />
              <HubButton title="Archive" subtitle="View All Histories" href={`/admin/leagues/${leagueId}/seasons`} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function HubButton({ title, subtitle, href, highlight = false, disabled = false }: { title: string, subtitle: string, href: string, highlight?: boolean, disabled?: boolean }) {
  if (disabled) {
    return (
      <div className="block bg-slate-100 border-4 border-slate-200 p-6 opacity-50 cursor-not-allowed">
        <h3 className="text-2xl font-black italic uppercase text-slate-400 leading-tight">{title}</h3>
        <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest mt-1 italic">Locked (No Active Season)</p>
      </div>
    );
  }

  return (
    <Link 
      href={href} 
      className={`block p-6 transition-all group border-4 ${highlight ? 'bg-[#c1121f] border-[#001d3d] hover:bg-white hover:border-[#c1121f]' : 'bg-white border-slate-200 hover:border-[#001d3d] hover:bg-[#001d3d]'}`}
    >
      <h3 className={`text-2xl font-black italic uppercase leading-tight transition-colors ${highlight ? 'text-white group-hover:text-[#c1121f]' : 'text-[#001d3d] group-hover:text-white'}`}>
        {title}
      </h3>
      <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 transition-colors ${highlight ? 'text-[#fdf0d5] group-hover:text-[#001d3d]' : 'text-[#669bbc] group-hover:text-[#ffd60a]'}`}>
        {subtitle}
      </p>
    </Link>
  );
}