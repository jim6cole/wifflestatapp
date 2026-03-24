'use client';
import { useState, useEffect, Suspense, use } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

function RosterManager({ leagueId, seasonId }: { leagueId: string, seasonId: string }) {
  const searchParams = useSearchParams();
  const defaultTeamId = searchParams?.get('teamId');

  const [leaguePlayers, setLeaguePlayers] = useState<any[]>([]);
  const [seasonTeams, setSeasonTeams] = useState<any[]>([]);
  const [activeTeamFilter, setActiveTeamFilter] = useState<string>(defaultTeamId || 'all');
  const [loading, setLoading] = useState(true);

  // Form states
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [potentialMatches, setPotentialMatches] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Global Lookup Modal States
  const [showGlobalModal, setShowGlobalModal] = useState(false);
  const [globalPlayers, setGlobalPlayers] = useState<any[]>([]);
  const [isFetchingGlobal, setIsFetchingGlobal] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  // Drag and Drop States
  const [isDraggingOverRoster, setIsDraggingOverRoster] = useState(false);
  const [isDraggingOverFreeAgents, setIsDraggingOverFreeAgents] = useState(false);

  useEffect(() => {
    fetchData();
  }, [leagueId, seasonId]);

  async function fetchData() {
    try {
      const [playersRes, teamsRes] = await Promise.all([
        fetch(`/api/admin/seasons/${seasonId}/players`),
        fetch(`/api/admin/seasons/${seasonId}/teams`)
      ]);
      
      if (playersRes.ok && teamsRes.ok) {
        setLeaguePlayers(await playersRes.json());
        setSeasonTeams(await teamsRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch roster data:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTeamId = e.target.value;
    setActiveTeamFilter(newTeamId);
    
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (newTeamId === 'all') {
        url.searchParams.delete('teamId');
      } else {
        url.searchParams.set('teamId', newTeamId);
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleInitiateCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    setIsSearching(true);
    
    const nameParts = newPlayerName.trim().split(' ');
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];

    try {
      const res = await fetch(`/api/admin/players/search?lastName=${lastName}`);
      const matches = await res.json();
      
      if (matches.length > 0) {
        setPotentialMatches(matches);
        setShowDuplicateModal(true);
      } else {
        executeCreatePlayer(newPlayerName);
      }
    } catch (error) {
      executeCreatePlayer(newPlayerName);
    } finally {
      setIsSearching(false);
    }
  };

  const executeCreatePlayer = async (nameToCreate: string) => {
    setShowDuplicateModal(false);
    try {
      const res = await fetch(`/api/admin/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameToCreate, leagueId }), // Anchors to league!
      });

      if (res.ok) {
        const newPlayer = await res.json();
        setLeaguePlayers(prev => [...prev, newPlayer]);
        setNewPlayerName('');
        
        if (activeTeamFilter !== 'all') {
          handleAssignToTeam(newPlayer.id, activeTeamFilter);
        }
      }
    } catch (error) {
      console.error("Error creating player:", error);
    }
  };

  const executeImportPlayer = (existingPlayer: any) => {
    setShowDuplicateModal(false);
    if (!leaguePlayers.find(p => p.id === existingPlayer.id)) {
      setLeaguePlayers(prev => [...prev, existingPlayer]);
    }
    setNewPlayerName('');
    
    if (activeTeamFilter !== 'all') {
      handleAssignToTeam(existingPlayer.id, activeTeamFilter);
    }
  };

  // --- TARGETED SERVER-SIDE GLOBAL SEARCH ---
  const handleGlobalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearchTerm.trim()) return;
    
    setIsFetchingGlobal(true);
    try {
      const res = await fetch(`/api/admin/players/search?lastName=${globalSearchTerm.trim()}`);
      if (res.ok) {
        const data = await res.json();
        const existingIds = new Set(leaguePlayers.map(p => p.id));
        setGlobalPlayers(data.filter((p: any) => !existingIds.has(p.id)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingGlobal(false);
    }
  };

  const openGlobalLookup = () => {
    setGlobalSearchTerm('');
    setGlobalPlayers([]);
    setShowGlobalModal(true);
  };

  const handleAssignToTeam = async (playerId: number, targetTeamId: string) => {
    if (!targetTeamId || targetTeamId === 'all') return;
    try {
      const res = await fetch(`/api/admin/seasons/${seasonId}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, teamId: parseInt(targetTeamId) }),
      });
      if (res.ok) {
        setLeaguePlayers(prev => prev.map(p => p.id === playerId ? { ...p, teamId: parseInt(targetTeamId) } : p));
      }
    } catch (error) {
      console.error("Error assigning:", error);
    }
  };

  const handleRemoveFromTeam = async (playerId: number) => {
    try {
      const res = await fetch(`/api/admin/seasons/${seasonId}/players`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      });
      if (res.ok) {
        setLeaguePlayers(prev => prev.map(p => p.id === playerId ? { ...p, teamId: null } : p));
      }
    } catch (error) {
      console.error("Error removing player:", error);
    }
  };

  const handleDragStart = (e: React.DragEvent, playerId: number) => {
    e.dataTransfer.setData('playerId', playerId.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropOnRoster = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverRoster(false);
    const playerId = parseInt(e.dataTransfer.getData('playerId'));
    if (activeTeamFilter !== 'all' && playerId) {
      handleAssignToTeam(playerId, activeTeamFilter);
    }
  };

  const handleDropOnFreeAgents = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverFreeAgents(false);
    const playerId = parseInt(e.dataTransfer.getData('playerId'));
    if (playerId) {
      handleRemoveFromTeam(playerId);
    }
  };

  const displayedPlayers = activeTeamFilter === 'all' ? leaguePlayers : leaguePlayers.filter(p => p.teamId === parseInt(activeTeamFilter));
  const unassignedPlayers = leaguePlayers.filter(p => !p.teamId);

  if (loading) return <div className="text-center font-black italic uppercase animate-pulse text-2xl text-white mt-20">Loading Roster...</div>;

  return (
    <>
      {/* GLOBAL LOOKUP MODAL */}
      {showGlobalModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#001d3d] border-4 border-[#669bbc] p-8 max-w-lg w-full shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black italic uppercase text-white tracking-wide drop-shadow-[2px_2px_0px_#669bbc]">Global Database</h2>
                <button onClick={() => setShowGlobalModal(false)} className="text-[#669bbc] hover:text-white font-black text-xl">X</button>
            </div>
            
            <form onSubmit={handleGlobalSearch} className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="Search by last name..." 
                value={globalSearchTerm}
                onChange={(e) => setGlobalSearchTerm(e.target.value)}
                className="flex-1 bg-[#003566] border-2 border-[#669bbc]/50 p-3 text-white font-bold uppercase outline-none focus:border-[#fdf0d5]"
                autoFocus
              />
              <button 
                type="submit" 
                disabled={isFetchingGlobal || !globalSearchTerm.trim()} 
                className="bg-[#669bbc] text-[#001d3d] px-4 font-black uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50"
              >
                Search
              </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {isFetchingGlobal ? (
                  <p className="text-center font-black italic text-[#669bbc] animate-pulse py-4">Scanning Mainframe...</p>
              ) : globalPlayers.length === 0 && globalSearchTerm !== '' ? (
                  <p className="text-center text-sm font-bold text-[#669bbc] uppercase mt-4">No matching players found.</p>
              ) : (
                  globalPlayers.map((p: any) => (
                    <div key={p.id} className="bg-[#003566] border border-[#669bbc]/50 p-3 flex justify-between items-center group">
                      <div>
                          <span className="font-bold text-white block">{p.name}</span>
                          <span className="text-[9px] uppercase text-[#669bbc] tracking-widest">Global ID: {p.id}</span>
                      </div>
                      <button 
                        onClick={() => {
                            setLeaguePlayers(prev => [...prev, p]);
                            setGlobalPlayers(prev => prev.filter(gp => gp.id !== p.id));
                            if (activeTeamFilter !== 'all') handleAssignToTeam(p.id, activeTeamFilter);
                        }}
                        className="text-[9px] font-black uppercase tracking-widest bg-[#669bbc] text-[#001d3d] px-3 py-2 hover:bg-white transition-colors"
                      >
                        {activeTeamFilter === 'all' ? 'Pull to Free Agency' : 'Sign Player'}
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* DUPLICATE CHECK MODAL */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#001d3d] border-4 border-[#c1121f] p-8 max-w-lg w-full shadow-2xl">
            <h2 className="text-3xl font-black italic uppercase text-white tracking-wide mb-2 text-center drop-shadow-[2px_2px_0px_#c1121f]">Wait! Match Found</h2>
            <p className="text-xs font-bold uppercase text-[#669bbc] text-center tracking-widest mb-6">Database shows players with a similar last name.</p>
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
              {potentialMatches.map(match => (
                <div key={match.id} className="bg-[#003566] border-2 border-[#669bbc] p-4 flex justify-between items-center">
                  <span className="font-bold text-lg text-white">{match.name}</span>
                  <button 
                    onClick={() => executeImportPlayer(match)}
                    className="text-[10px] font-black uppercase tracking-widest bg-[#c1121f] text-white px-4 py-2 hover:bg-white hover:text-[#c1121f] transition-colors"
                  >
                    Import Player
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t-2 border-[#669bbc]/30 pt-4 flex gap-4">
              <button 
                onClick={() => executeCreatePlayer(newPlayerName)}
                className="flex-1 bg-transparent border-2 border-white/50 text-white/50 hover:text-white hover:border-white px-4 py-3 font-black uppercase text-[10px] tracking-widest transition-all"
              >
                Create Brand New
              </button>
              <button 
                onClick={() => setShowDuplicateModal(false)}
                className="flex-1 bg-transparent text-[#669bbc] hover:text-white px-4 py-3 font-black uppercase text-[10px] tracking-widest transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REST OF PAGE UI */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: ACTIVE ROSTER */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-[#003566] border-2 border-[#669bbc] p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-black italic uppercase text-white tracking-wide">
              {activeTeamFilter === 'all' ? 'All League Players' : 'Active Roster'}
            </h2>
            
            <select 
              value={activeTeamFilter}
              onChange={handleTeamChange}
              className="bg-[#001d3d] border-2 border-[#669bbc] text-white p-3 font-bold uppercase tracking-widest outline-none focus:border-[#fdf0d5] cursor-pointer"
            >
              <option value="all">--- View All Players ---</option>
              {seasonTeams.map(team => (
                <option key={team.id} value={team.id.toString()}>{team.name}</option>
              ))}
            </select>
          </div>

          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDraggingOverRoster(true); }}
            onDragLeave={() => setIsDraggingOverRoster(false)}
            onDrop={handleDropOnRoster}
            className={`border-2 p-6 min-h-[400px] transition-colors ${isDraggingOverRoster && activeTeamFilter !== 'all' ? 'bg-[#c1121f]/20 border-[#ffd60a]' : 'bg-[#003566] border-[#669bbc]'}`}
          >
            {displayedPlayers.length === 0 ? (
              <div className="text-center p-12 opacity-50">
                <p className="text-xl font-black italic uppercase text-white">No players found</p>
                {activeTeamFilter !== 'all' && (
                  <p className="text-xs font-bold uppercase text-[#ffd60a] mt-2 tracking-widest">Drop Free Agents Here</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayedPlayers.map((player) => {
                  const playerTeam = seasonTeams.find(t => t.id === player.teamId);
                  return (
                    <div 
                      key={player.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, player.id)}
                      className="bg-[#001d3d] border border-[#669bbc]/50 p-4 flex justify-between items-center group hover:border-[#fdf0d5] transition-colors cursor-grab active:cursor-grabbing"
                    >
                      <div>
                        <h3 className="font-bold text-lg text-white group-hover:text-[#ffd60a] transition-colors">{player.name}</h3>
                        <p className="text-[10px] uppercase text-[#669bbc] tracking-widest mt-1">
                          {playerTeam ? playerTeam.name : 'Unassigned'}
                        </p>
                      </div>
                      
                      {activeTeamFilter !== 'all' && player.teamId !== parseInt(activeTeamFilter) && (
                        <button 
                          onClick={() => handleAssignToTeam(player.id, activeTeamFilter)}
                          className="text-[10px] font-black uppercase tracking-widest bg-[#c1121f] text-white px-3 py-2 hover:bg-white hover:text-[#c1121f] transition-colors"
                        >
                          + Add
                        </button>
                      )}

                      {activeTeamFilter !== 'all' && player.teamId === parseInt(activeTeamFilter) && (
                        <button 
                          onClick={() => handleRemoveFromTeam(player.id)}
                          className="text-[10px] font-black uppercase tracking-widest border border-[#669bbc] text-[#669bbc] px-3 py-2 hover:bg-[#c1121f] hover:text-white hover:border-[#c1121f] transition-all opacity-0 group-hover:opacity-100"
                        >
                          Release
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: FREE AGENTS */}
        <div className="xl:col-span-1 space-y-6">
          
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDraggingOverFreeAgents(true); }}
            onDragLeave={() => setIsDraggingOverFreeAgents(false)}
            onDrop={handleDropOnFreeAgents}
            className={`border-2 p-6 transition-colors shadow-xl min-h-[300px] flex flex-col ${isDraggingOverFreeAgents ? 'bg-[#c1121f]/20 border-[#ffd60a]' : 'bg-[#003566] border-[#669bbc]'}`}
          >
            <h2 className="text-xl font-black italic uppercase mb-4 text-white border-b-2 border-white/10 pb-2">Free Agents</h2>
            <div className="space-y-2 flex-1 overflow-y-auto pr-2">
              {unassignedPlayers.length === 0 ? (
                <div className="text-center p-6 border-2 border-dashed border-[#669bbc]/50">
                  <p className="text-xs font-bold text-[#669bbc] uppercase tracking-widest">No Free Agents.</p>
                  <p className="text-[9px] font-bold text-white/50 uppercase mt-2">Drop players here to release.</p>
                </div>
              ) : (
                unassignedPlayers.map(p => (
                  <div 
                    key={p.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, p.id)}
                    className="flex justify-between items-center bg-[#001d3d] p-3 border border-[#669bbc]/30 text-sm group hover:border-[#ffd60a] cursor-grab active:cursor-grabbing"
                  >
                    <span className="text-white font-semibold group-hover:text-[#ffd60a]">{p.name}</span>
                    {activeTeamFilter !== 'all' && (
                      <button 
                        onClick={() => handleAssignToTeam(p.id, activeTeamFilter)}
                        className="text-[9px] font-black uppercase text-[#c1121f] hover:text-white px-2 py-1 border border-transparent hover:border-white transition-colors"
                      >
                        Sign
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={openGlobalLookup}
              className="w-full mt-6 bg-transparent border-2 border-dashed border-[#669bbc] text-[#669bbc] px-4 py-3 font-black uppercase text-[10px] tracking-widest hover:text-white hover:border-white transition-all"
            >
              Global Player Lookup
            </button>
          </div>

          <div className="bg-[#c1121f] border-2 border-[#fdf0d5] p-6 shadow-xl relative overflow-hidden">
            {isSearching && <div className="absolute inset-0 bg-[#c1121f]/80 backdrop-blur flex items-center justify-center font-black italic uppercase text-white z-10 animate-pulse">Scanning DB...</div>}
            <h2 className="text-xl font-black italic uppercase mb-4 text-white">Scout New Player</h2>
            <form onSubmit={handleInitiateCreatePlayer} className="space-y-4 relative z-0">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Player Name"
                className="w-full bg-[#001d3d] border-2 border-transparent p-3 text-white placeholder:text-white/50 font-bold uppercase outline-none focus:border-white transition-colors"
                required
              />
              <button 
                type="submit"
                className="w-full bg-transparent border-2 border-white px-4 py-3 font-black uppercase tracking-widest text-white hover:bg-white hover:text-[#c1121f] transition-all"
              >
                Draft to League
              </button>
            </form>
          </div>

        </div>

      </div>
    </>
  );
}

export default function PlayerManagerPage({ params }: { params: Promise<{ leagueId: string, seasonId: string }> }) {
  const { leagueId, seasonId } = use(params);

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] font-sans p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 border-b-4 border-[#669bbc] pb-6">
          <Link href={`/admin/leagues/${leagueId}/seasons/${seasonId}/teams`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white transition-colors block mb-4">
            ← Back to Season Teams
          </Link>
          <h1 className="text-6xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f] mt-2">
            Roster Control
          </h1>
        </div>

        <Suspense fallback={<div className="text-white animate-pulse font-black italic uppercase">Initializing Roster Protocol...</div>}>
          <RosterManager leagueId={leagueId} seasonId={seasonId} />
        </Suspense>
      </div>
    </div>
  );
}