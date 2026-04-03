'use client';
import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LineupConstructor({ params }: { params: Promise<{ gameId: string }> }) {
  const resolvedParams = use(params);
  const gameId = resolvedParams?.gameId;
  const router = useRouter();

  // --- NAVIGATION FIX ---
  const searchParams = useSearchParams();
  const leagueId = searchParams.get('leagueId');
  const seasonId = searchParams.get('seasonId');

  const backUrl = (leagueId && seasonId) 
    ? `/admin/leagues/${leagueId}/seasons/${seasonId}/play`
    : `/admin/games/active`;

  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addingForTeam, setAddingForTeam] = useState<'home' | 'away' | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');

  // Search & Duplicate Check States
  const [isSearching, setIsSearching] = useState(false);
  const [potentialMatches, setPotentialMatches] = useState<any[]>([]);
  const [isCreatingPlayer, setIsCreatingPlayer] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false); 

  // Lineup & Bench States
  const [homeActive, setHomeActive] = useState<any[]>([]);
  const [homeFielders, setHomeFielders] = useState<any[]>([]); // NEW: Fielders/Pitchers Only
  const [homeBench, setHomeBench] = useState<any[]>([]);
  
  const [awayActive, setAwayActive] = useState<any[]>([]);
  const [awayFielders, setAwayFielders] = useState<any[]>([]); // NEW: Fielders/Pitchers Only
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
        const res = await fetch(`/api/admin/games/${gameId}/prepare`);
        if (!res.ok) throw new Error(`API Error: ${await res.text()}`);
        
        const data = await res.json();
        
        if (data && data.game) {
          setGame(data.game);
          setHomeBench(data.homeRoster?.map((p:any) => ({...p, position: 'Fielder'})) || []);
          setAwayBench(data.awayRoster?.map((p:any) => ({...p, position: 'Fielder'})) || []);
        } else {
          setError("The API returned data, but the game details are missing.");
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

  // --- POSITION & DH HANDLER ---
  const handlePositionChange = (side: 'home' | 'away', playerId: number, newPosition: string) => {
    if (side === 'home') {
      setHomeActive(prev => prev.map(p => p.id === playerId ? { ...p, position: newPosition, dhForId: newPosition !== 'DH' ? null : p.dhForId } : p));
    } else {
      setAwayActive(prev => prev.map(p => p.id === playerId ? { ...p, position: newPosition, dhForId: newPosition !== 'DH' ? null : p.dhForId } : p));
    }
  };

  const handleDhForChange = (side: 'home' | 'away', batterId: number, fielderId: string) => {
    if (side === 'home') {
      setHomeActive(prev => prev.map(p => p.id === batterId ? { ...p, dhForId: fielderId } : p));
    } else {
      setAwayActive(prev => prev.map(p => p.id === batterId ? { ...p, dhForId: fielderId } : p));
    }
  };

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

    // Reordering within Active list
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

    // Remove from source
    if (fromList === 'homeActive') {
      setHomeActive(remove);
      if (homePitcher === String(player.id)) setHomePitcher('');
    }
    if (fromList === 'homeFielders') {
      setHomeFielders(remove);
      if (homePitcher === String(player.id)) setHomePitcher('');
    }
    if (fromList === 'homeBench') setHomeBench(remove);

    if (fromList === 'awayActive') {
      setAwayActive(remove);
      if (awayPitcher === String(player.id)) setAwayPitcher('');
    }
    if (fromList === 'awayFielders') {
      setAwayFielders(remove);
      if (awayPitcher === String(player.id)) setAwayPitcher('');
    }
    if (fromList === 'awayBench') setAwayBench(remove);

    // Add to destination
    if (toList === 'homeActive') setHomeActive(prev => [...prev, { ...player, position: player.position || 'Fielder' }]);
    if (toList === 'homeFielders') setHomeFielders(prev => [...prev, { ...player, position: 'Fielder' }]);
    if (toList === 'homeBench') setHomeBench(prev => [...prev, player]);
    
    if (toList === 'awayActive') setAwayActive(prev => [...prev, { ...player, position: player.position || 'Fielder' }]);
    if (toList === 'awayFielders') setAwayFielders(prev => [...prev, { ...player, position: 'Fielder' }]);
    if (toList === 'awayBench') setAwayBench(prev => [...prev, player]);
  };

  const usedPlayerIds = new Set([...homeActive, ...homeFielders, ...homeBench, ...awayActive, ...awayFielders, ...awayBench].map(p => p.id));

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
      const availableMatches = matches.filter((m: any) => !usedPlayerIds.has(m.id));

      if (availableMatches.length > 0) {
        setPotentialMatches(availableMatches);
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
    setIsCreatingPlayer(true);
    setShowDuplicateModal(false);
    
    try {
      const res = await fetch('/api/admin/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameToCreate.trim(), leagueId: game.season?.leagueId || game.leagueId })
      });
      
      if (res.ok) {
        const newPlayer = await res.json();
        await executeImportPlayer({...newPlayer, position: 'Fielder'}); 
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

  const executeImportPlayer = async (player: any) => {
    setShowDuplicateModal(false);
    
    const targetTeamId = addingForTeam === 'home' ? game.homeTeamId : game.awayTeamId;
    const targetSeasonId = game.seasonId;

    if (targetTeamId && targetSeasonId) {
      try {
        await fetch(`/api/admin/seasons/${targetSeasonId}/players`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: player.id, teamId: targetTeamId })
        });
      } catch (e) { 
        console.error("Failed to officially sign player to season roster", e); 
      }
    }

    if (addingForTeam === 'home') setHomeBench(prev => [...prev, { ...player, position: 'Fielder' }]);
    if (addingForTeam === 'away') setAwayBench(prev => [...prev, { ...player, position: 'Fielder' }]);

    resetModal();
  };

  const resetModal = () => {
    setAddingForTeam(null);
    setNewPlayerName('');
    setPotentialMatches([]);
    setShowDuplicateModal(false);
  };

  // --- START GAME LOGIC ---
  const handlePlayBall = async () => {
    if (homeActive.length === 0 || awayActive.length === 0) {
      return alert("Both teams need at least one batter in their active lineup!");
    }
    if (!homePitcher || !awayPitcher) {
      return alert("Please select a starting pitcher for both teams!");
    }

    // Merge active batters and active fielders for the API payload
    const finalHomeRoster = [...homeActive, ...homeFielders].map(p => ({
      ...p, teamId: game.homeTeamId, isPitcher: p.id === Number(homePitcher)
    }));
    const finalAwayRoster = [...awayActive, ...awayFielders].map(p => ({
      ...p, teamId: game.awayTeamId, isPitcher: p.id === Number(awayPitcher)
    }));

    try {
      const res = await fetch(`/api/admin/games/${gameId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          homeLineup: finalHomeRoster,
          awayLineup: finalAwayRoster 
        }),
      });

      if (res.ok) {
          router.push(`/games/${gameId}/live?source=admin`);
      } else {
          const errData = await res.json();
          alert(`Failed to start game: ${errData.error || "Unknown Error"}`);
      }
    } catch (error) {
      alert("Error starting game. Check console.");
    }
  };

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
          {error || "Game object is null."}
        </p>
        <div className="flex gap-4">
          <button onClick={() => window.location.reload()} className="bg-[#001d3d] text-white px-8 py-4 font-black uppercase italic border-4 border-[#001d3d] hover:bg-white hover:text-[#001d3d] shadow-[6px_6px_0px_#001d3d]">Retry Connection</button>
          <Link href={backUrl} className="bg-white text-[#c1121f] px-8 py-4 font-black uppercase italic border-4 border-[#c1121f] hover:bg-[#c1121f] hover:text-white shadow-[6px_6px_0px_#001d3d]">Back to Command</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf0d5] text-[#001d3d] p-4 md:p-8 border-[16px] border-[#001d3d] relative">
      
      {/* --- DUPLICATE CHECK MODAL --- */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
          <div className="bg-[#001d3d] border-4 border-[#c1121f] p-8 max-w-lg w-full shadow-2xl">
            <h2 className="text-3xl font-black italic uppercase text-white tracking-wide mb-2 text-center drop-shadow-[2px_2px_0px_#c1121f]">
              Wait! Match Found
            </h2>
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
              {potentialMatches.map(match => (
                <div key={match.id} className="bg-[#003566] border-2 border-[#669bbc] p-4 flex justify-between items-center group">
                  <span className="font-bold text-lg text-white">{match.name}</span>
                  <button onClick={() => executeImportPlayer(match)} className="text-[10px] font-black uppercase tracking-widest bg-[#c1121f] text-white px-4 py-2 hover:bg-white hover:text-[#c1121f]">Import to Bench</button>
                </div>
              ))}
            </div>
            <div className="border-t-2 border-[#669bbc]/30 pt-4 flex gap-4">
              <button onClick={() => executeCreatePlayer(newPlayerName)} className="flex-1 bg-transparent border-2 border-white/50 text-white/50 px-4 py-3 font-black uppercase text-[10px]">No, Create New</button>
              <button onClick={() => setShowDuplicateModal(false)} className="flex-1 text-[#669bbc] px-4 py-3 font-black uppercase text-[10px]">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD PLAYER MODAL --- */}
      {addingForTeam && !showDuplicateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-white border-4 border-[#001d3d] p-8 rounded-none w-full max-w-md shadow-[12px_12px_0px_#c1121f] flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start mb-6 border-b-4 border-[#001d3d]/10 pb-4">
              <div>
                <h2 className="text-3xl font-black uppercase italic text-[#001d3d] drop-shadow-[2px_2px_0px_#ffd60a]">Sign Player</h2>
                <p className="text-[10px] font-bold text-[#c1121f] uppercase mt-2">To {addingForTeam === 'home' ? game.homeTeam.name : game.awayTeam.name}</p>
              </div>
              <button onClick={resetModal} className="text-[#001d3d] font-black text-2xl hover:text-[#c1121f]">X</button>
            </div>
            <form onSubmit={handleInitiateSearch} className="space-y-6">
              <input type="text" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Enter Player Name" className="w-full bg-[#fdf0d5] border-4 border-[#001d3d] p-4 text-[#001d3d] font-black uppercase outline-none focus:border-[#c1121f]" autoFocus />
              <button type="submit" disabled={isSearching || !newPlayerName.trim()} className="w-full bg-[#001d3d] text-white py-5 font-black italic uppercase shadow-[6px_6px_0px_#ffd60a]">{isSearching ? 'SCANNING...' : 'Search & Draft'}</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MAIN UI --- */}
      <div className="max-w-[1800px] mx-auto">
        <header className="mb-12 border-b-8 border-[#c1121f] pb-6 flex flex-col md:flex-row justify-between md:items-end gap-6">
          <div>
            <Link href={backUrl} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#c1121f] transition-colors block mb-4">
               ← Back to Gameday Board
            </Link>
            <h1 className="text-6xl md:text-7xl font-black italic uppercase text-[#001d3d] tracking-tighter drop-shadow-[4px_4px_0px_#ffd60a] leading-none">Lineups</h1>
            <p className="text-[#c1121f] font-bold uppercase text-xs mt-3 tracking-[0.4em] italic">WIFF+ // Game ID: {gameId}</p>
          </div>
          <button onClick={handlePlayBall} className="bg-[#c1121f] text-white px-10 py-5 font-black italic uppercase tracking-widest text-xl border-4 border-[#001d3d] hover:bg-white hover:text-[#c1121f] transition-all shadow-[8px_8px_0px_#001d3d]">PLAY BALL</button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {['away', 'home'].map((side) => {
            const isHome = side === 'home';
            const team = isHome ? game.homeTeam : game.awayTeam;
            const active = isHome ? homeActive : awayActive;
            const fielders = isHome ? homeFielders : awayFielders;
            const bench = isHome ? homeBench : awayBench;
            const pitcher = isHome ? homePitcher : awayPitcher;
            const setPitcher = isHome ? setHomePitcher : setAwayPitcher;

            return (
              <div key={side} className="space-y-6 bg-white border-4 border-[#001d3d] p-6 shadow-[12px_12px_0px_#c1121f]">
                <div className="flex justify-between items-center bg-[#001d3d] text-white px-6 py-4 skew-x-[-10deg] shadow-[6px_6px_0px_#ffd60a]">
                  <h2 className="text-3xl font-black italic uppercase skew-x-[10deg] tracking-tighter">{team.name}</h2>
                  <span className="text-[10px] font-black uppercase tracking-widest skew-x-[10deg] text-[#ffd60a]">{isHome ? 'Home' : 'Visitor'}</span>
                </div>

                <div className="bg-[#fdf0d5] p-4 border-4 border-[#001d3d] shadow-inner">
                  <label className="text-[10px] font-black text-[#c1121f] uppercase tracking-widest block mb-2">Starting Pitcher</label>
                  <select className="w-full bg-white p-3 border-2 border-[#001d3d] font-black uppercase text-[#001d3d] outline-none cursor-pointer" value={pitcher} onChange={(e) => setPitcher(e.target.value)}>
                    <option value="">-- SELECT PITCHER --</option>
                    {[...active, ...fielders].map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                {/* 1. BATTING ORDER */}
                <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, `${side}Active`)} className="bg-[#001d3d] border-4 border-[#001d3d] p-4 min-h-[250px] shadow-inner relative">
                  <h3 className="text-[10px] font-black text-[#ffd60a] mb-4 uppercase tracking-widest border-b-2 border-white/10 pb-2">1. Batting Order</h3>
                  <div className="space-y-3 relative z-10">
                    {active.map((p, i) => (
                      <div key={p.id} draggable data-player-id={p.id} onDragStart={(e) => onDragStart(e, p, `${side}Active`)} className="bg-white p-4 flex flex-col sm:flex-row justify-between items-center border-4 border-[#001d3d] cursor-grab hover:border-[#c1121f] shadow-[4px_4px_0px_#c1121f] gap-3">
                        <div className="flex items-center gap-4 pointer-events-none w-full sm:w-auto">
                          <span className="text-[#669bbc] font-black italic text-2xl">#{i + 1}</span>
                          <p className="font-black uppercase text-xl text-[#001d3d] leading-none truncate max-w-[200px]">{p.name}</p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                          <div className="flex items-center gap-3">
                            <select 
                              value={String(p.id) === pitcher ? 'Pitcher' : (p.position === 'Pitcher' ? 'Fielder' : (p.position || 'Fielder'))} 
                              disabled={String(p.id) === pitcher} 
                              onChange={(e) => handlePositionChange(side as 'home' | 'away', p.id, e.target.value)} 
                              className="bg-[#fdf0d5] text-[#001d3d] p-2 border-2 border-[#001d3d] text-[10px] font-black uppercase outline-none cursor-pointer"
                            >
                              {String(p.id) === pitcher && <option value="Pitcher">Pitcher</option>}
                              <option value="Fielder">Fielder</option>
                              <option value="DH">DH</option>
                              <option value="EH">EH</option>
                            </select>
                            {String(p.id) === pitcher && <span className="bg-[#c1121f] text-white text-[9px] font-black px-3 py-2 uppercase shadow-sm">PITCHER</span>}
                          </div>

                          {/* DH Link Dropdown */}
                          {p.position === 'DH' && fielders.length > 0 && (
                             <select 
                               value={p.dhForId || ''} 
                               onChange={(e) => handleDhForChange(side as 'home' | 'away', p.id, e.target.value)}
                               className="bg-black text-[#ffd60a] p-2 border-2 border-[#ffd60a] text-[10px] font-black uppercase outline-none w-full sm:w-auto mt-2 sm:mt-0"
                             >
                               <option value="">Hitting For...</option>
                               {fielders.map(f => (
                                 <option key={f.id} value={f.id}>{f.name}</option>
                               ))}
                             </select>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. FIELDERS/PITCHERS ONLY (NEW) */}
                <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, `${side}Fielders`)} className="bg-[#e0e1dd] border-4 border-dashed border-[#001d3d] p-4 min-h-[120px] shadow-inner relative">
                  <h3 className="text-[10px] font-black text-[#001d3d] mb-4 uppercase tracking-widest border-b-2 border-[#001d3d]/10 pb-2">2. Fielders & Pitchers Only (Non-Batters)</h3>
                  <div className="space-y-3 relative z-10">
                    {fielders.map((p) => (
                      <div key={p.id} draggable onDragStart={(e) => onDragStart(e, p, `${side}Fielders`)} className="bg-white p-3 flex flex-col sm:flex-row justify-between items-center border-2 border-[#001d3d] cursor-grab hover:border-[#669bbc] shadow-[4px_4px_0px_#001d3d] gap-2">
                        <p className="font-black uppercase text-base text-[#001d3d] leading-none">{p.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-200 text-[#001d3d] p-1 px-2 border border-slate-300 text-[9px] font-black uppercase">
                            {String(p.id) === pitcher ? 'Pitcher' : 'Fielder'}
                          </span>
                          {String(p.id) === pitcher && <span className="bg-[#c1121f] text-white text-[8px] font-black px-2 py-1 uppercase">PITCHER</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. AVAILABLE BENCH */}
                <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, `${side}Bench`)} className="bg-white border-4 border-dashed border-[#669bbc] p-6 min-h-[150px] flex flex-col">
                  <h3 className="text-[10px] font-black text-[#669bbc] mb-4 uppercase tracking-widest">3. Available Bench</h3>
                  <div className="flex flex-wrap gap-2 flex-1">
                    {bench.map(p => (
                      <div key={p.id} draggable onDragStart={(e) => onDragStart(e, p, `${side}Bench`)} className="bg-white px-4 py-2 text-sm font-bold text-[#001d3d] border-2 border-[#669bbc] cursor-grab hover:bg-[#669bbc] hover:text-white transition-colors uppercase h-fit shadow-sm">{p.name}</div>
                    ))}
                  </div>
                  <button onClick={() => setAddingForTeam(side as 'home' | 'away')} className="w-full mt-6 bg-white border-4 border-[#001d3d] text-[#001d3d] py-4 text-[10px] font-black uppercase tracking-widest hover:bg-[#001d3d] hover:text-white transition-all shadow-[4px_4px_0px_#c1121f]">+ Draft Player to Bench</button>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}