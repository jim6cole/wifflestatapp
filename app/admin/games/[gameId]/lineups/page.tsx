'use client';
import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const formatName = (name: string) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function LineupConstructor({ params }: { params: Promise<{ gameId: string }> }) {
  const resolvedParams = use(params);
  const gameId = resolvedParams?.gameId;
  const router = useRouter();

  const searchParams = useSearchParams();
  const urlLeagueId = searchParams.get('leagueId');
  const seasonId = searchParams.get('seasonId');

  const backUrl = (urlLeagueId && seasonId) 
    ? `/admin/leagues/${urlLeagueId}/seasons/${seasonId}/play`
    : `/admin/games/active`;

  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addingForTeam, setAddingForTeam] = useState<'home' | 'away' | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');

  const [isSearching, setIsSearching] = useState(false);
  const [potentialMatches, setPotentialMatches] = useState<any[]>([]);
  const [isCreatingPlayer, setIsCreatingPlayer] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false); 

  const [homeActive, setHomeActive] = useState<any[]>([]);
  const [homeFielders, setHomeFielders] = useState<any[]>([]); 
  const [homeBench, setHomeBench] = useState<any[]>([]);
  
  const [awayActive, setAwayActive] = useState<any[]>([]);
  const [awayFielders, setAwayFielders] = useState<any[]>([]); 
  const [awayBench, setAwayBench] = useState<any[]>([]);

  const [homePitcher, setHomePitcher] = useState('');
  const [awayPitcher, setAwayPitcher] = useState('');

  // UI Selection State
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: number, side: 'home' | 'away', list: string } | null>(null);

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

  const movePlayer = (player: any, fromSide: 'home' | 'away', fromList: string, toList: string) => {
    if (fromList === 'Active') {
      if (fromSide === 'home') {
        setHomeActive(prev => prev.filter(p => p.id !== player.id));
        if (homePitcher === String(player.id)) setHomePitcher('');
      } else {
        setAwayActive(prev => prev.filter(p => p.id !== player.id));
        if (awayPitcher === String(player.id)) setAwayPitcher('');
      }
    } else if (fromList === 'Fielders') {
      if (fromSide === 'home') {
        setHomeFielders(prev => prev.filter(p => p.id !== player.id));
        if (homePitcher === String(player.id)) setHomePitcher('');
      } else {
        setAwayFielders(prev => prev.filter(p => p.id !== player.id));
        if (awayPitcher === String(player.id)) setAwayPitcher('');
      }
    } else if (fromList === 'Bench') {
      if (fromSide === 'home') setHomeBench(prev => prev.filter(p => p.id !== player.id));
      else setAwayBench(prev => prev.filter(p => p.id !== player.id));
    }

    if (toList === 'Active') {
      const activePlayer = { ...player, position: player.position || 'Fielder' };
      if (fromSide === 'home') setHomeActive(prev => [...prev, activePlayer]);
      else setAwayActive(prev => [...prev, activePlayer]);
    } else if (toList === 'Fielders') {
      const fielderPlayer = { ...player, position: 'Fielder' };
      if (fromSide === 'home') setHomeFielders(prev => [...prev, fielderPlayer]);
      else setAwayFielders(prev => [...prev, fielderPlayer]);
    } else if (toList === 'Bench') {
      if (fromSide === 'home') setHomeBench(prev => [...prev, player]);
      else setAwayBench(prev => [...prev, player]);
    }
    
    setSelectedPlayer(null);
  };

  const reorderLineup = (side: 'home' | 'away', index: number, direction: 'up' | 'down') => {
    const list = side === 'home' ? [...homeActive] : [...awayActive];
    if (direction === 'up' && index > 0) {
      const temp = list[index - 1];
      list[index - 1] = list[index];
      list[index] = temp;
    } else if (direction === 'down' && index < list.length - 1) {
      const temp = list[index + 1];
      list[index + 1] = list[index];
      list[index] = temp;
    }
    if (side === 'home') setHomeActive(list);
    else setAwayActive(list);
  };

  const usedPlayerIds = new Set([...homeActive, ...homeFielders, ...homeBench, ...awayActive, ...awayFielders, ...awayBench].map(p => p.id));

  const handleInitiateSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    setIsSearching(true);
    const cleanedName = formatName(newPlayerName);
    const nameParts = cleanedName.split(' ');
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];

    try {
      const res = await fetch(`/api/admin/players/search?lastName=${encodeURIComponent(lastName)}`);
      const matches = await res.json();
      const matchesArray = Array.isArray(matches) ? matches : [];
      if (matchesArray.length > 0) {
        setPotentialMatches(matchesArray);
        setShowDuplicateModal(true); 
      } else {
        executeCreatePlayer(cleanedName);
      }
    } catch (error) {
      executeCreatePlayer(formatName(newPlayerName));
    } finally {
      setIsSearching(false);
    }
  };

  const executeCreatePlayer = async (nameToCreate: string) => {
    setIsCreatingPlayer(true);
    setShowDuplicateModal(false);
    let targetLeagueId = urlLeagueId ? parseInt(urlLeagueId) : null;
    if (!targetLeagueId && game?.season?.leagueId) targetLeagueId = game.season.leagueId;
    if (!targetLeagueId && game?.homeTeam?.leagueId) targetLeagueId = game.homeTeam.leagueId;
    if (!targetLeagueId) return alert("Setup Error: Cannot determine League ID to register global player.");
    
    try {
      const res = await fetch('/api/admin/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameToCreate, leagueId: targetLeagueId })
      });
      if (res.ok) {
        const newPlayer = await res.json();
        await executeImportPlayer({...newPlayer, position: 'Fielder'}); 
      } else {
        alert((await res.json()).error || "Failed to create player.");
      }
    } catch (err) {
      alert("Network Error: Could not reach the server to create player.");
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
      } catch (e) { console.error("Failed to officially sign player", e); }
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

  const handlePlayBall = async () => {
    if (homeActive.length === 0 || awayActive.length === 0) return alert("Both teams need at least one batter in their active lineup!");
    if (!homePitcher || !awayPitcher) return alert("Please select a starting pitcher for both teams!");

    const finalHomeRoster = [
      ...homeActive.map((p, idx) => ({ ...p, battingOrder: idx + 1 })),
      ...homeFielders.map((p) => ({ ...p, battingOrder: 99 }))
    ].map(p => ({ ...p, teamId: game.homeTeamId, isPitcher: p.id === Number(homePitcher) }));

    const finalAwayRoster = [
      ...awayActive.map((p, idx) => ({ ...p, battingOrder: idx + 1 })),
      ...awayFielders.map((p) => ({ ...p, battingOrder: 99 }))
    ].map(p => ({ ...p, teamId: game.awayTeamId, isPitcher: p.id === Number(awayPitcher) }));

    try {
      const res = await fetch(`/api/admin/games/${gameId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeLineup: finalHomeRoster, awayLineup: finalAwayRoster }),
      });
      if (res.ok) router.push(`/games/${gameId}/live?source=admin`);
      else alert(`Failed to start game: ${(await res.json()).error || "Unknown Error"}`);
    } catch (error) {
      alert("Error starting game. Check console.");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#fdf0d5] flex items-center justify-center text-[#001d3d] font-black italic animate-pulse text-2xl md:text-4xl uppercase tracking-tighter px-4 text-center">Generating Lineup Cards...</div>;
  if (error || !game) return (
    <div className="min-h-screen bg-[#fdf0d5] flex flex-col items-center justify-center text-[#001d3d] p-6 sm:p-10 border-[8px] sm:border-[16px] border-[#001d3d]">
      <h1 className="text-3xl sm:text-5xl font-black uppercase italic text-[#c1121f] mb-4">Setup Error</h1>
      <p className="text-sm sm:text-xl font-bold bg-white border-2 sm:border-4 border-[#c1121f] p-4 mb-8 shadow-[4px_4px_0px_#001d3d]">{error || "Game object is null."}</p>
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <button onClick={() => window.location.reload()} className="w-full sm:w-auto bg-[#001d3d] text-white px-6 py-3 font-black uppercase italic border-4 border-[#001d3d] hover:bg-white hover:text-[#001d3d] shadow-[4px_4px_0px_#001d3d]">Retry Connection</button>
        <Link href={backUrl} className="w-full sm:w-auto text-center bg-white text-[#c1121f] px-6 py-3 font-black uppercase italic border-4 border-[#c1121f] hover:bg-[#c1121f] hover:text-white shadow-[4px_4px_0px_#001d3d]">Back to Command</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fdf0d5] text-[#001d3d] p-2 sm:p-4 md:p-8 border-[8px] sm:border-[16px] border-[#001d3d] relative">
      
      {/* DUPLICATE CHECK MODAL */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
          <div className="bg-[#001d3d] border-4 border-[#c1121f] p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-black italic uppercase text-white tracking-wide mb-2 text-center drop-shadow-[2px_2px_0px_#c1121f]">Wait! Match Found</h2>
            <p className="text-[10px] sm:text-xs font-bold uppercase text-[#669bbc] text-center tracking-widest mb-6">Similar names found in the Global Registry.</p>
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2">
              {potentialMatches.map(match => {
                const isAlreadyInGame = usedPlayerIds.has(match.id);
                return (
                  <div key={match.id} className="bg-[#003566] border-2 border-[#669bbc] p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 group">
                    <span className="font-bold text-base text-white">{formatName(match.name)}</span>
                    {isAlreadyInGame ? (
                      <span className="text-[9px] font-black uppercase tracking-widest bg-slate-600 text-white px-3 py-1 opacity-50 w-full sm:w-auto text-center">Already in Game</span>
                    ) : (
                      <button onClick={() => executeImportPlayer(match)} className="text-[9px] font-black uppercase tracking-widest bg-[#c1121f] text-white px-3 py-2 hover:bg-white hover:text-[#c1121f] w-full sm:w-auto">Import to Bench</button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="border-t-2 border-[#669bbc]/30 pt-4 flex flex-col sm:flex-row gap-3">
              <button onClick={() => executeCreatePlayer(formatName(newPlayerName))} className="flex-1 bg-transparent border-2 border-white/50 text-white/50 hover:text-white hover:border-white px-4 py-2 font-black uppercase text-[10px] tracking-widest transition-all">Create Brand New</button>
              <button onClick={() => setShowDuplicateModal(false)} className="flex-1 text-[#669bbc] hover:text-white px-4 py-2 font-black uppercase text-[10px] tracking-widest transition-all border-2 border-transparent">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PLAYER MODAL */}
      {addingForTeam && !showDuplicateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-white border-4 border-[#001d3d] p-6 sm:p-8 rounded-none w-full max-w-md shadow-[8px_8px_0px_#c1121f] flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start mb-6 border-b-4 border-[#001d3d]/10 pb-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black uppercase italic text-[#001d3d] drop-shadow-[2px_2px_0px_#ffd60a]">Sign Player</h2>
                <p className="text-[9px] sm:text-[10px] font-bold text-[#c1121f] uppercase mt-1">To {addingForTeam === 'home' ? game.homeTeam.name : game.awayTeam.name}</p>
              </div>
              <button onClick={resetModal} className="text-[#001d3d] font-black text-xl hover:text-[#c1121f]">X</button>
            </div>
            <form onSubmit={handleInitiateSearch} className="space-y-4">
              <input type="text" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Enter Player Name" className="w-full bg-[#fdf0d5] border-4 border-[#001d3d] p-3 text-[#001d3d] font-black text-sm uppercase outline-none focus:border-[#c1121f]" autoFocus />
              <button type="submit" disabled={isSearching || !newPlayerName.trim()} className="w-full bg-[#001d3d] text-white py-4 font-black italic uppercase shadow-[4px_4px_0px_#ffd60a] text-sm">{isSearching ? 'SCANNING...' : 'Search & Draft'}</button>
            </form>
          </div>
        </div>
      )}

      {/* MAIN UI */}
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 sm:mb-8 border-b-4 sm:border-b-8 border-[#c1121f] pb-4 flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div>
            <Link href={backUrl} className="text-[9px] sm:text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#c1121f] transition-colors block mb-2 sm:mb-4">
               ← Back to Gameday
            </Link>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black italic uppercase text-[#001d3d] tracking-tighter drop-shadow-[2px_2px_0px_#ffd60a] leading-none">Lineups</h1>
            <p className="text-[#c1121f] font-bold uppercase text-[9px] sm:text-xs mt-2 tracking-widest sm:tracking-[0.4em] italic">WIFF+ // Game: {gameId}</p>
          </div>
          <button onClick={handlePlayBall} className="bg-[#c1121f] text-white px-6 sm:px-10 py-3 sm:py-4 font-black italic uppercase tracking-widest text-lg border-4 border-[#001d3d] hover:bg-white hover:text-[#c1121f] transition-all shadow-[4px_4px_0px_#001d3d]">PLAY BALL</button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {['away', 'home'].map((side) => {
            const isHome = side === 'home';
            const team = isHome ? game.homeTeam : game.awayTeam;
            const active = isHome ? homeActive : awayActive;
            const fielders = isHome ? homeFielders : awayFielders;
            const bench = isHome ? homeBench : awayBench;
            const pitcher = isHome ? homePitcher : awayPitcher;
            const setPitcher = isHome ? setHomePitcher : setAwayPitcher;

            return (
              <div key={side} className="space-y-4 sm:space-y-6 bg-white border-2 sm:border-4 border-[#001d3d] p-3 sm:p-6 shadow-[6px_6px_0px_#c1121f] sm:shadow-[8px_8px_0px_#c1121f]">
                <div className="flex justify-between items-center bg-[#001d3d] text-white px-4 sm:px-6 py-3 sm:py-4 skew-x-[-10deg] shadow-[4px_4px_0px_#ffd60a]">
                  <h2 className="text-xl sm:text-2xl font-black italic uppercase skew-x-[10deg] tracking-tighter truncate max-w-[70%]">{team.name}</h2>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest skew-x-[10deg] text-[#ffd60a]">{isHome ? 'Home' : 'Visitor'}</span>
                </div>

                <div className="bg-[#fdf0d5] p-3 border-2 sm:border-4 border-[#001d3d] shadow-inner">
                  <label className="text-[9px] sm:text-[10px] font-black text-[#c1121f] uppercase tracking-widest block mb-1 sm:mb-2">Starting Pitcher</label>
                  <select className="w-full bg-white p-2 border-2 border-[#001d3d] font-black uppercase text-[#001d3d] text-xs sm:text-sm outline-none cursor-pointer" value={pitcher} onChange={(e) => setPitcher(e.target.value)}>
                    <option value="">-- SELECT PITCHER --</option>
                    {[...active, ...fielders].map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                {/* 1. BATTING ORDER */}
                <div className="bg-[#001d3d] border-2 sm:border-4 border-[#001d3d] p-2 sm:p-4 shadow-inner">
                  <h3 className="text-[9px] sm:text-[10px] font-black text-[#ffd60a] mb-2 sm:mb-4 uppercase tracking-widest border-b-2 border-white/10 pb-1 sm:pb-2">1. Batting Order</h3>
                  <div className="space-y-2">
                    {active.map((p, i) => {
                      const isSelected = selectedPlayer?.id === p.id && selectedPlayer?.list === 'Active';
                      return (
                        <div key={p.id} className={`bg-white p-2 flex flex-col border-2 ${isSelected ? 'border-[#ffd60a] bg-[#fffde7]' : 'border-[#001d3d]'} shadow-[2px_2px_0px_#c1121f] transition-colors`}>
                          
                          <div className="flex justify-between items-center w-full gap-2">
                            <div className="flex items-center gap-2 overflow-hidden w-full">
                              <div className="flex flex-col gap-0.5 shrink-0">
                                <button onClick={() => reorderLineup(side as 'home'|'away', i, 'up')} disabled={i === 0} className="bg-[#e0e1dd] hover:bg-[#669bbc] hover:text-white px-1.5 py-0.5 text-[8px] sm:text-[10px] font-black disabled:opacity-20 transition-colors leading-none">↑</button>
                                <button onClick={() => reorderLineup(side as 'home'|'away', i, 'down')} disabled={i === active.length - 1} className="bg-[#e0e1dd] hover:bg-[#669bbc] hover:text-white px-1.5 py-0.5 text-[8px] sm:text-[10px] font-black disabled:opacity-20 transition-colors leading-none">↓</button>
                              </div>
                              <span className="text-[#669bbc] font-black italic text-sm sm:text-lg w-5 text-center shrink-0">#{i + 1}</span>
                              <button 
                                onClick={() => setSelectedPlayer(isSelected ? null : { id: p.id, side: side as 'home' | 'away', list: 'Active' })}
                                className="font-black uppercase text-xs sm:text-sm text-[#001d3d] truncate hover:text-[#c1121f] text-left w-full"
                              >
                                {p.name}
                              </button>
                            </div>
                            
                            {!isSelected && (
                              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 shrink-0">
                                <div className="flex items-center gap-1">
                                  <select 
                                    value={String(p.id) === pitcher ? 'Pitcher' : (p.position === 'Pitcher' ? 'Fielder' : (p.position || 'Fielder'))} 
                                    disabled={String(p.id) === pitcher} 
                                    onChange={(e) => handlePositionChange(side as 'home' | 'away', p.id, e.target.value)} 
                                    className="bg-[#fdf0d5] text-[#001d3d] p-1 border border-[#001d3d] text-[8px] sm:text-[9px] font-black uppercase outline-none cursor-pointer"
                                  >
                                    {String(p.id) === pitcher && <option value="Pitcher">Pitcher</option>}
                                    <option value="Fielder">Fielder</option>
                                    <option value="DH">DH</option>
                                    <option value="EH">EH</option>
                                  </select>
                                  {String(p.id) === pitcher && <span className="bg-[#c1121f] text-white text-[8px] font-black px-1.5 py-1 uppercase hidden sm:inline-block">P</span>}
                                </div>
                                {p.position === 'DH' && fielders.length > 0 && (
                                   <select 
                                     value={p.dhForId || ''} 
                                     onChange={(e) => handleDhForChange(side as 'home' | 'away', p.id, e.target.value)}
                                     className="bg-black text-[#ffd60a] p-1 border border-[#ffd60a] text-[8px] sm:text-[9px] font-black uppercase outline-none cursor-pointer max-w-[80px] sm:max-w-none truncate"
                                   >
                                     <option value="">Hit For...</option>
                                     {fielders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                   </select>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Inline Mobile Actions */}
                          {isSelected && (
                            <div className="flex gap-2 mt-2 pt-2 border-t-2 border-slate-200">
                               <button onClick={() => movePlayer(p, side as 'home'|'away', 'Active', 'Bench')} className="flex-1 bg-[#c1121f] text-white text-[9px] sm:text-[10px] font-black py-1.5 uppercase shadow-[2px_2px_0px_#000] hover:bg-[#ffd60a] hover:text-[#001d3d]">Send to Bench</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. FIELDERS/PITCHERS ONLY */}
                <div className="bg-[#e0e1dd] border-2 sm:border-4 border-dashed border-[#001d3d] p-2 sm:p-4 shadow-inner">
                  <h3 className="text-[9px] sm:text-[10px] font-black text-[#001d3d] mb-2 sm:mb-4 uppercase tracking-widest border-b-2 border-[#001d3d]/10 pb-1 sm:pb-2">2. Fielders & Pitchers Only</h3>
                  <div className="space-y-2">
                    {fielders.map((p) => {
                      const isSelected = selectedPlayer?.id === p.id && selectedPlayer?.list === 'Fielders';
                      return (
                        <div key={p.id} className={`bg-white p-2 flex flex-col border-2 ${isSelected ? 'border-[#c1121f] bg-[#fff0f0]' : 'border-[#001d3d]'} shadow-[2px_2px_0px_#001d3d] transition-colors`}>
                          <div className="flex justify-between items-center w-full gap-2">
                            <button 
                              onClick={() => setSelectedPlayer(isSelected ? null : { id: p.id, side: side as 'home' | 'away', list: 'Fielders' })}
                              className="font-black uppercase text-xs sm:text-sm text-[#001d3d] truncate hover:text-[#669bbc] text-left w-full"
                            >
                              {p.name}
                            </button>
                            
                            {!isSelected && (
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="bg-slate-200 text-[#001d3d] px-1.5 py-0.5 border border-slate-300 text-[8px] sm:text-[9px] font-black uppercase">
                                  {String(p.id) === pitcher ? 'Pitcher' : 'Fielder'}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Inline Mobile Actions */}
                          {isSelected && (
                            <div className="flex gap-2 mt-2 pt-2 border-t-2 border-slate-200">
                              <button onClick={() => movePlayer(p, side as 'home'|'away', 'Fielders', 'Bench')} className="flex-1 bg-[#c1121f] text-white text-[9px] sm:text-[10px] font-black py-1.5 uppercase shadow-[2px_2px_0px_#000] hover:bg-[#ffd60a] hover:text-[#001d3d]">Send to Bench</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. AVAILABLE BENCH */}
                <div className="bg-white border-2 sm:border-4 border-dashed border-[#669bbc] p-3 sm:p-6 flex flex-col">
                  <h3 className="text-[9px] sm:text-[10px] font-black text-[#669bbc] mb-3 uppercase tracking-widest">3. Available Bench</h3>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 flex-1">
                    {bench.map(p => {
                      const isSelected = selectedPlayer?.id === p.id && selectedPlayer?.list === 'Bench';
                      return (
                        <div key={p.id} className="flex flex-col w-full sm:w-auto">
                          <button 
                            onClick={() => setSelectedPlayer(isSelected ? null : { id: p.id, side: side as 'home' | 'away', list: 'Bench' })}
                            className={`px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase transition-colors shadow-sm border-2 text-left sm:text-center ${isSelected ? 'bg-[#ffd60a] border-[#001d3d] text-[#001d3d]' : 'bg-white border-[#669bbc] text-[#001d3d] hover:bg-[#669bbc] hover:text-white'}`}
                          >
                            {p.name}
                          </button>
                          
                          {/* Inline Mobile Actions for Bench */}
                          {isSelected && (
                            <div className="flex flex-row sm:flex-col gap-1 mt-1 w-full">
                              <button onClick={() => movePlayer(p, side as 'home'|'away', 'Bench', 'Active')} className="flex-1 text-[8px] sm:text-[9px] font-black uppercase bg-[#ffd60a] text-[#001d3d] py-1.5 border border-[#001d3d] shadow-[1px_1px_0px_#000]">To Order</button>
                              <button onClick={() => movePlayer(p, side as 'home'|'away', 'Bench', 'Fielders')} className="flex-1 text-[8px] sm:text-[9px] font-black uppercase bg-[#669bbc] text-white py-1.5 border border-[#001d3d] shadow-[1px_1px_0px_#000]">To Field</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={() => setAddingForTeam(side as 'home' | 'away')} className="w-full mt-4 sm:mt-6 bg-white border-2 sm:border-4 border-[#001d3d] text-[#001d3d] py-2 sm:py-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-[#001d3d] hover:text-white transition-all shadow-[2px_2px_0px_#c1121f] sm:shadow-[4px_4px_0px_#c1121f]">+ Draft Player</button>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}