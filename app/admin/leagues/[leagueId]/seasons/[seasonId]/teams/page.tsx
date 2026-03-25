'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function SeasonTeamArchitect({ params }: { params: Promise<{ leagueId: string, seasonId: string }> }) {
  const { leagueId, seasonId } = use(params);
  
  const [leaguePool, setLeaguePool] = useState<any[]>([]);
  const [activeTeams, setActiveTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [leagueId, seasonId]);

  async function fetchData() {
    try {
      const [poolRes, activeRes] = await Promise.all([
        fetch(`/api/admin/leagues/${leagueId}/teams`),
        fetch(`/api/admin/seasons/${seasonId}/teams`)
      ]);
      if (poolRes.ok) setLeaguePool(await poolRes.json());
      if (activeRes.ok) setActiveTeams(await activeRes.json());
    } catch (err) {
      console.error("Failed to load season teams", err);
    } finally {
      setLoading(false);
    }
  }

  const toggleTeam = async (teamId: number, currentlyActive: boolean) => {
    const action = currentlyActive ? 'deactivate' : 'activate';
    const res = await fetch(`/api/admin/seasons/${seasonId}/teams`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, action })
    });
    if (res.ok) fetchData(); // Refresh lists
  };

  const activeIds = new Set(activeTeams.map(t => t.id));
  const inactiveTeams = leaguePool.filter(t => !activeIds.has(t.id));

  if (loading) return (
    <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black uppercase text-white animate-pulse text-2xl italic border-[12px] border-[#c1121f]">
      Loading Architect...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] font-sans p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-12 border-b-8 border-[#669bbc] pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <Link href={`/admin/leagues/${leagueId}/seasons/${seasonId}`} className="text-[10px] font-black uppercase text-[#ffd60a] tracking-widest hover:text-white transition-colors block mb-4">
              ← Back to Season Hub
            </Link>
            <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f] leading-none">
              Season Teams
            </h1>
            <p className="text-[#669bbc] font-black uppercase text-xs tracking-[0.4em] mt-3 italic">Set Active Franchises</p>
          </div>
          <Link href={`/admin/leagues/${leagueId}/teams`} className="bg-[#c1121f] text-white px-8 py-4 font-black italic uppercase tracking-widest border-4 border-[#001d3d] hover:bg-[#ffd60a] hover:text-[#001d3d] shadow-[8px_8px_0px_#000] transition-all shrink-0">
            + Edit Master Pool
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* INACTIVE POOL */}
          <div className="bg-[#fdf0d5] border-4 border-[#001d3d] p-6 md:p-8 shadow-[12px_12px_0px_#000]">
            <h2 className="text-3xl font-black italic uppercase text-[#001d3d] border-b-4 border-[#001d3d] pb-2 mb-6">League Pool (Inactive)</h2>
            <div className="space-y-4">
              {inactiveTeams.length === 0 ? (
                <div className="bg-white/50 border-4 border-dashed border-[#001d3d]/30 p-8 text-center">
                  <p className="text-sm font-black text-[#001d3d]/50 uppercase tracking-widest">All teams are active.</p>
                </div>
              ) : (
                inactiveTeams.map(t => (
                  <div key={t.id} className="bg-white border-4 border-[#001d3d] p-4 flex justify-between items-center gap-4 shadow-[4px_4px_0px_#000]">
                    <span className="font-black italic text-lg uppercase text-[#001d3d] flex-1 break-words leading-tight">{t.name}</span>
                    <button 
                      onClick={() => toggleTeam(t.id, false)}
                      className="shrink-0 text-[10px] font-black uppercase tracking-widest bg-[#001d3d] text-white px-4 py-3 border-4 border-[#001d3d] hover:bg-[#669bbc] hover:text-[#001d3d] transition-colors"
                    >
                      Activate →
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ACTIVE IN SEASON */}
          <div className="bg-[#001d3d] border-4 border-[#c1121f] p-6 md:p-8 shadow-[12px_12px_0px_#ffd60a]">
            <h2 className="text-3xl font-black italic uppercase text-white border-b-4 border-[#c1121f] pb-2 mb-6">Active This Season</h2>
            <div className="space-y-4">
              {activeTeams.length === 0 ? (
                <div className="bg-black/30 border-4 border-dashed border-[#c1121f]/50 p-8 text-center">
                  <p className="text-sm font-black text-[#fdf0d5]/50 uppercase tracking-widest">No active teams. Pull from the pool!</p>
                </div>
              ) : (
                activeTeams.map(t => (
                  <div key={t.id} className="bg-[#c1121f] border-4 border-[#001d3d] p-4 flex justify-between items-center gap-4 shadow-[4px_4px_0px_#000] group">
                    <span className="font-black italic text-lg uppercase text-white flex-1 break-words leading-tight">{t.name}</span>
                    <div className="flex gap-2 shrink-0">
                      <Link 
                        href={`/admin/leagues/${leagueId}/seasons/${seasonId}/players?teamId=${t.id}`}
                        className="text-[10px] font-black uppercase tracking-widest bg-[#ffd60a] text-[#001d3d] px-4 py-3 border-4 border-[#001d3d] hover:bg-white hover:border-[#001d3d] transition-colors"
                      >
                        Roster
                      </Link>
                      <button 
                        onClick={() => toggleTeam(t.id, true)}
                        className="text-[10px] font-black uppercase tracking-widest bg-[#001d3d] text-white px-4 py-3 border-4 border-[#001d3d] hover:bg-black transition-colors"
                      >
                        X
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}