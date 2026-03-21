'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LineupConstructor({ params }: { params: Promise<{ gameId: string }> }) {
  // 1. Unwrap params safely
  const resolvedParams = use(params);
  const gameId = resolvedParams?.gameId;
  const router = useRouter();
  
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Global Player State for the Popup
  const [allLeaguePlayers, setAllLeaguePlayers] = useState<any[]>([]);
  const [addingForTeam, setAddingForTeam] = useState<'home' | 'away' | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
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
        // Fetch both the specific game rosters AND the global player list concurrently
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

    // Reordering within the same Active List
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

  // --- NON-ROSTERED PLAYER LOGIC ---
  const handleAddFromGlobal = (player: any) => {
    if (addingForTeam === 'home') setHomeBench(prev => [...prev, player]);
    if (addingForTeam === 'away') setAwayBench(prev => [...prev, player]);
    setAddingForTeam(null);
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    setIsCreatingPlayer(true);

    try {
      const res = await fetch('/api/admin/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlayerName.trim() })
      });

      if (res.ok) {
        const newPlayer = await res.json();
        // Add to the global pool so they exist in memory
        setAllLeaguePlayers(prev => [...prev, newPlayer].sort((a, b) => a.name.localeCompare(b.name)));
        // Immediately assign to the team bench we were adding for
        handleAddFromGlobal(newPlayer);
        setNewPlayerName('');
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

  // Prevent players from appearing in the popup if they are already in the game somewhere
  const usedPlayerIds = new Set([...homeActive, ...homeBench, ...awayActive, ...awayBench].map(p => p.id));
  const availableGlobalPlayers = allLeaguePlayers.filter(p => !usedPlayerIds.has(p.id));

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
          // EXPLICITLY INJECTING teamId HERE
          homeLineup: homeActive.map((p) => ({ ...p, teamId: game.homeTeamId, isPitcher: p.id === Number(homePitcher) })),
          awayLineup: awayActive.map((p) => ({ ...p, teamId: game.awayTeamId, isPitcher: p.id === Number(awayPitcher) }))
         }),
      });

      if (res.ok) {
         router.push(`/games/${gameId}/live`);
      } else {
         // ADD THIS to see the exact error from the server
         const errData = await res.json();
         console.error("Server Error:", errData);
         alert(`Failed to start game: ${errData.error || "Unknown Error"}`);
      }
    } catch (error) {
      console.error("Network/Client Error:", error);
      alert("Error starting game. Check console.");
    }
  };

  // --- RENDER GUARDS ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#001d3d] flex items-center justify-center">
        <div className="text-[#fdf0d5] font-black italic animate-pulse text-2xl uppercase">
          Initializing Construction...
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-[#001d3d] flex flex-col items-center justify-center text-[#fdf0d5] p-10 border-[12px] border-[#c1121f]">
        <h1 className="text-5xl font-black uppercase italic text-[#c1121f] mb-4">Setup Error</h1>
        <p className="text-xl font-bold bg-black/30 p-4 mb-8 border-l-4 border-[#c1121f]">
          {error || "Game object is null. Check API response."}
        </p>
        <div className="flex gap-4">
          <button onClick={() => window.location.reload()} className="bg-white text-[#001d3d] px-6 py-3 font-black uppercase italic">Retry</button>
          <Link href="/admin/games/active" className="bg-[#c1121f] text-white px-6 py-3 font-black uppercase italic border-2 border-white">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] p-4 md:p-8 border-[12px] border-[#c1121f] relative">
      
      {/* --- ADD PLAYER MODAL --- */}
      {addingForTeam && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <div className="bg-[#002D62] border-2 border-[#c1121f] p-6 rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 border-b-2 border-[#669bbc]/30 pb-4">
              <div>
                <h2 className="text-2xl font-black uppercase italic text-white leading-none">Draft Player</h2>
                <p className="text-[10px] font-bold text-[#669bbc] uppercase tracking-widest mt-1">
                  To {addingForTeam === 'home' ? game.homeTeam.name : game.awayTeam.name} Bench
                </p>
              </div>
              <button onClick={() => setAddingForTeam(null)} className="text-[#c1121f] font-black text-xl hover:text-white">✕</button>
            </div>

            {/* Create Brand New Player */}
            <form onSubmit={handleCreateAndAdd} className="mb-6 space-y-2">
              <label className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest">Create New Free Agent</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Player Name"
                  className="w-full bg-[#001d3d] border-2 border-[#669bbc]/50 p-3 text-white font-bold uppercase outline-none focus:border-[#fdf0d5]"
                />
                <button 
                  type="submit"
                  disabled={isCreatingPlayer || !newPlayerName.trim()}
                  className="bg-[#c1121f] px-4 font-black italic uppercase tracking-widest text-[10px] border border-[#c1121f] hover:border-white transition-all disabled:opacity-50"
                >
                  {isCreatingPlayer ? '...' : 'Create'}
                </button>
              </div>
            </form>

            {/* List Existing Global Players */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-2 border-t-2 border-[#669bbc]/30 pt-4">
              <label className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest block mb-2">Or Select Existing</label>
              {availableGlobalPlayers.length === 0 ? (
                <p className="text-xs font-bold text-[#669bbc] uppercase italic">No free agents available.</p>
              ) : (
                availableGlobalPlayers.map(p => (
                  <div key={p.id} className="flex justify-between items-center bg-[#003566] p-3 border border-[#669bbc]/50 group">
                    <span className="font-bold text-white uppercase">{p.name}</span>
                    <button 
                      onClick={() => handleAddFromGlobal(p)}
                      className="text-[10px] font-black uppercase tracking-widest bg-white text-[#001d3d] px-3 py-1 hover:bg-[#c1121f] hover:text-white transition-colors"
                    >
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN UI --- */}
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 border-b-4 border-[#669bbc] pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black italic uppercase text-white tracking-tighter">Lineup Constructor</h1>
            <p className="text-[#669bbc] font-bold uppercase text-xs">Game ID: {gameId}</p>
          </div>
          <button onClick={handlePlayBall} className="bg-[#c1121f] text-white px-8 py-4 font-black italic uppercase text-sm border-2 border-[#fdf0d5] hover:bg-white hover:text-[#c1121f] transition-all shadow-[6px_6px_0px_#003566]">
            PLAY BALL 
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
              <div key={side} className="space-y-4">
                
                {/* TEAM HEADER */}
                <div className="flex justify-between items-center bg-[#669bbc] text-[#001d3d] px-4 py-2 skew-x-[-10deg]">
                  <h2 className="text-xl font-black italic uppercase skew-x-[10deg]">{team.name}</h2>
                  <span className="text-[10px] font-bold uppercase tracking-widest skew-x-[10deg]">{isHome ? 'Home' : 'Visitor'}</span>
                </div>

                {/* PITCHER SELECTION */}
                <div className="bg-[#001d3d] p-3 border-2 border-[#c1121f]">
                  <label className="text-[10px] font-black text-[#c1121f] uppercase tracking-widest block mb-1">Starting Pitcher</label>
                  <select 
                    className="w-full bg-[#003566] p-3 border border-[#669bbc] font-bold outline-none text-white uppercase"
                    value={pitcher} 
                    onChange={(e) => setPitcher(e.target.value)}
                  >
                    <option value="">-- SELECT PITCHER --</option>
                    {active.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  {active.length === 0 && <p className="text-[9px] text-[#669bbc] mt-1 italic uppercase">Drag players to active roster to assign pitcher.</p>}
                </div>

                {/* ACTIVE LINEUP DROP ZONE */}
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, `${side}Active`)}
                  className="bg-[#003566] border-2 border-[#fdf0d5] p-4 min-h-[350px] shadow-inner"
                >
                  <h3 className="text-[10px] font-black text-[#fdf0d5] mb-4 uppercase tracking-widest border-b border-white/10 pb-2">
                    Batting Order (Drag to Reorder)
                  </h3>
                  
                  {active.length === 0 && (
                    <div className="h-full flex items-center justify-center opacity-50">
                      <p className="text-[#669bbc] italic uppercase font-black">Drop Players Here</p>
                    </div>
                  )}

                  {active.map((p, i) => (
                    <div 
                      key={p.id} 
                      draggable 
                      data-player-id={p.id}
                      onDragStart={(e) => onDragStart(e, p, `${side}Active`)}
                      className="bg-[#001d3d] p-4 mb-3 flex justify-between items-center border-2 border-[#669bbc]/50 cursor-grab active:cursor-grabbing hover:border-[#fdf0d5] transition-colors"
                    >
                      <div className="flex items-center gap-4 pointer-events-none">
                        <span className="text-[#c1121f] font-black italic text-xl">#{i + 1}</span>
                        <p className="font-black uppercase text-lg text-white">{p.name}</p>
                      </div>
                      {String(p.id) === pitcher && (
                         <span className="bg-[#c1121f] text-white text-[9px] font-black px-2 py-1 uppercase tracking-widest pointer-events-none">Pitcher</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* BENCH DROP ZONE */}
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, `${side}Bench`)}
                  className="bg-black/40 border-2 border-dashed border-[#669bbc] p-4 min-h-[150px] flex flex-col"
                >
                  <h3 className="text-[10px] font-black text-[#669bbc] mb-3 uppercase tracking-widest">Available Bench</h3>
                  
                  <div className="flex flex-wrap gap-2 flex-1">
                    {bench.length === 0 && <p className="text-[10px] text-[#669bbc] italic uppercase w-full mt-2">Bench is empty</p>}
                    
                    {bench.map(p => (
                      <div 
                        key={p.id} 
                        draggable 
                        onDragStart={(e) => onDragStart(e, p, `${side}Bench`)}
                        className="bg-[#001d3d] px-4 py-2 text-sm font-bold text-[#669bbc] border border-[#669bbc]/50 cursor-grab hover:text-white hover:border-white transition-colors uppercase h-fit"
                      >
                        {p.name}
                      </div>
                    ))}
                  </div>

                  {/* ADD NON-ROSTERED PLAYER BUTTON */}
                  <button 
                    onClick={() => setAddingForTeam(side as 'home' | 'away')}
                    className="w-full mt-4 bg-[#001d3d] border border-[#669bbc]/50 text-[#669bbc] py-3 text-[10px] font-black uppercase tracking-widest hover:text-white hover:border-white transition-all border-dashed"
                  >
                    + Add Non-Rostered Player
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