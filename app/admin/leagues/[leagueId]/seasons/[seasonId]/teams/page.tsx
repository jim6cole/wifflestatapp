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
    const [poolRes, activeRes] = await Promise.all([
      fetch(`/api/admin/leagues/${leagueId}/teams`),
      fetch(`/api/admin/seasons/${seasonId}/teams`)
    ]);
    if (poolRes.ok) setLeaguePool(await poolRes.json());
    if (activeRes.ok) setActiveTeams(await activeRes.json());
    setLoading(false);
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

  if (loading) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black uppercase text-white animate-pulse text-2xl italic">Loading Architect...</div>;

  return (
    <div className="min-h-screen bg-[#fdf0d5] text-[#001d3d] font-sans p-8 md:p-16 border-[16px] border-[#001d3d]">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-12 border-b-8 border-[#c1121f] pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <Link href={`/admin/leagues/${leagueId}/seasons/${seasonId}`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#c1121f] transition-colors block mb-4">
              ← Back to Season Hub
            </Link>
            <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-[#001d3d] drop-shadow-[4px_4px_0px_#ffd60a] leading-none">
              Season Teams
            </h1>
            <p className="text-[#c1121f] font-black uppercase text-xs tracking-[0.4em] mt-3 italic">Set Active Franchises</p>
          </div>
          <Link href={`/admin/leagues/${leagueId}/teams`} className="bg-[#001d3d] text-white px-8 py-4 font-black italic uppercase tracking-widest border-4 border-[#001d3d] hover:bg-white hover:text-[#001d3d] shadow-[6px_6px_0px_#ffd60a] transition-all">
            + Edit Master Pool
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* INACTIVE POOL */}
          <div className="bg-white border-4 border-[#001d3d] p-8 shadow-[12px_12px_0px_#000]">
            <h2 className="text-2xl font-black italic uppercase text-[#001d3d] border-b-4 border-[#001d3d]/10 pb-2 mb-6">League Pool (Inactive)</h2>
            <div className="space-y-3">
              {inactiveTeams.length === 0 ? (
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center py-6">All teams are active.</p>
              ) : (
                inactiveTeams.map(t => (
                  <div key={t.id} className="bg-[#fdf0d5] border-2 border-[#001d3d] p-4 flex justify-between items-center">
                    <span className="font-black italic text-lg uppercase">{t.name}</span>
                    <button 
                      onClick={() => toggleTeam(t.id, false)}
                      className="text-[10px] font-black uppercase tracking-widest bg-[#22c55e] text-white px-4 py-2 border-2 border-[#001d3d] hover:bg-white hover:text-[#22c55e] transition-colors shadow-[2px_2px_0px_#001d3d]"
                    >
                      Activate →
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ACTIVE IN SEASON */}
          <div className="bg-white border-4 border-[#001d3d] p-8 shadow-[12px_12px_0px_#ffd60a]">
            <h2 className="text-2xl font-black italic uppercase text-[#c1121f] border-b-4 border-[#c1121f]/20 pb-2 mb-6">Active This Season</h2>
            <div className="space-y-3">
              {activeTeams.length === 0 ? (
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center py-6">No active teams. Pull from the pool!</p>
              ) : (
                activeTeams.map(t => (
                  <div key={t.id} className="bg-[#001d3d] border-2 border-[#669bbc] p-4 flex justify-between items-center group">
                    <span className="font-black italic text-lg uppercase text-white">{t.name}</span>
                    <div className="flex gap-2">
                      <Link 
                        href={`/admin/leagues/${leagueId}/seasons/${seasonId}/players?teamId=${t.id}`}
                        className="text-[10px] font-black uppercase tracking-widest bg-white text-[#001d3d] px-4 py-2 border-2 border-white hover:bg-[#ffd60a] hover:border-[#ffd60a] transition-colors"
                      >
                        Roster
                      </Link>
                      <button 
                        onClick={() => toggleTeam(t.id, true)}
                        className="text-[10px] font-black uppercase tracking-widest bg-[#c1121f] text-white px-3 py-2 border-2 border-transparent hover:border-white transition-colors"
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