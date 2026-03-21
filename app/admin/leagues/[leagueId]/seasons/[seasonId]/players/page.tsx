'use client';
import { useState, useEffect, use, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function RosterManager({ leagueId, seasonId }: { leagueId: string, seasonId: string }) {
  const searchParams = useSearchParams();
  const defaultTeamId = searchParams.get('teamId');

  const [leaguePlayers, setLeaguePlayers] = useState<any[]>([]);
  const [seasonTeams, setSeasonTeams] = useState<any[]>([]);
  const [activeTeamFilter, setActiveTeamFilter] = useState<string>(defaultTeamId || 'all');
  const [loading, setLoading] = useState(true);

  // Form states
  const [newPlayerName, setNewPlayerName] = useState('');
  
  // Duplicate Check Modal States
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [potentialMatches, setPotentialMatches] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const playersRes = await fetch(`/api/admin/seasons/${seasonId}/players`);
        const teamsRes = await fetch(`/api/admin/seasons/${seasonId}/teams`);

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
    fetchData();
  }, [leagueId, seasonId]);

  // 1. INTERCEPT THE SUBMIT TO CHECK FOR DUPLICATES
  const handleInitiateCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    setIsSearching(true);
    
    // Extract the last name (gets the last word in the string)
    const nameParts = newPlayerName.trim().split(' ');
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];

    try {
      const res = await fetch(`/api/admin/players/search?lastName=${lastName}`);
      const matches = await res.json();

      if (matches.length > 0) {
        setPotentialMatches(matches);
        setShowDuplicateModal(true);
      } else {
        // No matches found, proceed with creating brand new
        executeCreatePlayer(newPlayerName);
      }
    } catch (error) {
      console.error("Search error:", error);
      executeCreatePlayer(newPlayerName); // Fallback to creating if search fails
    } finally {
      setIsSearching(false);
    }
  };

  // 2. ACTUALLY CREATE THE NEW PLAYER
  const executeCreatePlayer = async (nameToCreate: string) => {
    setShowDuplicateModal(false);
    try {
      const res = await fetch(`/api/admin/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameToCreate }),
      });

      if (res.ok) {
        const newPlayer = await res.json();
        setLeaguePlayers([...leaguePlayers, newPlayer]);
        setNewPlayerName('');
      }
    } catch (error) {
      console.error("Error creating player:", error);
    }
  };

  // 3. IMPORT EXISTING PLAYER INTO THIS LEAGUE
  const executeImportPlayer = async (existingPlayer: any) => {
    setShowDuplicateModal(false);
    
    // NOTE: Depending on your Prisma schema, if a player can be in multiple leagues,
    // you might need a different API route here to create a join record. 
    // If we just update their leagueId, they are "moved" to this league.
    try {
      const res = await fetch(`/api/admin/leagues/${leagueId}/players/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: existingPlayer.id }),
      });

      if (res.ok) {
        setLeaguePlayers([...leaguePlayers, existingPlayer]);
        setNewPlayerName('');
      } else {
        alert("Failed to import player. Check database relations.");
      }
    } catch (error) {
      console.error("Error importing player:", error);
    }
  };

  const handleAssignToTeam = async (playerId: number, targetTeamId: string) => {
    // ... (Keep your exact same assignment logic here)
    if (!targetTeamId || targetTeamId === 'all') return;
    try {
      const res = await fetch(`/api/admin/seasons/${seasonId}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, teamId: parseInt(targetTeamId) }),
      });
      if (res.ok) {
        setLeaguePlayers(leaguePlayers.map(p => p.id === playerId ? { ...p, teamId: parseInt(targetTeamId) } : p));
      }
    } catch (error) {
      console.error("Error assigning:", error);
    }
  };

  const displayedPlayers = activeTeamFilter === 'all' ? leaguePlayers : leaguePlayers.filter(p => p.teamId === parseInt(activeTeamFilter));
  const unassignedPlayers = leaguePlayers.filter(p => !p.teamId);

  if (loading) return <div className="text-center font-black italic uppercase animate-pulse text-2xl text-white mt-20">Loading Database...</div>;

  return (
    <>
      {/* DUPLICATE CHECK MODAL */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#001d3d] border-4 border-[#c1121f] p-8 max-w-lg w-full shadow-2xl">
            <h2 className="text-3xl font-black italic uppercase text-white tracking-wide mb-2 text-center drop-shadow-[2px_2px_0px_#c1121f]">
              Wait! Match Found
            </h2>
            <p className="text-xs font-bold uppercase text-[#669bbc] text-center tracking-widest mb-6">
              Database shows players with a similar last name.
            </p>

            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
              {potentialMatches.map(match => (
                <div key={match.id} className="bg-[#003566] border-2 border-[#669bbc] p-4 flex justify-between items-center group">
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
                No, Create Brand New
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

      {/* REST OF YOUR PAGE STAYS THE SAME */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* LEFT COLUMN */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-[#003566] border-2 border-[#669bbc] p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-black italic uppercase text-white tracking-wide">
              {activeTeamFilter === 'all' ? 'All League Players' : 'Active Roster'}
            </h2>
            <select 
              value={activeTeamFilter}
              onChange={(e) => setActiveTeamFilter(e.target.value)}
              className="bg-[#001d3d] border-2 border-[#669bbc] text-white p-3 font-bold uppercase tracking-widest outline-none focus:border-[#fdf0d5] cursor-pointer"
            >
              <option value="all">--- View All Players ---</option>
              {seasonTeams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-[#003566] border-2 border-[#669bbc] p-6 min-h-[400px]">
            {displayedPlayers.length === 0 ? (
              <div className="text-center p-12 opacity-50">
                <p className="text-xl font-black italic uppercase text-white">No players found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayedPlayers.map((player) => {
                  const playerTeam = seasonTeams.find(t => t.id === player.teamId);
                  return (
                    <div key={player.id} className="bg-[#001d3d] border border-[#669bbc]/50 p-4 flex justify-between items-center group hover:border-[#fdf0d5] transition-colors">
                      <div>
                        <h3 className="font-bold text-lg text-white">{player.name}</h3>
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
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="xl:col-span-1 space-y-6">
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

          <div className="bg-[#003566] border-2 border-[#669bbc] p-6">
            <h2 className="text-xl font-black italic uppercase mb-4 text-white">Free Agents</h2>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {unassignedPlayers.length === 0 ? (
                <p className="text-xs font-bold text-[#669bbc] uppercase tracking-widest">All players are rostered.</p>
              ) : (
                unassignedPlayers.map(p => (
                  <div key={p.id} className="flex justify-between items-center bg-[#001d3d] p-2 border border-[#669bbc]/30 text-sm">
                    <span className="text-white font-semibold">{p.name}</span>
                    {activeTeamFilter !== 'all' && (
                      <button 
                        onClick={() => handleAssignToTeam(p.id, activeTeamFilter)}
                        className="text-[9px] font-bold uppercase text-[#c1121f] hover:text-white"
                      >
                        Sign
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
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
          <Link href={`/admin/leagues/${leagueId}/seasons/${seasonId}/teams`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white transition-colors">
            ← Back to Team Architect
          </Link>
          <h1 className="text-6xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f] mt-2">
            Roster Control
          </h1>
        </div>
        <Suspense fallback={<div className="text-white animate-pulse">Initializing Roster Protocol...</div>}>
          <RosterManager leagueId={leagueId} seasonId={seasonId} />
        </Suspense>
      </div>
    </div>
  );
}