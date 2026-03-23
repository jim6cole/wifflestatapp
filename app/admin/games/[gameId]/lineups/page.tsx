'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LineupConstructor({ params }: { params: Promise<{ gameId: string }> }) {
  const resolvedParams = use(params);
  const gameId = resolvedParams?.gameId;
  const router = useRouter();
  
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Global Player State
  const [allLeaguePlayers, setAllLeaguePlayers] = useState<any[]>([]);
  const [addingForTeam, setAddingForTeam] = useState<'home' | 'away' | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  
  // Search & Duplicate Check States
  const [isSearching, setIsSearching] = useState(false);
  const [potentialMatches, setPotentialMatches] = useState<any[]>([]);
  const [isCreatingPlayer, setIsCreatingPlayer] = useState(false);

  // Lineup & Bench States
  const [homeActive, setHomeActive] = useState<any[]>([]);
  const [homeBench, setHomeBench] = useState<any[]>([]);
  const [awayActive, setAwayActive] = useState<any[]>([]);
  const [awayBench, setAwayBench] = useState<any[]>([]);

  // Pitcher States
  const [homePitcher, setHomePitcher] = useState('');
  const [awayPitcher, setAwayPitcher] = useState('');

  useEffect(() => {
    if (!gameId) {
      setError("No Game ID found in URL.");
      setLoading(false);
      return;
    }

    async function init() {
      try {
        const [gameRes, playersRes] = await Promise.all([
          fetch(`/api/admin/games/${gameId}/prepare`),
          fetch('/api/players')
        ]);
        
        if (!gameRes.ok) throw new Error(`API Error: ${await gameRes.text()}`);
        
        const data = await gameRes.json();
        
        if (data && data.game) {
          setGame(data.game);
          setHomeBench(data.homeRoster || []);
          setAwayBench(data.awayRoster || []);
        } else {
          setError("The API returned data, but the game details are missing.");
        }

        if (playersRes.ok) {
          setAllLeaguePlayers(await playersRes.json());
        }

      } catch (err: any) {
        console.error("Initialization Failed:", err);
        setError(err.message || "Failed to connect to API.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [gameId]);

  // --- DRAG AND DROP LOGIC ---
  const onDragStart = (e: any, player: any, fromList: string) => {
    e.dataTransfer.setData("player", JSON.stringify(player));
    e.dataTransfer.setData("fromList", fromList);
  };

  const onDrop = (e: any, toList: string) => {
    e.preventDefault();
    const playerData = e.dataTransfer.getData("player");
    if (!playerData) return;
    
    const player = JSON.parse(playerData);
    const fromList = e.dataTransfer.getData("fromList");
    const remove = (list: any[]) => list.filter(p => p.id !== player.id);

    if (fromList === toList && toList.endsWith('Active')) {
      const currentList = toList === 'homeActive' ? [...homeActive] : [...awayActive];
      const oldIndex = currentList.findIndex(p => p.id === player.id);
      
      const targetId = e.target.closest('[data-player-id]')?.getAttribute('data-player-id');
      if (!targetId || Number(targetId) === player.id) return;
      const newIndex = currentList.findIndex(p => p.id === Number(targetId));
      
      currentList.splice(oldIndex, 1);
      currentList.splice(newIndex, 0, player);
      
      if (toList === 'homeActive') setHomeActive(currentList);
      else setAwayActive(currentList);
      return;
    }

    if (fromList === toList) return;

    if (fromList === 'homeActive') {
      setHomeActive(remove);
      if (homePitcher === String(player.id)) setHomePitcher('');
    }
    if (fromList === 'homeBench') setHomeBench(remove);
    if (fromList === 'awayActive') {
      setAwayActive(remove);
      if (awayPitcher === String(player.id)) setAwayPitcher('');
    }
    if (fromList === 'awayBench') setAwayBench(remove);

    if (toList === 'homeActive') setHomeActive(prev => [...prev, player]);
    if (toList === 'homeBench') setHomeBench(prev => [...prev, player]);
    if (toList === 'awayActive') setAwayActive(prev => [...prev, player]);
    if (toList === 'awayBench') setAwayBench(prev => [...prev, player]);
  };

  // Prevent players from appearing in search if they are already in the game somewhere
  const usedPlayerIds = new Set([...homeActive, ...homeBench, ...awayActive, ...awayBench].map(p => p.id));

  // --- GLOBAL SEARCH & CREATE LOGIC ---
  const handleInitiateSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    
    setIsSearching(true);
    const nameParts = newPlayerName.trim().split(' ');
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];

    try {
      const res = await fetch(`/api/admin/players/search?lastName=${lastName}`);
      const matches = await res.json();
      
      // Filter out players already active in this game
      const availableMatches = matches.filter((m: any) => !usedPlayerIds.has(m.id));

      if (availableMatches.length > 0) {
        setPotentialMatches(availableMatches);
      } else {
        // No matches found, force create immediately
        executeCreatePlayer(newPlayerName);
      }
    } catch (error) {
      executeCreatePlayer(newPlayerName);
    } finally {
      setIsSearching(false);
    }
  };

  const executeCreatePlayer = async (nameToCreate: string) => {
    setIsCreatingPlayer(true);
    try {
      const res = await fetch('/api/admin/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameToCreate.trim() })
      });
      
      if (res.ok) {
        const newPlayer = await res.json();
        setAllLeaguePlayers(prev => [...prev, newPlayer]);
        executeImportPlayer(newPlayer);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create player.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingPlayer(false);
    }
  };

  const executeImportPlayer = (player: any) => {
    if (addingForTeam === 'home') setHomeBench(prev => [...prev, player]);
    if (addingForTeam === 'away') setAwayBench(prev => [...prev, player]);
    resetModal();
  };

  const resetModal = () => {
    setAddingForTeam(null);
    setNewPlayerName('');
    setPotentialMatches([]);
  };

  // --- START GAME LOGIC ---
  const handlePlayBall = async () => {
    if (homeActive.length === 0 || awayActive.length === 0) {
      return alert("Both teams need at least one batter in their active lineup!");
    }
    if (!homePitcher || !awayPitcher) {
      return alert("Please select a starting pitcher for both teams!");
    }

    try {
      const res = await fetch(`/api/admin/games/${gameId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          homeLineup: homeActive.map((p) => ({ ...p, teamId: game.homeTeamId, isPitcher: p.id === Number(homePitcher) })),
          awayLineup: awayActive.map((p) => ({ ...p, teamId: game.awayTeamId, isPitcher: p.id === Number(awayPitcher) })) 
        }),
      });

      if (res.ok) {
         router.push(`/games/${gameId}/live`);
      } else {
         const errData = await res.json();
         alert(`Failed to start game: ${errData.error || "Unknown Error"}`);
      }
    } catch (error) {
      alert("Error starting game. Check console.");
    }
  };

  // --- RENDER GUARDS ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdf0d5] flex items-center justify-center">
        <div className="text-[#001d3d] font-black italic animate-pulse text-4xl uppercase tracking-tighter">
          Generating Lineup Cards...
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-[#fdf0d5] flex flex-col items-center justify-center text-[#001d3d] p-10 border-[16px] border-[#001d3d]">
        <h1 className="text-5xl font-black uppercase italic text-[#c1121f] mb-4">Setup Error</h1>
        <p className="text-xl font-bold bg-white border-4 border-[#c1121f] p-4 mb-8 shadow-[8px_8px_0px_#001d3d]">
          {error || "Game object is null. Check API response."}
        </p>
        <div className="flex gap-4">
          <button onClick={() => window.location.reload()} className="bg-[#001d3d] text-white px-8 py-4 font-black uppercase italic tracking-widest border-4 border-[#001d3d] hover:bg-white hover:text-[#001d3d] transition-all shadow-[6px_6px_0px_#001d3d]">Retry Connection</button>
          <Link href="/admin/games/active" className="bg-white text-[#c1121f] px-8 py-4 font-black uppercase italic tracking-widest border-4 border-[#c1121f] hover:bg-[#c1121f] hover:text-white transition-all shadow-[6px_6px_0px_#001d3d]">Back to Command</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf0d5] text-[#001d3d] p-4 md:p-8 border-[16px] border-[#001d3d] relative">
      
      {/* --- UNIFIED ADD PLAYER MODAL --- */}
      {addingForTeam && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-white border-4 border-[#001d3d] p-8 rounded-none w-full max-w-md shadow-[12px_12px_0px_#c1121f] flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-start mb-6 border-b-4 border-[#001d3d]/10 pb-4">
              <div>
                <h2 className="text-3xl font-black uppercase italic text-[#001d3d] leading-none drop-shadow-[2px_2px_0px_#ffd60a]">Sign Player</h2>
                <p className="text-[10px] font-bold text-[#c1121f] uppercase tracking-widest mt-2">
                  To {addingForTeam === 'home' ? game.homeTeam.name : game.awayTeam.name} Roster
                </p>
              </div>
              <button onClick={resetModal} className="text-[#001d3d] font-black text-2xl hover:text-[#c1121f] transition-colors">X</button>
            </div>

            {potentialMatches.length > 0 ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <p className="text-xs font-bold uppercase text-[#001d3d] tracking-widest text-center">Matches found for "{newPlayerName}"</p>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 border-y-2 border-[#001d3d]/10 py-4">
                  {potentialMatches.map(match => (
                    <div key={match.id} className="bg-[#fdf0d5] border-2 border-[#001d3d] p-3 flex justify-between items-center group hover:bg-[#001d3d] hover:text-white transition-all">
                      <span className="font-black text-lg uppercase italic">{match.name}</span>
                      <button 
                        onClick={() => executeImportPlayer(match)}
                        className="text-[10px] font-black uppercase tracking-widest bg-[#c1121f] text-white px-4 py-2 border-2 border-[#c1121f] group-hover:border-white transition-colors"
                      >
                        Draft
                      </button>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => executeCreatePlayer(newPlayerName)}
                  disabled={isCreatingPlayer}
                  className="w-full bg-white text-[#c1121f] border-4 border-[#c1121f] py-4 font-black uppercase tracking-widest text-[10px] hover:bg-[#c1121f] hover:text-white transition-all disabled:opacity-50"
                >
                  {isCreatingPlayer ? 'PROCESSING...' : 'Not listed? Create Brand New'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleInitiateSearch} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest mb-2 block">Global Database Search</label>
                  <input 
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Enter Player Name"
                    className="w-full bg-[#fdf0d5] border-4 border-[#001d3d] p-4 text-[#001d3d] font-black uppercase outline-none focus:border-[#c1121f] transition-colors shadow-inner"
                    autoFocus
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSearching || !newPlayerName.trim()}
                  className="w-full bg-[#001d3d] text-white py-5 font-black italic uppercase tracking-widest text-lg border-4 border-[#001d3d] hover:bg-white hover:text-[#001d3d] transition-all shadow-[6px_6px_0px_#ffd60a] disabled:opacity-50 active:translate-y-1 active:shadow-none"
                >
                  {isSearching ? 'SCANNING...' : 'Search & Draft'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- MAIN UI --- */}
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-12 border-b-8 border-[#c1121f] pb-6 flex flex-col md:flex-row justify-between md:items-end gap-6">
          <div>
            <Link href="/admin/games/active" className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#c1121f] transition-colors block mb-4">
              ← Game Command
            </Link>
            <h1 className="text-6xl md:text-7xl font-black italic uppercase text-[#001d3d] tracking-tighter drop-shadow-[4px_4px_0px_#ffd60a] leading-none">
              Lineups
            </h1>
            <p className="text-[#c1121f] font-bold uppercase text-xs mt-3 tracking-[0.4em] italic">WIFF+ // Game ID: {gameId}</p>
          </div>
          <button onClick={handlePlayBall} className="bg-[#c1121f] text-white px-10 py-5 font-black italic uppercase tracking-widest text-xl border-4 border-[#001d3d] hover:bg-white hover:text-[#c1121f] transition-all shadow-[8px_8px_0px_#001d3d] active:translate-y-1 active:shadow-none">
            PLAY BALL →
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {['away', 'home'].map((side) => {
            const isHome = side === 'home';
            const team = isHome ? game.homeTeam : game.awayTeam;
            const active = isHome ? homeActive : awayActive;
            const bench = isHome ? homeBench : awayBench;
            const pitcher = isHome ? homePitcher : awayPitcher;
            const setPitcher = isHome ? setHomePitcher : setAwayPitcher;

            return (
              <div key={side} className="space-y-6 bg-white border-4 border-[#001d3d] p-6 shadow-[12px_12px_0px_#c1121f]">
                
                {/* TEAM HEADER */}
                <div className="flex justify-between items-center bg-[#001d3d] text-white px-6 py-4 skew-x-[-10deg] shadow-[6px_6px_0px_#ffd60a]">
                  <h2 className="text-3xl font-black italic uppercase skew-x-[10deg] tracking-tighter">{team.name}</h2>
                  <span className="text-[10px] font-black uppercase tracking-widest skew-x-[10deg] text-[#ffd60a]">{isHome ? 'Home' : 'Visitor'}</span>
                </div>

                {/* PITCHER SELECTION */}
                <div className="bg-[#fdf0d5] p-4 border-4 border-[#001d3d] shadow-inner">
                  <label className="text-[10px] font-black text-[#c1121f] uppercase tracking-widest block mb-2">Starting Pitcher</label>
                  <select 
                    className="w-full bg-white p-3 border-2 border-[#001d3d] font-black uppercase text-[#001d3d] outline-none cursor-pointer"
                    value={pitcher} 
                    onChange={(e) => setPitcher(e.target.value)}
                  >
                    <option value="">-- SELECT PITCHER --</option>
                    {active.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  {active.length === 0 && <p className="text-[9px] font-bold text-[#669bbc] mt-2 italic uppercase">Drag players to active roster to assign pitcher.</p>}
                </div>

                {/* ACTIVE LINEUP DROP ZONE */}
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, `${side}Active`)}
                  className="bg-[#001d3d] border-4 border-[#001d3d] p-4 min-h-[350px] shadow-inner relative"
                >
                  <h3 className="text-[10px] font-black text-[#ffd60a] mb-4 uppercase tracking-widest border-b-2 border-white/10 pb-2">
                    Batting Order (Drag to Reorder)
                  </h3>
                  
                  {active.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                      <p className="text-white italic uppercase font-black text-2xl tracking-tighter">Drop Players Here</p>
                    </div>
                  )}

                  <div className="space-y-3 relative z-10">
                    {active.map((p, i) => (
                      <div 
                        key={p.id} 
                        draggable 
                        data-player-id={p.id}
                        onDragStart={(e) => onDragStart(e, p, `${side}Active`)}
                        className="bg-white p-4 flex justify-between items-center border-4 border-[#001d3d] cursor-grab active:cursor-grabbing hover:border-[#c1121f] transition-colors shadow-[4px_4px_0px_#c1121f]"
                      >
                        <div className="flex items-center gap-4 pointer-events-none">
                          <span className="text-[#669bbc] font-black italic text-2xl">#{i + 1}</span>
                          <p className="font-black uppercase text-xl text-[#001d3d] leading-none">{p.name}</p>
                        </div>
                        {String(p.id) === pitcher && (
                          <span className="bg-[#c1121f] text-white text-[9px] font-black px-3 py-1 uppercase tracking-widest pointer-events-none shadow-sm">Pitcher</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* BENCH DROP ZONE */}
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, `${side}Bench`)}
                  className="bg-[#fdf0d5] border-4 border-dashed border-[#001d3d]/30 p-6 min-h-[150px] flex flex-col"
                >
                  <h3 className="text-[10px] font-black text-[#001d3d] mb-4 uppercase tracking-widest">Available Bench</h3>
                  
                  <div className="flex flex-wrap gap-2 flex-1">
                    {bench.length === 0 && <p className="text-[10px] font-bold text-[#669bbc] italic uppercase w-full">Bench is empty</p>}
                    
                    {bench.map(p => (
                      <div 
                        key={p.id} 
                        draggable 
                        onDragStart={(e) => onDragStart(e, p, `${side}Bench`)}
                        className="bg-[#001d3d] px-4 py-2 text-sm font-bold text-white border-2 border-[#001d3d] cursor-grab hover:bg-[#c1121f] hover:border-[#c1121f] transition-colors uppercase h-fit shadow-sm"
                      >
                        {p.name}
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setAddingForTeam(side as 'home' | 'away')}
                    className="w-full mt-6 bg-white border-4 border-[#001d3d] text-[#001d3d] py-4 text-[10px] font-black uppercase tracking-widest hover:bg-[#001d3d] hover:text-white transition-all shadow-[4px_4px_0px_#c1121f] active:translate-y-1 active:shadow-none"
                  >
                    + Draft Non-Rostered Player
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}