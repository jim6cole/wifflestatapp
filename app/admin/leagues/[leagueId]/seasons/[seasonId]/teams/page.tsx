'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function TeamManager({ params }: { params: Promise<{ leagueId: string, seasonId: string }> }) {
  const { leagueId, seasonId } = use(params);
  
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [potentialMatches, setPotentialMatches] = useState<any[]>([]);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

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

  // Handle Global Search
  const handleInitiateSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    
    setIsSearching(true);
    try {
      const res = await fetch(`/api/admin/teams/search?q=${encodeURIComponent(newTeamName.trim())}`);
      const matches = await res.json();
      
      // Filter out teams that are ALREADY active in THIS season
      const currentSeasonTeams = new Set(
        teams.filter(t => t.seasonId === parseInt(seasonId)).map(t => t.name.toLowerCase())
      );
      
      const availableMatches = matches.filter((m: any) => !currentSeasonTeams.has(m.name.toLowerCase()));

      if (availableMatches.length > 0) {
        setPotentialMatches(availableMatches);
      } else {
        // No matches, force create immediately
        executeCreateTeam(newTeamName);
      }
    } catch (error) {
      executeCreateTeam(newTeamName);
    } finally {
      setIsSearching(false);
    }
  };

  const executeCreateTeam = async (nameToCreate: string) => {
    setIsCreatingTeam(true);
    try {
      const res = await fetch(`/api/admin/seasons/${seasonId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameToCreate.trim() })
      });
      
      if (res.ok) {
        const newTeam = await res.json();
        setTeams(prev => [...prev, newTeam]);
        resetModal();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create franchise.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setNewTeamName('');
    setPotentialMatches([]);
  };

  const handleDeleteTeam = async (teamId: number, teamName: string) => {
    const isConfirmed = window.confirm(
      `CRITICAL WARNING: You are about to PERMANENTLY delete "${teamName}" from this season.\n\nIf they have active box scores, this will fail. Proceed?`
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

  // SPLIT TEAMS INTO ACTIVE AND ARCHIVE
  const currentSId = parseInt(seasonId);
  const activeTeams = teams.filter(t => t.seasonId === currentSId);
  
  // Create an archive of unique names from other seasons in this league,
  // excluding names that are already active in this season.
  const activeNames = new Set(activeTeams.map(t => t.name.toLowerCase()));
  const archiveMap = new Map();
  teams.forEach(t => {
    const lowerName = t.name.toLowerCase();
    if (t.seasonId !== currentSId && !activeNames.has(lowerName)) {
      if (!archiveMap.has(lowerName)) {
        archiveMap.set(lowerName, t.name); // Keep original casing
      }
    }
  });
  const inactiveTeamNames = Array.from(archiveMap.values());

  return (
    <div className="min-h-screen bg-[#fdf0d5] text-[#001d3d] font-sans p-8 md:p-16 border-[16px] border-[#001d3d]">
      
      {/* GLOBAL SEARCH MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-white border-4 border-[#001d3d] p-8 rounded-none w-full max-w-md shadow-[12px_12px_0px_#c1121f] flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-start mb-6 border-b-4 border-[#001d3d]/10 pb-4">
              <div>
                <h2 className="text-3xl font-black uppercase italic text-[#001d3d] leading-none drop-shadow-[2px_2px_0px_#ffd60a]">Franchise Search</h2>
                <p className="text-[10px] font-bold text-[#c1121f] uppercase tracking-widest mt-2">
                  Link to Global Database
                </p>
              </div>
              <button onClick={resetModal} className="text-[#001d3d] font-black text-2xl hover:text-[#c1121f] transition-colors">X</button>
            </div>

            {potentialMatches.length > 0 ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <p className="text-xs font-bold uppercase text-[#001d3d] tracking-widest text-center">Matches found for "{newTeamName}"</p>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 border-y-2 border-[#001d3d]/10 py-4 custom-scrollbar">
                  {potentialMatches.map(match => (
                    <div key={match.id} className="bg-[#fdf0d5] border-2 border-[#001d3d] p-3 flex justify-between items-center group hover:bg-[#001d3d] hover:text-white transition-all">
                      <span className="font-black text-lg uppercase italic">{match.name}</span>
                      <button 
                        onClick={() => executeCreateTeam(match.name)}
                        className="text-[10px] font-black uppercase tracking-widest bg-[#c1121f] text-white px-4 py-2 border-2 border-[#c1121f] group-hover:border-white transition-colors shadow-[2px_2px_0px_#ffd60a]"
                      >
                        Import
                      </button>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => executeCreateTeam(newTeamName)}
                  disabled={isCreatingTeam}
                  className="w-full bg-white text-[#c1121f] border-4 border-[#c1121f] py-4 font-black uppercase tracking-widest text-[10px] hover:bg-[#c1121f] hover:text-white transition-all disabled:opacity-50"
                >
                  {isCreatingTeam ? 'PROCESSING...' : 'Not listed? Create Brand New'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleInitiateSearch} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest mb-2 block">Global Database Search</label>
                  <input 
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Enter Team Name"
                    className="w-full bg-[#fdf0d5] border-4 border-[#001d3d] p-4 text-[#001d3d] font-black uppercase outline-none focus:border-[#c1121f] transition-colors shadow-inner"
                    autoFocus
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSearching || !newTeamName.trim()}
                  className="w-full bg-[#001d3d] text-white py-5 font-black italic uppercase tracking-widest text-lg border-4 border-[#001d3d] hover:bg-white hover:text-[#001d3d] transition-all shadow-[6px_6px_0px_#ffd60a] disabled:opacity-50 active:translate-y-1 active:shadow-none"
                >
                  {isSearching ? 'SCANNING...' : 'Search & Draft'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MAIN UI COMPONENT */}
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-12 border-b-8 border-[#c1121f] pb-6 flex justify-between items-end">
          <div>
            <Link href={`/admin/leagues/${leagueId}`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#c1121f] transition-colors block mb-4">
              ← Back to League Hub
            </Link>
            <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-[#001d3d] drop-shadow-[4px_4px_0px_#ffd60a] mt-2 leading-none">
              Team Architect
            </h1>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#c1121f] border-4 border-[#001d3d] px-8 py-4 font-black italic uppercase tracking-widest text-white hover:bg-[#001d3d] hover:text-[#ffd60a] transition-all shadow-[8px_8px_0px_#001d3d] active:translate-y-1 active:shadow-none hidden md:block"
          >
            + Register Franchise
          </button>
        </header>
        
        {/* MOBILE ADD BUTTON */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-[#c1121f] border-4 border-[#001d3d] px-8 py-4 mb-8 font-black italic uppercase tracking-widest text-white hover:bg-[#001d3d] hover:text-[#ffd60a] transition-all shadow-[8px_8px_0px_#001d3d] md:hidden"
        >
          + Register Franchise
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* LEFT COLUMN: ARCHIVE */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white border-4 border-[#001d3d] p-6 shadow-[8px_8px_0px_#c1121f]">
              <h2 className="text-xl font-black italic uppercase mb-2 text-[#001d3d] border-b-4 border-[#ffd60a] pb-2">Franchise Archive</h2>
              <p className="text-[10px] font-bold uppercase text-[#669bbc] mb-6">Teams registered in past seasons of this league.</p>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {inactiveTeamNames.length === 0 ? (
                  <div className="p-4 bg-[#fdf0d5] border-2 border-dashed border-[#001d3d]/50 text-center">
                    <p className="text-[10px] font-black italic text-[#669bbc] uppercase">Archive Empty</p>
                  </div>
                ) : (
                  inactiveTeamNames.map((name, index) => (
                    <div key={index} className="flex justify-between items-center bg-[#fdf0d5] p-4 border-2 border-[#001d3d] group hover:bg-[#001d3d] hover:text-white transition-all shadow-sm">
                      <span className="font-black text-sm uppercase italic text-[#001d3d] group-hover:text-white truncate pr-2">{name}</span>
                      <button 
                        onClick={() => executeCreateTeam(name)}
                        className="text-[9px] font-black uppercase tracking-widest bg-[#c1121f] text-white px-3 py-2 border-2 border-[#c1121f] group-hover:border-[#ffd60a] transition-colors flex-shrink-0 shadow-[2px_2px_0px_#ffd60a]"
                      >
                        Import
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ACTIVE ROSTERS */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-3xl font-black italic uppercase text-[#001d3d] border-b-4 border-[#ffd60a] pb-2 inline-block mb-6">Active Franchises</h2>
            
            {loading ? (
              <div className="bg-white border-4 border-[#001d3d] p-12 text-center shadow-[12px_12px_0px_#ffd60a]">
                <p className="text-2xl font-black italic uppercase text-[#001d3d] animate-pulse">Loading Grid...</p>
              </div>
            ) : activeTeams.length === 0 ? (
              <div className="bg-white border-4 border-dashed border-[#001d3d] p-12 text-center shadow-inner opacity-70">
                <p className="text-3xl font-black italic uppercase text-[#001d3d]">No Active Teams</p>
                <p className="text-[10px] font-bold uppercase text-[#c1121f] tracking-widest mt-2">Draft a team or import one from the global database.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {activeTeams.map((team) => (
                  <div key={team.id} className="bg-white border-4 border-[#001d3d] p-6 flex flex-col justify-between h-48 shadow-[8px_8px_0px_#ffd60a] group hover:border-[#c1121f] transition-all">
                    <div>
                      <h3 className="text-3xl font-black italic uppercase text-[#001d3d] truncate group-hover:text-[#c1121f] transition-colors">{team.name}</h3>
                      <div className="flex justify-between items-center mt-2 border-t-2 border-[#001d3d]/10 pt-2">
                        <p className="text-[10px] font-bold uppercase text-[#669bbc] tracking-widest">ID: {team.id}</p>
                        <span className="text-[9px] font-black uppercase bg-[#22c55e] border-2 border-[#001d3d] px-2 py-0.5 text-white shadow-sm">Active</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Link 
                        href={`/admin/leagues/${leagueId}/seasons/${seasonId}/players?teamId=${team.id}`}
                        className="flex-1 text-[10px] font-black uppercase tracking-widest bg-[#001d3d] text-white border-2 border-[#001d3d] px-4 py-3 text-center hover:bg-white hover:text-[#001d3d] transition-all shadow-[4px_4px_0px_#ffd60a] active:translate-y-1 active:shadow-none flex items-center justify-center"
                      >
                        Manage Roster →
                      </Link>
                      
                      <button 
                        onClick={() => handleDeleteTeam(team.id, team.name)}
                        className="text-[10px] font-black uppercase tracking-widest border-2 border-slate-200 bg-slate-100 px-3 py-3 text-slate-500 hover:bg-[#c1121f] hover:text-white hover:border-[#c1121f] transition-all flex items-center justify-center"
                        title="Remove from Season"
                      >
                        Delete
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