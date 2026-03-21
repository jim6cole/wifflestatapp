'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function LeagueHub({ params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = use(params);
  const [league, setLeague] = useState<any>(null);
  const [activeSeason, setActiveSeason] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch League Details
        const leagueRes = await fetch(`/api/admin/leagues/${leagueId}`);
        // Fetch Seasons to find the most recent/active one
        const seasonsRes = await fetch(`/api/admin/leagues/${leagueId}/seasons`);
        
        if (leagueRes.ok) setLeague(await leagueRes.json());
        if (seasonsRes.ok) {
          const seasons = await seasonsRes.json();
          // We assume the top one is the latest active campaign
          if (seasons.length > 0) setActiveSeason(seasons[0]);
        }
      } catch (error) {
        console.error("Error loading hub data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [leagueId]);

  if (loading) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black uppercase text-white animate-pulse italic">Accessing League Mainframe...</div>;

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] font-sans p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER SECTION */}
        <header className="mb-12 border-b-4 border-[#669bbc] pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <Link href="/admin/global" className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white transition-colors">
              ← System Root
            </Link>
            <div className="flex items-center gap-4 mt-4">
              <h1 className="text-8xl font-black italic uppercase tracking-tighter text-white drop-shadow-[6px_6px_0px_#c1121f]">
                {league?.name} <span className="text-[#669bbc] not-italic text-4xl ml-2">ADMIN</span>
              </h1>
            </div>
            <p className="text-[#669bbc] font-bold uppercase text-sm tracking-[0.4em] mt-2 italic">{league?.description || 'Sector Operations'}</p>
          </div>

          <div className="bg-[#c1121f] text-white italic font-black px-8 py-4 skew-x-[-10deg] shadow-[8px_8px_0px_#003566] border-2 border-[#fdf0d5] text-xl">
            AFFILIATE ID: {leagueId}
          </div>
        </header>

        {/* COMMAND GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* COLUMN 1: ROSTER MANAGEMENT */}
          <div className="bg-[#003566]/30 border-2 border-[#669bbc] p-8 relative rounded-tr-[40px]">
            <h2 className="text-3xl font-black italic uppercase text-white mb-2 border-b-2 border-[#c1121f] pb-2">Roster Management</h2>
            <div className="space-y-4 mt-8">
              <HubButton 
                title="Edit Teams" 
                subtitle="Manage Franchises & Names" 
                href={activeSeason ? `/admin/leagues/${leagueId}/seasons/${activeSeason.id}/teams` : '#'} 
                disabled={!activeSeason}
              />
              <HubButton 
                title="Edit Rosters" 
                subtitle="Assign Players to Teams" 
                href={activeSeason ? `/admin/leagues/${leagueId}/seasons/${activeSeason.id}/players` : '#'}
                disabled={!activeSeason}
              />
            </div>
          </div>

          {/* COLUMN 2: SEASON OPERATIONS */}
          <div className="bg-[#003566]/30 border-2 border-[#669bbc] p-8 relative rounded-tr-[40px]">
            <h2 className="text-3xl font-black italic uppercase text-white mb-2 border-b-2 border-[#c1121f] pb-2">Season Operations</h2>
            <div className="space-y-4 mt-8">
              <HubButton 
                title="Season Wizard" 
                subtitle="Create New Season with Custom Rules" 
                href={`/admin/leagues/${leagueId}/seasons/new`} 
                highlight 
              />
              <HubButton 
                title="Season Archive" 
                subtitle="View Past and Active Campaigns" 
                href={`/admin/leagues/${leagueId}/seasons`} 
              />
            </div>
          </div>

          {/* COLUMN 3: GAME COMMAND */}
          <div className="bg-[#003566]/30 border-2 border-[#669bbc] p-8 relative rounded-tr-[40px]">
            <h2 className="text-3xl font-black italic uppercase text-white mb-2 border-b-2 border-[#c1121f] pb-2">Game Command</h2>
            <div className="space-y-4 mt-8">
              <HubButton 
                title="Schedule Game" 
                subtitle="Set Up a New Matchup" 
                href={activeSeason ? `/admin/leagues/${leagueId}/seasons/${activeSeason.id}/schedule/new` : '#'}
                disabled={!activeSeason}
              />
              <HubButton 
  title="Active Games" 
  subtitle="Launch Live Scorekeeper" 
  href="/admin/games/active"  // This is the new path
/>
              <HubButton title="Edit Box Scores" subtitle="Fix Errors in Past Games" href="#" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Reusable Button Component for that Arcade Look
function HubButton({ title, subtitle, href, highlight = false, disabled = false }: { title: string, subtitle: string, href: string, highlight?: boolean, disabled?: boolean }) {
  if (disabled) {
    return (
      <div className="block bg-[#001d3d]/50 border border-white/5 p-6 opacity-40 cursor-not-allowed">
        <h3 className="text-2xl font-black italic uppercase text-white leading-tight">{title}</h3>
        <p className="text-[9px] font-bold uppercase text-[#669bbc] tracking-widest mt-1 italic">Create Season to Unlock</p>
      </div>
    );
  }

  return (
    <Link 
      href={href} 
      className={`block p-6 transition-all group border-2 ${highlight ? 'bg-[#c1121f] border-[#fdf0d5] hover:bg-white hover:border-[#c1121f]' : 'bg-[#001d3d] border-transparent hover:border-[#669bbc] hover:bg-[#003566]'}`}
    >
      <h3 className={`text-2xl font-black italic uppercase leading-tight transition-colors ${highlight ? 'text-white group-hover:text-[#c1121f]' : 'text-white'}`}>
        {title}
      </h3>
      <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 transition-colors ${highlight ? 'text-white group-hover:text-[#001d3d]' : 'text-[#669bbc] group-hover:text-white'}`}>
        {subtitle}
      </p>
    </Link>
  );
}