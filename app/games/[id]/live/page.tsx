'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function LiveScorer() {
  const { id } = useParams();
  const router = useRouter();
  
  const [game, setGame] = useState<any>(null);
  const [currentBatterIdx, setCurrentBatterIdx] = useState(0); 
  const [isTopInning, setIsTopInning] = useState(true); 
  const [inning, setInning] = useState(1);
  const [outs, setOuts] = useState(0);
  const [balls, setBalls] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [baseRunners, setBaseRunners] = useState<(any | null)[]>([null, null, null]); 
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [homePitches, setHomePitches] = useState(0);
  const [awayPitches, setAwayPitches] = useState(0);
  const [playLog, setPlayLog] = useState<any[]>([]); 
  const [redoStack, setRedoStack] = useState<any[]>([]);

  // Modal States
  const [showDPModal, setShowDPModal] = useState(false);
  const [dpStep, setDpStep] = useState(1); 
  const [batterWasOut, setBatterWasOut] = useState(true);
  const [dpPlacements, setDpPlacements] = useState<any[]>([]);
  const [showJackassError, setShowJackassError] = useState(false);
  const [jackassMessage, setJackassMessage] = useState("");
  const [showOtherModal, setShowOtherModal] = useState(false);
  const [showGhostModal, setShowGhostModal] = useState(false);
  
  // Unified Placement State (Errors, Tags, Manual Hits)
  const [placementAction, setPlacementAction] = useState<string | null>(null);
  const [placementDetails, setPlacementDetails] = useState<any[]>([]);

  // Hit with Error State
  const [hitErrorData, setHitErrorData] = useState<any>(null);
  
  // Game Over States
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/games/${id}/setup`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then(data => setGame(data))
      .catch(err => console.error("Error loading game:", err));
  }, [id]);

  const clearRedo = () => { if (redoStack.length > 0) setRedoStack([]); };

  const triggerJackass = (msg: string) => {
    setJackassMessage(msg);
    setShowJackassError(true);
  };

  const toggleInning = useCallback(() => {
    if (!game) return;
    const rules = game.season;
    const targetInnings = rules?.inningsPerGame || 5;

    // --- GAME OVER CHECKS (End of Inning) ---
    if (isTopInning && inning >= targetInnings && homeScore > awayScore) {
        setGameOverMessage("GAME OVER! Home Team Wins!");
        setShowEndGameModal(true);
        return; 
    }
    if (!isTopInning && inning >= targetInnings && homeScore !== awayScore) {
        setGameOverMessage(`GAME OVER! ${homeScore > awayScore ? 'Home' : 'Away'} Team Wins!`);
        setShowEndGameModal(true);
        return; 
    }

    const breakLabel = isTopInning ? `Mid ${inning}` : `End ${inning}`;
    const nextIsTop = !isTopInning;
    const nextInning = nextIsTop ? inning + 1 : inning;
    
   // --- AUTO GHOST RUNNER LOGIC ---
let nextBases: (any | null)[] = [null, null, null]; // <-- Just add the type here
if (rules?.ghostRunner && nextInning > targetInnings) {
   nextBases[1] = { id: `ghost-${Date.now()}`, name: 'Ghost Runner' };
}

    setPlayLog(prev => [{ 
      type: 'divider', 
      label: breakLabel, 
      prevBaseRunners: [...baseRunners], 
      prevOuts: outs, prevBalls: balls, prevStrikes: strikes,
      prevBatterIdx: currentBatterIdx 
    }, ...prev]);
    
    setIsTopInning(nextIsTop);
    setOuts(0); 
    setBaseRunners(nextBases); 
    setBalls(0); 
    setStrikes(0);
    if (!isTopInning) setInning(prev => prev + 1);
  }, [game, isTopInning, inning, baseRunners, outs, balls, strikes, currentBatterIdx, homeScore, awayScore]);

  const recordPlay = useCallback((result: string, newBases: (any|null)[], runs: number, extraOuts: number = 0) => {
    clearRedo();
    if (!game) return;
    
    const targetOuts = game.season?.outs || 3;
    const targetInnings = game.season?.inningsPerGame || 5;
    const battingTeamId = isTopInning ? game.awayTeamId : game.homeTeamId;
    const lineup = game.lineups.filter((l: any) => l.teamId === battingTeamId);
    const batter = lineup[currentBatterIdx]?.player;

    const newHomeScore = isTopInning ? homeScore : homeScore + runs;
    const newAwayScore = isTopInning ? awayScore + runs : awayScore;

    if (isTopInning) setAwayScore(newAwayScore); else setHomeScore(newHomeScore);

    const totalOuts = outs + extraOuts;

    setPlayLog(prev => [{
      type: 'play', batter: batter?.name || 'Unknown', result, runs,
      inning: `${isTopInning ? 'TOP' : 'BOT'} ${inning}`,
      prevBaseRunners: [...baseRunners], prevOuts: outs, prevBalls: balls, prevStrikes: strikes,
      prevBatterIdx: currentBatterIdx
    }, ...prev]);

    // --- WALK-OFF CHECK ---
    if (!isTopInning && inning >= targetInnings && newHomeScore > newAwayScore) {
       setBaseRunners(newBases);
       setGameOverMessage("WALK-OFF WIN!");
       setShowEndGameModal(true);
       return; 
    }

    if (totalOuts >= targetOuts) toggleInning();
    else {
      setBaseRunners(newBases); setOuts(totalOuts); setBalls(0); setStrikes(0);
      setCurrentBatterIdx((prev) => (prev + 1) % lineup.length);
    }
  }, [game, isTopInning, currentBatterIdx, outs, inning, baseRunners, balls, strikes, toggleInning, homeScore, awayScore]);

  const advanceRunnersAuto = useCallback((basesToMove: number, type: string) => {
    if (!game) return;
    const battingTeamId = isTopInning ? game.awayTeamId : game.homeTeamId;
    const lineup = game.lineups.filter((l: any) => l.teamId === battingTeamId);
    const batter = lineup[currentBatterIdx]?.player;
    let currentBases = [...baseRunners];
    let runs = 0;
    if (type === 'HR') { runs = 1 + currentBases.filter(b => b !== null).length; currentBases = [null, null, null]; }
    else { for (let i = 0; i < basesToMove; i++) { if (currentBases[2]) runs++; currentBases[2] = currentBases[1]; currentBases[1] = currentBases[0]; currentBases[0] = i === 0 ? batter : null; } }
    recordPlay(type, currentBases, runs);
  }, [game, isTopInning, currentBatterIdx, baseRunners, recordPlay]);

  const validatePlacements = (placements: any[]) => {
    const counts: any = { '1st': 0, '2nd': 0, '3rd': 0 };
    for (const p of placements) { if (counts[p.end] !== undefined) counts[p.end]++; }
    const dupes = Object.keys(counts).filter(k => counts[k] > 1);
    if (dupes.length > 0) { alert(`Multiple runners on ${dupes.join(' & ')}!`); return false; }
    return true;
  };

  const handleDPAction = () => {
    const rules = game?.season;
    const targetOuts = rules?.outs || 3;

    if (outs >= targetOuts - 1) { triggerJackass(`Can't get ${targetOuts + 1} outs jackass.`); return; }
    
    const runnersOn = baseRunners.filter(b => b !== null);
    
    if (runnersOn.length === 0 && !rules?.dpWithoutRunners) return alert("No runners on base!");
    if (runnersOn.length === 0 && rules?.dpWithoutRunners) { recordPlay('Double Play', [null, null, null], 0, 2); return; }
    if (rules?.dpKeepsRunners) { recordPlay('Double Play', [...baseRunners], 0, 2); return; }

    if (runnersOn.length === 1) { recordPlay('Double Play', [null, null, null], 0, 2); return; }

    setDpStep(1);
    const active = [];
    if (baseRunners[2]) active.push({ player: baseRunners[2], from: '3rd', end: '3rd', internalId: 'b2' });
    if (baseRunners[1]) active.push({ player: baseRunners[1], from: '2nd', end: '2nd', internalId: 'b1' });
    if (baseRunners[0]) active.push({ player: baseRunners[0], from: '1st', end: '1st', internalId: 'b0' });
    const batter = game.lineups.filter((l: any) => l.teamId === (isTopInning ? game.awayTeamId : game.homeTeamId))[currentBatterIdx].player;
    setDpPlacements([...active, { player: batter, from: 'Batter', end: 'Out', internalId: 'bat' }]);
    setShowDPModal(true);
  };

  const handleDPBatterStatus = (isOut: boolean) => {
    setBatterWasOut(isOut);
    const count = baseRunners.filter(b => b !== null).length;
    if (!isOut && count === 2) {
      setDpPlacements(dpPlacements.map(p => p.internalId === 'bat' ? { ...p, end: '1st' } : { ...p, end: 'Out' }));
      setDpStep(3);
    } else {
      setDpPlacements(dpPlacements.map(p => p.internalId === 'bat' ? { ...p, end: isOut ? 'Out' : '1st' } : { ...p, end: p.from }));
      setDpStep(2);
    }
  };

  // UNIFIED PLACEMENT ENGINE
  const startPlacementFlow = (actionType: string) => {
    const runnersOn = baseRunners.filter(b => b !== null);
    if (actionType === 'Tag' && runnersOn.length === 0) {
      triggerJackass("Can't tag somebody who ain't there cheater");
      return;
    }

    const active = [];
    if (baseRunners[2]) active.push({ player: baseRunners[2], from: '3rd', end: '3rd', internalId: 'b2' });
    if (baseRunners[1]) active.push({ player: baseRunners[1], from: '2nd', end: '2nd', internalId: 'b1' });
    if (baseRunners[0]) active.push({ player: baseRunners[0], from: '1st', end: '1st', internalId: 'b0' });
    
    const batter = game.lineups.filter((l: any) => l.teamId === (isTopInning ? game.awayTeamId : game.homeTeamId))[currentBatterIdx].player;

    if (actionType === 'Error') {
      setPlacementDetails([...active, { player: batter, from: 'Batter', end: '1st', internalId: 'bat' }]);
    } else if (['Single', 'Double', 'Triple', 'Clean Single', 'Clean Double'].includes(actionType)) {
      let defaultEnd = '1st';
      if (actionType.includes('Double')) defaultEnd = '2nd';
      if (actionType.includes('Triple')) defaultEnd = '3rd';
      setPlacementDetails([...active, { player: batter, from: 'Batter', end: defaultEnd, internalId: 'bat' }]);
    } else {
      // Tag Up
      setPlacementDetails(active);
    }
    
    setPlacementAction(actionType);
  };

  const handleHit = (bases: number, isClean: boolean) => {
    if (!game) return;
    let current = [...baseRunners];
    let runs = 0;
    const batter = game.lineups.filter((l: any) => l.teamId === (isTopInning ? game.awayTeamId : game.homeTeamId))[currentBatterIdx].player;
    
    const runnerAdvancement = isClean ? bases + 1 : bases;

    for (let i = 0; i < runnerAdvancement; i++) {
        if (current[2]) runs++;
        current[2] = current[1];
        current[1] = current[0];
        current[0] = null;
    }
    
    current[bases - 1] = batter;
    recordPlay(isClean ? `Clean ${bases}B` : `${bases}B`, current, runs);
  };

  const handleOtherAction = (actionType: string) => {
    setShowOtherModal(false);

    switch (actionType) {
      case 'Sac Fly':
        startPlacementFlow('Tag');
        break;
      case 'Fielder\'s Choice':
        startPlacementFlow('Error');
        break;
      case 'Ground Rule Double':
        advanceRunnersAuto(2, 'GR Double');
        break;
      case 'Clean Single':
        if (game.season?.isBaserunning && baseRunners.some(b => b !== null)) startPlacementFlow('Clean Single');
        else handleHit(1, true);
        break;
      case 'Clean Double':
        if (game.season?.isBaserunning && baseRunners.some(b => b !== null)) startPlacementFlow('Clean Double');
        else handleHit(2, true);
        break;
      case 'Hit with Error':
        const active = [];
        if (baseRunners[2]) active.push({ player: baseRunners[2], from: '3rd', end: '3rd', internalId: 'b2' });
        if (baseRunners[1]) active.push({ player: baseRunners[1], from: '2nd', end: '2nd', internalId: 'b1' });
        if (baseRunners[0]) active.push({ player: baseRunners[0], from: '1st', end: '1st', internalId: 'b0' });
        
        const batter = game.lineups.filter((l: any) => l.teamId === (isTopInning ? game.awayTeamId : game.homeTeamId))[currentBatterIdx].player;
        setHitErrorData({
          hitType: 'Single',
          fielderId: '',
          placements: [...active, { player: batter, from: 'Batter', end: '2nd', internalId: 'bat' }] // default to 2nd for an error
        });
        break;
      case 'Add Ghost Runner':
        setShowGhostModal(true); 
        break;
    }
  };

  const placeGhostRunner = (baseIndex: number) => {
    clearRedo();
    let gBases = [...baseRunners];
    gBases[baseIndex] = { id: `ghost-${baseIndex}-${Date.now()}`, name: 'Ghost Runner' };
    
    setPlayLog(prev => [{
      type: 'ghost', batter: 'System', result: `Add Ghost Runner (${baseIndex === 0 ? '1st' : baseIndex === 1 ? '2nd' : '3rd'})`, runs: 0,
      inning: `${isTopInning ? 'TOP' : 'BOT'} ${inning}`,
      prevBaseRunners: [...baseRunners], prevOuts: outs, prevBalls: balls, prevStrikes: strikes,
      prevBatterIdx: currentBatterIdx
    }, ...prev]);

    setBaseRunners(gBases);
    setShowGhostModal(false);
  };

  const handleAction = (type: string) => {
    if (!game) return;
    const targetBalls = game.season?.balls || 4;
    const targetStrikes = game.season?.strikes || 3;

    // --- MANUAL BASERUNNER HIT INTERCEPTOR ---
    if (['Single', 'Double', 'Triple'].includes(type)) {
      if (game.season?.isBaserunning && baseRunners.some(b => b !== null)) {
        startPlacementFlow(type);
      } else {
        let bases = 1;
        if (type === 'Double') bases = 2;
        if (type === 'Triple') bases = 3;
        advanceRunnersAuto(bases, type);
      }
      return;
    }

    if (type === 'Ball' || type === 'Strike') {
      clearRedo();
      setPlayLog(prev => [{ 
        type: 'pitch', result: type, 
        prevBalls: balls, prevStrikes: strikes, 
        prevBaseRunners: [...baseRunners], prevOuts: outs 
      }, ...prev]);

      if (isTopInning) setHomePitches(p => p + 1); else setAwayPitches(p => p + 1);

      if (type === 'Ball') {
        if (balls >= targetBalls - 1) {
          let current = [...baseRunners]; let runs = 0;
          const batter = game.lineups.filter((l: any) => l.teamId === (isTopInning ? game.awayTeamId : game.homeTeamId))[currentBatterIdx].player;
          if (current[2] && current[1] && current[0]) runs++;
          if (current[1] && current[0]) current[2] = current[1];
          if (current[0]) current[1] = current[0];
          current[0] = batter;
          recordPlay('Walk', current, runs);
        } else setBalls(b => b + 1);
      } else {
        if (strikes >= targetStrikes - 1) recordPlay('K', [...baseRunners], 0, 1);
        else setStrikes(s => s + 1);
      }
      return;
    }
    if (type === 'K') { recordPlay('K', [...baseRunners], 0, 1); return; }
    if (type === 'BB') {
      let current = [...baseRunners]; let runs = 0;
      const batter = game.lineups.filter((l: any) => l.teamId === (isTopInning ? game.awayTeamId : game.homeTeamId))[currentBatterIdx].player;
      if (current[2] && current[1] && current[0]) runs++;
      if (current[1] && current[0]) current[2] = current[1];
      if (current[0]) current[1] = current[0];
      current[0] = batter;
      recordPlay('Walk', current, runs);
      return;
    }
    if (type === 'HR') advanceRunnersAuto(4, 'HR');
    if (['Fly Out', 'Ground Out'].includes(type)) recordPlay(type, [...baseRunners], 0, 1);
  };

  const undoLastPlay = () => {
    if (playLog.length === 0) return;
    const last = playLog[0];
    const snapshot = { 
        type: last.type, batterIdx: currentBatterIdx, isTopInning, inning, outs, balls, strikes, 
        baseRunners: [...baseRunners], homeScore, awayScore, homePitches, awayPitches, logEntry: last 
    };
    setRedoStack(prev => [snapshot, ...prev]);

    setBaseRunners(last.prevBaseRunners);
    setOuts(last.prevOuts);
    setBalls(last.prevBalls);
    setStrikes(last.prevStrikes);

    if (last.type === 'play') {
      if (isTopInning) setAwayScore(p => p - last.runs); else setHomeScore(p => p - last.runs);
      setCurrentBatterIdx(last.prevBatterIdx);
    }
    if (last.type === 'pitch' || last.type === 'play') {
        if (isTopInning) setHomePitches(p => Math.max(0, p-1)); else setAwayPitches(p => Math.max(0, p-1));
    }
    if (last.type === 'divider') {
      setIsTopInning(!isTopInning);
      if (isTopInning) setInning(i => i-1);
      setCurrentBatterIdx(last.prevBatterIdx);
    }
    setPlayLog(prev => prev.slice(1));
  };

  const redoLastPlay = () => {
    if (redoStack.length === 0) return;
    const n = redoStack[0];
    setCurrentBatterIdx(n.batterIdx); setIsTopInning(n.isTopInning); setInning(n.inning);
    setOuts(n.outs); setBalls(n.balls); setStrikes(n.strikes); setBaseRunners(n.baseRunners);
    setHomeScore(n.homeScore); setAwayScore(n.awayScore); setHomePitches(n.homePitches); setAwayPitches(n.awayPitches);
    setPlayLog(prev => [n.logEntry, ...prev]);
    setRedoStack(prev => prev.slice(1));
  };

  const finalizeGame = async () => {
    try {
      await fetch(`/api/admin/games/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeTeamId: game.homeTeamId,
          awayTeamId: game.awayTeamId,
          scheduledAt: game.scheduledAt,
          status: 'COMPLETED'
        })
      });
      router.push(`/admin/leagues/${game.season.leagueId}`);
    } catch (error) {
      console.error("Error ending game:", error);
      alert("Failed to mark game as completed.");
    }
  };

  if (!game) return <div className="bg-slate-950 min-h-screen flex items-center justify-center font-black italic text-white animate-pulse">WARMING UP...</div>;

  const currentBatter = game.lineups.filter((l: any) => l.teamId === (isTopInning ? game.awayTeamId : game.homeTeamId))[currentBatterIdx]?.player;
  const activePitcherId = isTopInning ? game.currentHomePitcherId : game.currentAwayPitcherId;
  const currentPitcher = game.lineups.find((l: any) => l.playerId === activePitcherId)?.player;
  const runnersMarkedOut = dpPlacements.filter(p => p.internalId !== 'bat' && p.end === 'Out').length;
  const isDPValid = batterWasOut ? runnersMarkedOut === 1 : runnersMarkedOut === 2;

  const targetBalls = game.season?.balls || 4;
  const targetStrikes = game.season?.strikes || 3;
  const targetOuts = game.season?.outs || 3;

  // Derive the fielding team's active lineup for the Error selection
  const fieldingTeamId = isTopInning ? game.homeTeamId : game.awayTeamId;
  const fieldingLineup = game.lineups.filter((l: any) => l.teamId === fieldingTeamId);

  return (
    <div className="p-4 max-w-2xl mx-auto bg-slate-950 min-h-screen text-white font-sans relative pb-24">
      
      {/* END GAME CONFIRMATION MODAL */}
      {showEndGameModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/95 backdrop-blur-md p-6 text-center">
          <div className="bg-[#002D62] p-8 rounded-3xl border-4 border-[#c1121f] max-w-sm w-full shadow-2xl">
            <h2 className="text-3xl font-black uppercase italic mb-2 text-white">{gameOverMessage || "End Game?"}</h2>
            <div className="bg-[#001d3d] p-4 my-6 border border-white/20">
               <p className="font-bold text-slate-400 text-xs uppercase tracking-widest mb-2">Final Score</p>
               <div className="flex justify-between items-center px-4">
                  <span className="font-black text-2xl truncate">{game.awayTeam.name.substring(0, 3)} <span className="text-white ml-2">{awayScore}</span></span>
                  <span className="text-slate-600 font-black">|</span>
                  <span className="font-black text-2xl truncate"><span className="text-white mr-2">{homeScore}</span> {game.homeTeam.name.substring(0, 3)}</span>
               </div>
            </div>
            <div className="space-y-3">
               <button onClick={finalizeGame} className="w-full bg-[#c1121f] text-white p-4 rounded-xl font-black uppercase tracking-widest hover:bg-white hover:text-[#c1121f] transition-all">Confirm & Finalize</button>
               <button onClick={() => setShowEndGameModal(false)} className="w-full bg-transparent border border-white/20 text-white/50 p-4 rounded-xl font-black uppercase tracking-widest hover:text-white transition-all">Keep Playing</button>
            </div>
          </div>
        </div>
      )}

      {/* DOUBLE PLAY MODAL */}
      {showDPModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/95 p-4">
          <div className="bg-[#002D62] border-2 border-red-600 p-6 rounded-3xl w-full max-w-md flex flex-col max-h-[90vh]">
            {dpStep === 1 ? (
              <div className="text-center py-4">
                <h2 className="text-xl font-black uppercase italic mb-6">Was the Batter Out?</h2>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => handleDPBatterStatus(true)} className="bg-red-600 p-6 rounded-2xl font-black text-xl">Yes</button>
                  <button onClick={() => handleDPBatterStatus(false)} className="bg-slate-700 p-6 rounded-2xl font-black text-xl">No</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col flex-1 overflow-hidden">
                <h2 className="text-xl font-black uppercase text-center mb-2 text-red-500">DP Placement</h2>
                <div className="space-y-3 mb-6 overflow-y-auto flex-1 pr-2">
                  {dpPlacements.filter(p => dpStep === 3 ? p.internalId === 'bat' : p.internalId !== 'bat').map((rp) => (
                    <div key={rp.internalId} className="bg-white/5 p-3 rounded-xl border border-white/10 shrink-0">
                      <div className="flex justify-between text-[10px] font-black uppercase text-blue-400 mb-2"><span>From: {rp.from}</span><span>{rp.player.name}</span></div>
                      <div className="grid grid-cols-5 gap-1">
                        {['Out', '1st', '2nd', '3rd', 'Home'].map(base => (
                          <button key={base} onClick={() => setDpPlacements(dpPlacements.map(p => p.internalId === rp.internalId ? {...p, end: base} : p))} className={`py-2 rounded font-black text-[8px] uppercase border ${rp.end === base ? 'bg-red-600 border-white' : 'border-white/10 text-slate-500'}`}>{base}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => {
                  if (!validatePlacements(dpPlacements)) return;
                  let nB = [null, null, null] as (any|null)[]; let r = 0;
                  dpPlacements.forEach(rp => { if (rp.end === '1st') nB[0] = rp.player; else if (rp.end === '2nd') nB[1] = rp.player; else if (rp.end === '3rd') nB[2] = rp.player; else if (rp.end === 'Home') r++; });
                  recordPlay('Double Play', nB, r, 2); setShowDPModal(false);
                }} disabled={!isDPValid && dpStep !== 3} className={`w-full p-4 rounded-xl font-black uppercase tracking-widest ${isDPValid || dpStep === 3 ? 'bg-red-600 shadow-lg' : 'bg-slate-800 opacity-20'}`}>Confirm DP</button>
              </div>
            )}
            <button onClick={() => setShowDPModal(false)} className="w-full mt-4 text-[10px] font-black text-white/30 uppercase shrink-0">Cancel</button>
          </div>
        </div>
      )}

      {/* UNIFIED PLACEMENT MODAL */}
      {placementAction && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/95 p-4">
          <div className={`bg-[#002D62] border-2 ${placementAction === 'Error' ? 'border-yellow-600' : placementAction === 'Tag' ? 'border-orange-600' : 'border-green-500'} p-6 rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]`}>
            <div className="flex flex-col flex-1 overflow-hidden">
              <h2 className="text-xl font-black uppercase italic mb-2 text-center text-white">{placementAction} Placement</h2>
              <div className="space-y-3 mb-6 overflow-y-auto flex-1 pr-2">
                {placementDetails.map((rp) => (
                  <div key={rp.internalId} className="bg-white/5 p-3 rounded-xl border border-white/10 shrink-0">
                    <div className="flex justify-between text-[10px] font-black uppercase text-blue-400 mb-2"><span>From: {rp.from}</span><span>{rp.player.name}</span></div>
                    <div className="grid grid-cols-5 gap-1">
                      {['Out', '1st', '2nd', '3rd', 'Home'].map(base => (
                        <button 
                          key={base} 
                          onClick={() => setPlacementDetails(placementDetails.map(p => p.internalId === rp.internalId ? {...p, end: base} : p))} 
                          className={`py-2 rounded font-black text-[8px] uppercase border ${rp.end === base ? (placementAction === 'Error' ? 'bg-yellow-600' : placementAction === 'Tag' ? 'bg-orange-600' : 'bg-green-500') + ' border-white' : 'border-white/10 text-slate-500'}`}
                        >
                          {base}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => {
                if (!validatePlacements(placementDetails)) return;
                let nB = [null, null, null] as (any|null)[]; let r = 0; let oX = placementAction === 'Tag' ? 1 : 0; 
                placementDetails.forEach(rp => { if (rp.end === '1st') nB[0] = rp.player; else if (rp.end === '2nd') nB[1] = rp.player; else if (rp.end === '3rd') nB[2] = rp.player; else if (rp.end === 'Home') r++; else if (rp.end === 'Out') oX++; });
                recordPlay(placementAction === 'Tag' ? 'Tag Up' : placementAction, nB, r, oX); 
                setPlacementAction(null);
              }} className={`w-full p-4 rounded-xl font-black uppercase tracking-widest shadow-lg ${placementAction === 'Error' ? 'bg-yellow-600' : placementAction === 'Tag' ? 'bg-orange-600' : 'bg-green-500'}`}>
                Confirm Play
              </button>
            </div>
            <button onClick={() => setPlacementAction(null)} className="w-full mt-4 py-2 text-white/30 font-black uppercase text-[10px]">Cancel</button>
          </div>
        </div>
      )}

      {/* HIT WITH ERROR MODAL */}
      {hitErrorData && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/95 p-4 overflow-y-auto">
          <div className="bg-[#002D62] border-2 border-pink-500 p-6 rounded-3xl w-full max-w-md shadow-2xl flex flex-col my-auto max-h-[95vh]">
             <h2 className="text-xl font-black uppercase italic mb-4 text-center text-pink-400">Hit + Error</h2>
             
             {/* Hit Type Selection */}
             <div className="mb-4">
                <label className="text-[10px] font-black uppercase text-pink-300 tracking-widest block mb-2">Credited Hit</label>
                <div className="grid grid-cols-3 gap-2">
                   {['Single', 'Double', 'Triple'].map(ht => (
                      <button 
                         key={ht}
                         onClick={() => setHitErrorData({...hitErrorData, hitType: ht})}
                         className={`py-2 rounded-xl font-black text-xs uppercase border ${hitErrorData.hitType === ht ? 'bg-pink-600 border-white text-white shadow-inner' : 'border-white/20 text-slate-400'}`}
                      >
                         {ht}
                      </button>
                   ))}
                </div>
             </div>

             {/* Fielder Selection */}
             <div className="mb-4">
                <label className="text-[10px] font-black uppercase text-pink-300 tracking-widest block mb-2">Error Committed By</label>
                <select 
                   value={hitErrorData.fielderId}
                   onChange={(e) => setHitErrorData({...hitErrorData, fielderId: e.target.value})}
                   className="w-full bg-[#001d3d] border border-pink-500/50 p-3 text-white font-bold uppercase outline-none focus:border-pink-500"
                >
                   <option value="">-- Select Fielder --</option>
                   {fieldingLineup.map((l: any) => (
                      <option key={l.player.id} value={l.player.id}>{l.player.name}</option>
                   ))}
                </select>
             </div>

             {/* Placements */}
             <div className="space-y-2 mb-6 flex-1 overflow-y-auto pr-1">
                <label className="text-[10px] font-black uppercase text-pink-300 tracking-widest block mt-2">Final Placements</label>
                {hitErrorData.placements.map((rp: any) => (
                   <div key={rp.internalId} className="bg-white/5 p-2 rounded-xl border border-white/10 shrink-0">
                     <div className="flex justify-between text-[10px] font-black uppercase text-pink-200 mb-2"><span>From: {rp.from}</span><span>{rp.player.name}</span></div>
                     <div className="grid grid-cols-5 gap-1">
                       {['Out', '1st', '2nd', '3rd', 'Home'].map(base => (
                         <button 
                           key={base} 
                           onClick={() => setHitErrorData({...hitErrorData, placements: hitErrorData.placements.map((p: any) => p.internalId === rp.internalId ? {...p, end: base} : p)})} 
                           className={`py-2 rounded font-black text-[8px] uppercase border ${rp.end === base ? 'bg-pink-600 border-white text-white' : 'border-white/10 text-slate-500 hover:border-pink-500/50'}`}
                         >
                           {base}
                         </button>
                       ))}
                     </div>
                   </div>
                ))}
             </div>

             <button onClick={() => {
                if (!hitErrorData.fielderId) return triggerJackass("Select the fielder who made the error.");
                if (!validatePlacements(hitErrorData.placements)) return;
                
                let nB = [null, null, null] as (any|null)[]; let r = 0; let oX = 0; 
                hitErrorData.placements.forEach((rp: any) => { 
                   if (rp.end === '1st') nB[0] = rp.player; 
                   else if (rp.end === '2nd') nB[1] = rp.player; 
                   else if (rp.end === '3rd') nB[2] = rp.player; 
                   else if (rp.end === 'Home') r++; 
                   else if (rp.end === 'Out') oX++; 
                });
                
                const fielderName = fieldingLineup.find((l: any) => String(l.player.id) === String(hitErrorData.fielderId))?.player.name;
                const resultString = `${hitErrorData.hitType} + E (${fielderName})`;
                
                recordPlay(resultString, nB, r, oX); 
                setHitErrorData(null);
             }} className="w-full p-4 rounded-xl font-black uppercase tracking-widest shadow-lg bg-pink-600 text-white hover:bg-pink-500 transition-colors">
               Confirm Play
             </button>
             <button onClick={() => setHitErrorData(null)} className="w-full mt-4 py-2 text-white/30 font-black uppercase text-[10px] hover:text-white">Cancel</button>
          </div>
        </div>
      )}

      {/* GHOST RUNNER MODAL */}
      {showGhostModal && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/95 p-6 backdrop-blur-sm">
          <div className="bg-[#002D62] border-2 border-slate-400 p-6 rounded-3xl w-full max-w-sm shadow-2xl text-center">
            <h2 className="text-xl font-black uppercase italic mb-6 text-slate-300">Place Ghost Runner</h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <button onClick={() => placeGhostRunner(0)} className="bg-slate-800 p-4 rounded-xl border border-white/10 hover:bg-white hover:text-[#002D62] transition-colors font-black text-lg">1st</button>
              <button onClick={() => placeGhostRunner(1)} className="bg-slate-800 p-4 rounded-xl border border-white/10 hover:bg-white hover:text-[#002D62] transition-colors font-black text-lg">2nd</button>
              <button onClick={() => placeGhostRunner(2)} className="bg-slate-800 p-4 rounded-xl border border-white/10 hover:bg-white hover:text-[#002D62] transition-colors font-black text-lg">3rd</button>
            </div>
            <button onClick={() => setShowGhostModal(false)} className="w-full py-2 text-white/30 font-black uppercase text-[10px] tracking-widest hover:text-white">Cancel</button>
          </div>
        </div>
      )}

      {/* OTHER MODAL */}
      {showOtherModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/95 p-6 backdrop-blur-sm">
          <div className="bg-[#002D62] border-2 border-purple-600 p-6 rounded-3xl w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-black uppercase italic mb-6 text-center text-purple-400 tracking-tighter">Special Actions</h2>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Base Running</p>
              {[ 'Sac Fly', 'Fielder\'s Choice', 'Ground Rule Double'].map(action => (
                <button 
                  key={action}
                  onClick={() => handleOtherAction(action)}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-xl font-black uppercase italic text-xs hover:bg-purple-600 transition-all text-left flex justify-between items-center group"
                >
                  {action}
                  <span className="text-purple-500 group-hover:text-white">→</span>
                </button>
              ))}
              <div className="pt-4">
                  <p className="text-[10px] font-black uppercase text-yellow-500 mb-2 tracking-widest">Clean Hits (Extra Base)</p>
                  <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => handleOtherAction('Clean Single')} className="bg-yellow-600/20 border border-yellow-600/40 p-4 rounded-xl font-black uppercase italic text-[10px] hover:bg-yellow-600 hover:text-white transition-all">Clean 1B</button>
                      <button onClick={() => handleOtherAction('Clean Double')} className="bg-yellow-600/20 border border-yellow-600/40 p-4 rounded-xl font-black uppercase italic text-[10px] hover:bg-yellow-600 hover:text-white transition-all">Clean 2B</button>
                  </div>
              </div>

              {/* ADVANCED HITS (Only show if baserunning is enabled) */}
              {game.season?.isBaserunning && (
                <div className="pt-4">
                  <p className="text-[10px] font-black uppercase text-pink-500 mb-2 tracking-widest">Advanced Hits</p>
                  <button onClick={() => handleOtherAction('Hit with Error')} className="w-full bg-pink-600/20 border border-pink-600/40 p-4 rounded-xl font-black uppercase italic text-xs hover:bg-pink-600 hover:text-white transition-all text-left flex justify-between items-center group">
                    Hit with Error
                    <span className="text-pink-500 group-hover:text-white">→</span>
                  </button>
                </div>
              )}

              <div className="pt-4">
                  <p className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Overrides</p>
                  <button onClick={() => handleOtherAction('Add Ghost Runner')} className="w-full bg-slate-800 border border-white/10 p-4 rounded-xl font-black uppercase italic text-[10px] hover:bg-slate-600 transition-all text-left">
                    + Add Ghost Runner
                  </button>
              </div>
            </div>
            <button onClick={() => setShowOtherModal(false)} className="w-full mt-8 py-2 text-white/30 font-black uppercase text-[10px] tracking-widest hover:text-white">Close Menu</button>
          </div>
        </div>
      )}

      {/* SCOREBUG */}
      <div className="bg-[#002D62] overflow-hidden rounded shadow-2xl mb-8 border border-white/20 select-none">
        
        {/* RULE HEADER */}
        <div className="bg-[#c1121f] text-white px-3 py-1 flex justify-between items-center font-black uppercase tracking-widest text-[9px]">
           <span>{game.season?.name}</span>
           <span>{game.season?.inningsPerGame} INN | {targetBalls}B {targetStrikes}S {targetOuts}O {game.season?.mercyRule > 0 ? `| ${game.season.mercyRule} Run Mercy` : ''}</span>
        </div>

        <div className="flex">
            <div className="grid grid-cols-[1fr_auto] border-r border-white/20 bg-white text-black min-w-[210px]">
                <div className="px-5 py-3 font-black flex items-center gap-3 border-b border-black/10">
                    <span className="w-7 h-7 bg-red-700 text-white flex items-center justify-center text-xs rounded-sm font-bold uppercase">{game.awayTeam.name.substring(0,3)}</span>
                    <span className="uppercase text-base truncate font-bold">{game.awayTeam.name}</span>
                </div>
                <div className="px-6 py-3 bg-white font-black text-3xl flex items-center justify-center border-b border-black/10">{awayScore}</div>
                <div className="px-5 py-3 font-black flex items-center gap-3">
                    <span className="w-7 h-7 bg-blue-800 text-white flex items-center justify-center text-xs rounded-sm font-bold uppercase">{game.homeTeam.name.substring(0,3)}</span>
                    <span className="uppercase text-base truncate font-bold">{game.homeTeam.name}</span>
                </div>
                <div className="px-6 py-3 bg-white font-black text-3xl flex items-center justify-center">{homeScore}</div>
            </div>
            <div className="flex-1 grid grid-cols-2 bg-[#002D62]">
                <div className="flex flex-col items-center justify-center p-3 border-r border-white/10 text-center">
                    <div className="relative w-11 h-11 mb-2">
                        {[1, 2, 0].map(idx => <div key={idx} className={`absolute ${idx===1?'top-0 left-1/2 -translate-x-1/2':idx===2?'top-1/2 left-0 -translate-y-1/2':'top-1/2 right-0 -translate-y-1/2'} w-3.5 h-3.5 rotate-45 border border-white/30 ${baseRunners[idx] ? 'bg-yellow-400 border-yellow-200 shadow-lg' : ''}`}></div>)}
                    </div>
                    <div className="text-lg font-black tracking-tighter">{balls}-{strikes}</div>
                </div>
                <div className="flex flex-col items-center justify-center p-3 text-center">
                    <div className="font-black text-2xl leading-none">{isTopInning ? '▲' : '▼'}{inning}</div>
                    <div className="text-[10px] font-black uppercase opacity-60 mt-1">{outs} OUT</div>
                </div>
            </div>
        </div>
        <div className="bg-[#EAEAEA] text-black px-4 py-2 flex justify-between items-center border-t border-black/20 font-black italic text-[10px]">
          <div>PITCHING: {currentPitcher?.name}</div>
          <div>P: <span className="text-lg leading-none">{isTopInning ? homePitches : awayPitches}</span></div>
        </div>
        <div className="bg-white text-black px-4 py-2 flex justify-between items-center border-t border-black/10 font-black italic text-[10px]">
          <div>{currentBatterIdx + 1}. {currentBatter?.name}</div>
          <div className="opacity-50">AVG: .000</div>
        </div>
      </div>

      {/* BUTTON GRID */}
      <div className="space-y-3 mb-8">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => handleAction('Ball')} className="bg-slate-900 border-b-4 border-slate-700 py-6 rounded-xl font-black text-xl uppercase italic">Ball</button>
          <button onClick={() => handleAction('Strike')} className="bg-slate-900 border-b-4 border-slate-700 py-6 rounded-xl font-black text-xl uppercase italic">Strike</button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {['Single', 'Double', 'Triple', 'HR'].map((h, i) => <button key={h} onClick={() => handleAction(h)} className="bg-blue-900 border-b-4 border-blue-950 p-4 rounded-lg font-black text-[10px] uppercase italic">{h}</button>)}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => recordPlay('Fly Out', [...baseRunners], 0, 1)} className="bg-red-950 border-b-4 border-red-900 p-4 rounded-lg font-black text-[10px] uppercase italic">Fly Out</button>
          <button onClick={() => recordPlay('Ground Out', [...baseRunners], 0, 1)} className="bg-red-950 border-b-4 border-red-900 p-4 rounded-lg font-black text-[10px] uppercase italic">Ground Out</button>
          <button onClick={handleDPAction} className="bg-red-950 border-b-4 border-red-900 p-4 rounded-lg font-black text-[10px] uppercase italic">Double Play</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => recordPlay('K', [...baseRunners], 0, 1)} className="bg-red-900/40 border-b-4 border-red-900/60 p-3 rounded-lg font-black text-[10px] uppercase italic">K</button>
          <button onClick={() => handleAction('BB')} className="bg-blue-900/40 border-b-4 border-blue-900/60 p-3 rounded-lg font-black text-[10px] uppercase italic">BB</button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => startPlacementFlow('Error')} className="bg-yellow-600/20 border-b-4 border-yellow-600/40 p-3 rounded-lg font-black text-[10px] uppercase italic">Error</button>
          <button onClick={() => setShowOtherModal(true)} className="bg-purple-900/40 border-b-4 border-purple-900/60 p-3 rounded-lg font-black text-[10px] uppercase italic text-purple-200">Other...</button>
          <button onClick={() => startPlacementFlow('Tag')} className="bg-orange-900/40 border-b-4 border-orange-900/60 p-3 rounded-lg font-black text-[10px] uppercase italic">Tag</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button onClick={undoLastPlay} disabled={playLog.length === 0} className="bg-slate-900 border border-white/5 py-3 rounded-lg text-[10px] font-black uppercase text-slate-500 hover:text-white transition-all">Undo ⤾</button>
        <button onClick={redoLastPlay} disabled={redoStack.length === 0} className="bg-slate-900 border border-white/5 py-3 rounded-lg text-[10px] font-black uppercase text-slate-500 hover:text-blue-400 transition-all">Redo ⤿</button>
      </div>

      <div className="bg-slate-900/40 rounded-xl border border-white/5 overflow-hidden shadow-inner">
        <div className="bg-white/5 px-4 py-2 font-black uppercase text-[10px] text-slate-400 text-center italic">Live Game Feed</div>
        <div className="p-2 space-y-1 h-[120px] overflow-y-auto scrollbar-hide">
          {playLog.filter(l => l.type !== 'pitch').map((log, i) => (
            <div key={i} className={`flex justify-between items-center px-3 py-2 rounded text-xs ${log.runs > 0 ? 'bg-blue-600/20 border-blue-500/30 border' : ''}`}>
              <div className="flex items-center gap-3 font-black uppercase"><span className="text-[9px] font-bold text-slate-500 w-8">{log.inning}</span>{log.batter}</div>
              <div className="flex items-center gap-4"><span className={`font-black italic uppercase ${log.runs > 0 ? 'text-blue-400' : 'text-slate-400'}`}>{log.result}</span>{log.runs > 0 && <span className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">+{log.runs}</span>}</div>
            </div>
          ))}
        </div>
      </div>

      {/* MANUAL END GAME BUTTON */}
      <button 
        onClick={() => { setGameOverMessage("Manual Game Over"); setShowEndGameModal(true); }}
        className="w-full mt-8 bg-red-600/10 border-2 border-red-600/50 text-red-500 py-4 rounded-xl font-black uppercase italic tracking-widest hover:bg-red-600 hover:text-white hover:border-red-600 transition-all"
      >
        End Game
      </button>

      {/* JACKASS MODAL */}
      {showJackassError && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-red-600/95 backdrop-blur-md p-6 text-center">
          <div className="bg-white p-8 rounded-3xl border-4 border-black max-w-sm w-full shadow-2xl">
            <h2 className="text-2xl font-black uppercase italic mb-2 text-black">Jackass Alert</h2>
            <p className="text-black font-bold mb-8 uppercase tracking-tighter leading-tight">{jackassMessage}</p>
            <button onClick={() => setShowJackassError(false)} className="w-full bg-black text-white p-4 rounded-xl font-black uppercase tracking-widest">My Bad</button>
          </div>
        </div>
      )}
    </div>
  );
}