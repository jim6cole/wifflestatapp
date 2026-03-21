'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function TeamManager({ params }: { params: Promise<{ leagueId: string, seasonId: string }> }) {
  const { leagueId, seasonId } = use(params);
  
  const [teams, setTeams] = useState<any[]>([]);
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await fetch(`/api/admin/seasons/${seasonId}/teams`);
        if (res.ok) {
          setTeams(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch teams:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTeams();
  }, [seasonId]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    try {
      const res = await fetch(`/api/admin/seasons/${seasonId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamName }),
      });

      if (res.ok) {
        const processedTeam = await res.json();
        // Update state: remove the old version of this team if it existed, then add the updated one
        setTeams(prev => [...prev.filter(t => t.id !== processedTeam.id), processedTeam]);
        setTeamName('');
      } else {
        alert("Failed to create/activate team.");
      }
    } catch (error) {
      console.error("Error creating team:", error);
    }
  };

  // Toggle a team in or out of the current season
  const handleToggleStatus = async (teamId: number, targetSeasonId: number | null) => {
    try {
      const res = await fetch(`/api/admin/teams/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seasonId: targetSeasonId }),
      });

      if (res.ok) {
        const updatedTeam = await res.json();
        setTeams(prev => prev.map(t => t.id === teamId ? { ...t, seasonId: updatedTeam.seasonId } : t));
      }
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const handleDeleteTeam = async (teamId: number, teamName: string) => {
    const isConfirmed = window.confirm(
      `CRITICAL WARNING: You are about to PERMANENTLY delete "${teamName}" from the entire database.\n\nThis is only for typos. If they played in past seasons, do not delete them! Proceed?`
    );

    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/teams/${teamId}`, { method: 'DELETE' });
      if (res.ok) {
        setTeams(teams.filter(t => t.id !== teamId));
      } else {
        alert("Failed to delete team. They likely have active box scores protecting them.");
      }
    } catch (error) {
      console.error("Error deleting team:", error);
    }
  };

  // SPLIT TEAMS INTO ACTIVE AND INACTIVE
  const currentSId = parseInt(seasonId);
  const activeTeams = teams.filter(t => t.seasonId === currentSId);
  const inactiveTeams = teams.filter(t => t.seasonId !== currentSId);

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] font-sans p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-12 border-b-4 border-[#669bbc] pb-6">
          <Link href={`/admin/leagues/${leagueId}/seasons`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white transition-colors">
            ← Back to Season Archive
          </Link>
          <h1 className="text-6xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f] mt-2">
            Team Architect
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: FORM & ARCHIVE */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Create Form */}
            <div className="bg-[#003566] border-2 border-[#669bbc] p-6 shadow-xl">
              <h2 className="text-2xl font-black italic uppercase mb-4 text-white">Draft a Franchise</h2>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. The Bombers"
                    className="w-full bg-[#001d3d] border-2 border-[#669bbc] p-3 text-white placeholder:text-[#669bbc]/50 font-bold uppercase outline-none focus:border-[#fdf0d5] transition-colors"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-[#c1121f] border-2 border-[#fdf0d5] px-4 py-4 font-black italic uppercase tracking-widest hover:bg-white hover:text-[#c1121f] transition-all shadow-lg active:scale-95"
                >
                  + Register Team
                </button>
              </form>
            </div>

            {/* Inactive Teams / Archive */}
            <div className="bg-[#001d3d] border-2 border-[#669bbc]/50 p-6">
              <h2 className="text-xl font-black italic uppercase mb-4 text-[#669bbc]">Franchise Archive</h2>
              <p className="text-[10px] font-bold uppercase text-[#669bbc]/70 mb-4">Teams registered in the league but not active this season.</p>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {inactiveTeams.length === 0 ? (
                  <p className="text-xs font-black italic text-[#669bbc]/50 uppercase">No inactive franchises.</p>
                ) : (
                  inactiveTeams.map(team => (
                    <div key={team.id} className="flex justify-between items-center bg-[#003566] p-3 border border-[#669bbc]/30 group">
                      <span className="font-bold text-sm text-white">{team.name}</span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleToggleStatus(team.id, currentSId)}
                          className="text-[9px] font-black uppercase bg-[#669bbc] text-[#001d3d] px-2 py-1 hover:bg-white transition-colors"
                        >
                          Activate
                        </button>
                        <button 
                          onClick={() => handleDeleteTeam(team.id, team.name)}
                          className="text-[9px] font-black uppercase border border-[#c1121f] text-[#c1121f] px-2 py-1 hover:bg-[#c1121f] hover:text-white transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ACTIVE ROSTERS */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-3xl font-black italic uppercase text-white drop-shadow-[2px_2px_0px_#669bbc] mb-6">Active Season Franchises</h2>
            
            {loading ? (
              <div className="bg-[#003566] border-2 border-[#669bbc] p-12 text-center">
                <p className="text-2xl font-black italic uppercase animate-pulse">Loading Grid...</p>
              </div>
            ) : activeTeams.length === 0 ? (
              <div className="bg-[#003566] border-2 border-[#669bbc] p-12 text-center">
                <p className="text-2xl font-black italic uppercase opacity-50">No Active Teams</p>
                <p className="text-[10px] font-bold uppercase text-[#669bbc] mt-2">Draft a team or activate one from the archive.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeTeams.map((team) => (
                  <div key={team.id} className="bg-[#003566] border-2 border-[#fdf0d5] p-6 flex flex-col justify-between h-48 shadow-lg">
                    <div>
                      <h3 className="text-2xl font-black italic uppercase text-white truncate">{team.name}</h3>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-[10px] font-bold uppercase text-[#669bbc] tracking-widest">ID: {team.id}</p>
                        <span className="text-[9px] font-black uppercase bg-[#c1121f] px-2 py-1 text-white">Active</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Link 
                        href={`/admin/leagues/${leagueId}/seasons/${seasonId}/players?teamId=${team.id}`}
                        className="flex-1 text-[10px] font-black uppercase tracking-widest bg-white text-[#c1121f] px-4 py-3 text-center hover:bg-[#c1121f] hover:text-white transition-all flex items-center justify-center"
                      >
                        Manage Roster →
                      </Link>
                      
                      <button 
                        onClick={() => handleToggleStatus(team.id, null)}
                        className="text-[10px] font-black uppercase tracking-widest border border-white/20 bg-[#001d3d]/50 px-3 py-3 text-white/50 hover:bg-[#001d3d] hover:text-white hover:border-white transition-all flex items-center justify-center"
                        title="Remove from Season"
                      >
                        Bench
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}