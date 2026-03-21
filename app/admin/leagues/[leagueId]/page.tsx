'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function LeagueHub({ params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = use(params);
  const [league, setLeague] = useState<any>(null);
  const [seasons, setSeasons] = useState<any[]>([]); // Store all seasons
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const leagueRes = await fetch(`/api/admin/leagues/${leagueId}`);
        const seasonsRes = await fetch(`/api/admin/leagues/${leagueId}/seasons`);
        
        if (leagueRes.ok) setLeague(await leagueRes.json());
        if (seasonsRes.ok) {
          const data = await seasonsRes.json();
          setSeasons(data); // Store the full array
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

  // We still use the most recent one to "prime" the shortcut buttons in Col 1 & 3
  const latestSeason = seasons.length > 0 ? seasons[0] : null;

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
          
          {/* COLUMN 1: PERSONNEL MANAGEMENT */}
          <div className="bg-[#003566]/30 border-2 border-[#669bbc] p-8 relative rounded-tr-[40px]">
            <h2 className="text-3xl font-black italic uppercase text-white mb-2 border-b-2 border-[#c1121f] pb-2">Personnel</h2>
            <div className="space-y-4 mt-8">
              <HubButton 
                title="Edit Teams" 
                subtitle="Franchise Management" 
                href={latestSeason ? `/admin/leagues/${leagueId}/seasons/${latestSeason.id}/teams` : '#'} 
                disabled={!latestSeason}
              />
              <HubButton 
                title="Edit Rosters" 
                subtitle="Player Assignments" 
                href={latestSeason ? `/admin/leagues/${leagueId}/seasons/${latestSeason.id}/players` : '#'}
                disabled={!latestSeason}
              />
            </div>
          </div>

          {/* COLUMN 2: OPERATIONAL CAMPAIGNS (The Multi-Season Fix) */}
          <div className="bg-[#003566]/30 border-2 border-[#669bbc] p-8 relative rounded-tr-[40px] flex flex-col">
            <h2 className="text-3xl font-black italic uppercase text-white mb-2 border-b-2 border-[#c1121f] pb-2">Campaigns</h2>
            
            {/* Scrollable list of all active seasons */}
            <div className="space-y-4 mt-8 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {seasons.map((s) => (
                <HubButton 
                  key={s.id}
                  title={s.name} 
                  subtitle="Open Season Terminal" 
                  href={`/admin/leagues/${leagueId}/seasons/${s.id}`} 
                  highlight 
                />
              ))}

              {seasons.length === 0 && (
                <p className="text-[#669bbc] font-black italic uppercase text-center py-10 opacity-50">No Active Seasons</p>
              )}
            </div>

            <div className="pt-6 mt-4 border-t border-white/10">
              <HubButton 
                title="+ Season Wizard" 
                subtitle="Initialize New Campaign" 
                href={`/admin/leagues/${leagueId}/seasons/new`} 
              />
            </div>
          </div>

          {/* COLUMN 3: GAME COMMAND */}
          <div className="bg-[#003566]/30 border-2 border-[#669bbc] p-8 relative rounded-tr-[40px]">
            <h2 className="text-3xl font-black italic uppercase text-white mb-2 border-b-2 border-[#c1121f] pb-2">Game Command</h2>
            <div className="space-y-4 mt-8">
              <HubButton 
                title="Schedule Game" 
                subtitle="Deploy Matchup" 
                href={latestSeason ? `/admin/leagues/${leagueId}/seasons/${latestSeason.id}/schedule/new` : '#'}
                disabled={!latestSeason}
              />
              <HubButton 
                title="Active Games" 
                subtitle="Live Scorekeeper Terminal" 
                href="/admin/games/active"
              />
              <HubButton title="Season Archive" subtitle="View All Histories" href={`/admin/leagues/${leagueId}/seasons`} />
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
      <div className="block bg-[#001d3d]/50 border border-white/5 p-6 opacity-40 cursor-not-allowed">
        <h3 className="text-2xl font-black italic uppercase text-white leading-tight">{title}</h3>
        <p className="text-[9px] font-bold uppercase text-[#669bbc] tracking-widest mt-1 italic">Locked</p>
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