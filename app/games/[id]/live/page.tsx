'use client';
import { useState, useEffect, useCallback, useRef, use } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LiveScorer() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const source = searchParams.get('source');

  const [game, setGame] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // --- NAVIGATION LOGIC ---
  let backUrl = `/admin/leagues/${game?.season?.leagueId}/seasons/${game?.seasonId}/play`;
  let backLabel = "Back to Gameday Board";

  if (source === 'public') {
    backUrl = `/leagues/${game?.season?.leagueId}/live`;
    backLabel = "Back to Live Action";
  }

  // --- TRACKING FOR SUBS & STATS ---
  const [batterIndices, setBatterIndices] = useState({ away: 0, home: 0 }); 
  const [baseRunnerPitchers, setBaseRunnerPitchers] = useState<(number | null)[]>([null, null, null]);
  const [showSubModal, setShowSubModal] = useState<'pitcher' | 'batter' | null>(null);
  const [availableSubs, setAvailableSubs] = useState<any[]>([]);
  const [retiredPitchers, setRetiredPitchers] = useState<number[]>([]); 

  // --- CORE GAME STATE ---
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

  const [placementAction, setPlacementAction] = useState<string | null>(null);
  const [placementDetails, setPlacementDetails] = useState<any[]>([]);
  const [hitErrorData, setHitErrorData] = useState<any>(null);

  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState("");

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- 1. INITIAL LOAD & RECOVERY ---
  useEffect(() => {
    if (!id) return;
    fetch(`/api/games/${id}/setup`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then(data => {
        setGame(data);
        const localData = localStorage.getItem(`game-sync-${id}`);
        const savedState = localData ? JSON.parse(localData) : (data.liveState ? JSON.parse(data.liveState) : null);

        if (savedState) {
          setBatterIndices(savedState.batterIndices ?? { away: 0, home: 0 });
          setIsTopInning(savedState.isTopInning ?? true);
          setInning(savedState.inning ?? 1);
          setOuts(savedState.outs ?? 0);
          setBalls(savedState.balls ?? 0);
          setStrikes(savedState.strikes ?? 0);
          setBaseRunners(savedState.baseRunners ?? [null, null, null]);
          setBaseRunnerPitchers(savedState.baseRunnerPitchers ?? [null, null, null]);
          setHomeScore(savedState.homeScore ?? 0);
          setAwayScore(savedState.awayScore ?? 0);
          setHomePitches(savedState.homePitches ?? 0);
          setAwayPitches(savedState.awayPitches ?? 0);
          setPlayLog(savedState.playLog ?? []);
          setRedoStack(savedState.redoStack ?? []);
          setRetiredPitchers(savedState.retiredPitchers ?? []);
        }
        setIsLoaded(true); 
      })
      .catch(err => console.error("Error loading game:", err));
  }, [id]);

  // --- 2. DUAL-SYNC AUTOSAVE ---
  useEffect(() => {
    if (!isLoaded || !game || !id) return; 
    const stateToSave = {
      batterIndices, isTopInning, inning, outs, balls, strikes,
      baseRunners, baseRunnerPitchers, homeScore, awayScore, homePitches, awayPitches,
      playLog, redoStack, retiredPitchers
    };
    localStorage.setItem(`game-sync-${id}`, JSON.stringify(stateToSave));
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      fetch(`/api/games/${id}/live-state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: stateToSave })
      }).catch(err => console.error("Cloud Autosave failed:", err));
    }, 1500);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [isLoaded, game, id, batterIndices, isTopInning, inning, outs, balls, strikes, baseRunners, baseRunnerPitchers, homeScore, awayScore, homePitches, awayPitches, playLog, redoStack, retiredPitchers]);

  const activePitcherId = isTopInning ? game?.currentHomePitcherId : game?.currentAwayPitcherId;

  // --- 3. SUBSTITUTION HUB ---
  const handleSubstitution = async (newPlayer: any) => {
    const type = showSubModal;
    setShowSubModal(null);
    if (type === 'pitcher') {
      const sideKey = isTopInning ? 'currentHomePitcherId' : 'currentAwayPitcherId';
      const teamId = isTopInning ? game.homeTeamId : game.awayTeamId;
      const oldPitcherInLineup = game.lineups.find((l: any) => l.playerId === activePitcherId && l.teamId === teamId);
      let newLineups = [...game.lineups];
      const existingInLineup = game.lineups.find((l: any) => l.playerId === newPlayer.id && l.teamId === teamId);
      if (!existingInLineup && oldPitcherInLineup) {
        newLineups = game.lineups.map((l: any) => 
          l.id === oldPitcherInLineup.id ? { ...l, playerId: newPlayer.id, player: newPlayer } : l
        );
      }
      if (!game.season?.allowPitcherReentry && activePitcherId) {
        setRetiredPitchers(prev => [...prev, activePitcherId]);
      }
      const updatedGame = { ...game, [sideKey]: newPlayer.id, lineups: newLineups };
      setGame(updatedGame);
      await fetch(`/api/admin/games/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [sideKey]: newPlayer.id })
      });
      setPlayLog(prev => [{ type: 'sub', result: `PITCHER: ${newPlayer.name}`, batter: 'System', inning: `${isTopInning?'TOP':'BOT'} ${inning}` }, ...prev]);
    }
    if (type === 'batter') {
      const battingTeamId = isTopInning ? game.awayTeamId : game.homeTeamId;
      // THE FIX: Must sub within the filtered hitting lineup context
      const hittingLineup = game.lineups
        .filter((l: any) => l.teamId === battingTeamId && l.battingOrder !== 99)
        .sort((a: any, b: any) => a.battingOrder - b.battingOrder);
        
      const currentIdx = isTopInning ? batterIndices.away : batterIndices.home;
      const slotToReplace = hittingLineup[currentIdx];
      
      const newLineups = game.lineups.map((l: any) => 
        l.id === slotToReplace.id ? { ...l, playerId: newPlayer.id, player: newPlayer } : l
      );
      setGame({ ...game, lineups: newLineups });
      setPlayLog(prev => [{ type: 'sub', result: `PH: ${newPlayer.name}`, batter: 'System', inning: `${isTopInning?'TOP':'BOT'} ${inning}` }, ...prev]);
    }
  };

  const openSubModal = async (type: 'pitcher' | 'batter') => {
    const teamId = (type === 'pitcher') ? (isTopInning ? game.homeTeamId : game.awayTeamId) : (isTopInning ? game.awayTeamId : game.homeTeamId);
    const res = await fetch(`/api/admin/seasons/${game.seasonId}/players`);
    const allPlayers = await res.json();
    const teamRoster = allPlayers.filter((p: any) => p.teamId === teamId);
    const activeIdsInLineup = new Set(game.lineups.filter((l: any) => l.teamId === teamId).map((l: any) => l.playerId));
    if (type === 'pitcher') {
      setAvailableSubs(teamRoster.filter((p: any) => {
        if (p.id === activePitcherId) return false;
        if (!game.season?.allowPitcherReentry && retiredPitchers.includes(p.id)) return false;
        return true;
      }));
    } else {
      setAvailableSubs(teamRoster.filter((p: any) => !activeIdsInLineup.has(p.id)));
    }
    setShowSubModal(type);
  };

  const clearRedo = () => { if (redoStack.length > 0) setRedoStack([]); };

  const triggerJackass = (msg: string) => {
    setJackassMessage(msg);
    setShowJackassError(true);
  };

  const toggleInning = useCallback(() => {
    if (!game) return;
    const rules = game.season;
    const targetInnings = rules?.inningsPerGame || 5;
    const mercyLimit = rules?.mercyRule || 0;

    const scoreDiff = Math.abs(homeScore - awayScore);
    
    // 1. MERCY RULE CHECK
    if (mercyLimit > 0 && scoreDiff >= mercyLimit) {
        setGameOverMessage(`MERCY RULE! ${homeScore > awayScore ? 'Home' : 'Away'} Team wins.`);
        setShowEndGameModal(true);
        return;
    }

    // 2. HOME TEAM ALREADY WINNING CHECK
    if (isTopInning && inning >= targetInnings && homeScore > awayScore) {
        setGameOverMessage(`GAME OVER! ${game.homeTeam.name} Wins!`);
        setShowEndGameModal(true);
        return;
    }

    // 3. FULL INNING COMPLETE CHECK
    if (!isTopInning && inning >= targetInnings && homeScore !== awayScore) {
        setGameOverMessage(`GAME OVER! ${homeScore > awayScore ? 'Home' : 'Away'} Team Wins!`);
        setShowEndGameModal(true);
        return; 
    }

    const breakLabel = isTopInning ? `Mid ${inning}` : `End ${inning}`;
    const nextIsTop = !isTopInning;
    const nextInning = nextIsTop ? inning + 1 : inning;
    
    let nextBases: (any | null)[] = [null, null, null];
    let nextPitchers: (number | null)[] = [null, null, null];
    
    if (rules?.ghostRunner && nextInning > targetInnings) {
       nextBases[1] = { id: `ghost-${Date.now()}`, name: 'Ghost Runner' };
       nextPitchers[1] = null;
    }

    setPlayLog(prev => [{ 
      type: 'divider', 
      label: breakLabel, 
      prevBaseRunners: [...baseRunners], 
      prevBaseRunnerPitchers: [...baseRunnerPitchers],
      prevOuts: outs, prevBalls: balls, prevStrikes: strikes,
      prevBatterIndices: { ...batterIndices } 
    }, ...prev]);
    
    setIsTopInning(nextIsTop);
    setOuts(0); 
    setBaseRunners(nextBases); 
    setBaseRunnerPitchers(nextPitchers);
    setBalls(0); 
    setStrikes(0);
    if (!isTopInning) setInning(prev => prev + 1);
  }, [game, isTopInning, inning, baseRunners, baseRunnerPitchers, outs, balls, strikes, batterIndices, homeScore, awayScore]);

  // --- 4. RECORD PLAY ---
  const recordPlay = useCallback((result: string, newBases: (any|null)[], runs: number, extraOuts: number = 0, nextPitchers?: (number|null)[], scoringPitcherIds?: number[], scoringRunnerIds?: number[]) => {
    clearRedo();
    if (!game) return;
    
    const targetOuts = game.season?.outs || 3;
    const battingTeamId = isTopInning ? game.awayTeamId : game.homeTeamId;
    
    // THE FIX: Filter lineup for rotation logic
    const hittingLineup = game.lineups
      .filter((l: any) => l.teamId === battingTeamId && l.battingOrder !== 99)
      .sort((a: any, b: any) => a.battingOrder - b.battingOrder);

    const activeBatterIdx = isTopInning ? batterIndices.away : batterIndices.home;
    const batter = hittingLineup[activeBatterIdx]?.player;

    const runner1Id = baseRunners[0]?.id || null;
    const runner2Id = baseRunners[1]?.id || null;
    const runner3Id = baseRunners[2]?.id || null;
    const scorerIdsString = (scoringRunnerIds || []).join(',');
    const runAttributionString = (scoringPitcherIds || []).filter(id => id !== null).join(',');

    fetch(`/api/at-bats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: id, batterId: batter?.id, pitcherId: activePitcherId, slot: activeBatterIdx + 1,
        runAttribution: runAttributionString, result: result.toUpperCase().replace(/\s/g, '_'), 
        runsScored: runs, outs: extraOuts, inning: inning, isTopInning: isTopInning,
        runner1Id, runner2Id, runner3Id, scorerIds: scorerIdsString,
        runnersOn: baseRunners.filter(b => b !== null).length, outsAtStart: outs
      })
    });

    const newAwayScore = isTopInning ? awayScore + runs : awayScore;
    const newHomeScore = !isTopInning ? homeScore + runs : homeScore;

    if (isTopInning) setAwayScore(prev => prev + runs); else setHomeScore(prev => prev + runs);

    setPlayLog(prev => [{
      type: 'play', batter: batter?.name || 'Unknown', batterId: batter?.id, pitcherId: activePitcherId, result, runsScored: runs, runs,
      inning: inning, isTopInning: isTopInning, slot: activeBatterIdx + 1, runAttribution: runAttributionString,
      runner1Id, runner2Id, runner3Id, scorerIds: scorerIdsString,
      logDisplayInning: `${isTopInning ? 'TOP' : 'BOT'} ${inning}`,
      prevBaseRunners: [...baseRunners], prevBaseRunnerPitchers: [...baseRunnerPitchers], 
      prevOuts: outs, prevBalls: balls, prevStrikes: strikes,
      prevBatterIndices: { ...batterIndices }
    }, ...prev]);

    setBatterIndices(prev => ({
      ...prev,
      [isTopInning ? 'away' : 'home']: (prev[isTopInning ? 'away' : 'home'] + 1) % hittingLineup.length
    }));

    const homeJustTookLead = !isTopInning && inning >= (game.season?.inningsPerGame || 5) && newHomeScore > newAwayScore;
    const wasHomeAlreadyLeading = !isTopInning && homeScore > awayScore;

    if (homeJustTookLead && !wasHomeAlreadyLeading) {
        setBaseRunners(newBases);
        setGameOverMessage("WALK-OFF WIN!");
        setShowEndGameModal(true);
        return;
    }

    if (outs + extraOuts >= targetOuts) {
      toggleInning();
    } else {
      setBaseRunners(newBases); 
      setBaseRunnerPitchers(nextPitchers || [null, null, null]);
      setOuts(outs + extraOuts); 
      setBalls(0); 
      setStrikes(0);
    }
  }, [game, id, isTopInning, batterIndices, outs, inning, baseRunners, baseRunnerPitchers, activePitcherId, homeScore, awayScore, toggleInning]);

  const advanceRunnersAuto = useCallback((basesToMove: number, type: string) => {
    if (!game) return;
    const battingTeamId = isTopInning ? game.awayTeamId : game.homeTeamId;
    
    // THE FIX: Filter lineup for logic
    const hittingLineup = game.lineups
      .filter((l: any) => l.teamId === battingTeamId && l.battingOrder !== 99)
      .sort((a: any, b: any) => a.battingOrder - b.battingOrder);

    const activeBatterIdx = isTopInning ? batterIndices.away : batterIndices.home;
    const batter = hittingLineup[activeBatterIdx]?.player;

    let curB = [...baseRunners];
    let curP = [...baseRunnerPitchers];
    let scoringP: number[] = [];
    let scoringR: number[] = [];

    if (type === 'HR') {
       scoringR = [...curB.filter(b => b !== null).map(b => b.id), batter.id];
       scoringP = [...curP.filter(id => id !== null) as number[], activePitcherId];
       curB = [null, null, null]; curP = [null, null, null];
    } else {
       for (let i = 0; i < basesToMove; i++) {
          if (curB[2] !== null) { scoringR.push(curB[2].id); scoringP.push(curP[2]!); }
          curB[2] = curB[1]; curP[2] = curP[1];
          curB[1] = curB[0]; curP[1] = curP[0];
          curB[0] = (i === 0) ? batter : null;
          curP[0] = (i === 0) ? activePitcherId : null;
       }
    }
    recordPlay(type, curB, scoringR.length, 0, curP, scoringP, scoringR);
  }, [game, isTopInning, batterIndices, baseRunners, baseRunnerPitchers, activePitcherId, recordPlay]);

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
    if (outs >= targetOuts - 1) return triggerJackass(`Can't get ${targetOuts + 1} outs jackass.`);
    if (isTopInning) setHomePitches(p => p + 1); else setAwayPitches(p => p + 1);
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
    
    const battingTeamId = isTopInning ? game.awayTeamId : game.homeTeamId;
    const hittingLineup = game.lineups
      .filter((l: any) => l.teamId === battingTeamId && l.battingOrder !== 99)
      .sort((a: any, b: any) => a.battingOrder - b.battingOrder);
    
    const activeBatterIdx = isTopInning ? batterIndices.away : batterIndices.home;
    const btr = hittingLineup[activeBatterIdx]?.player;
    
    setDpPlacements([...active, { player: btr, from: 'Batter', end: 'Out', internalId: 'bat' }]);
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

  const startPlacementFlow = (actionType: string) => {
    const runnersOn = baseRunners.filter(b => b !== null);
    if (actionType === 'Tag' && runnersOn.length === 0) return triggerJackass("Can't tag somebody who ain't there cheater");
    const active = [];
    if (baseRunners[2]) active.push({ player: baseRunners[2], from: '3rd', end: '3rd', internalId: 'b2' });
    if (baseRunners[1]) active.push({ player: baseRunners[1], from: '2nd', end: '2nd', internalId: 'b1' });
    if (baseRunners[0]) active.push({ player: baseRunners[0], from: '1st', end: '1st', internalId: 'b0' });
    
    const battingTeamId = isTopInning ? game.awayTeamId : game.homeTeamId;
    const hittingLineup = game.lineups
      .filter((l: any) => l.teamId === battingTeamId && l.battingOrder !== 99)
      .sort((a: any, b: any) => a.battingOrder - b.battingOrder);
      
    const activeBatterIdx = isTopInning ? batterIndices.away : batterIndices.home;
    const btr = hittingLineup[activeBatterIdx]?.player;

    if (actionType === 'Error') {
      setPlacementDetails([...active, { player: btr, from: 'Batter', end: '1st', internalId: 'bat' }]);
    } else if (['Single', 'Double', 'Triple', 'Clean Single', 'Clean Double'].includes(actionType)) {
      let defaultEnd = actionType.includes('Double') ? '2nd' : actionType.includes('Triple') ? '3rd' : '1st';
      setPlacementDetails([...active, { player: btr, from: 'Batter', end: defaultEnd, internalId: 'bat' }]);
    } else {
      setPlacementDetails(active);
    }
    setPlacementAction(actionType);
  };

  const handleHit = (bases: number, isClean: boolean) => {
    let curB = [...baseRunners];
    let curP = [...baseRunnerPitchers];
    let scoringP: number[] = [];
    let scoringR: number[] = [];
    const battingTeamId = isTopInning ? game.awayTeamId : game.homeTeamId;
    
    const hittingLineup = game.lineups
      .filter((l: any) => l.teamId === battingTeamId && l.battingOrder !== 99)
      .sort((a: any, b: any) => a.battingOrder - b.battingOrder);

    const activeBatterIdx = isTopInning ? batterIndices.away : batterIndices.home;
    const batter = hittingLineup[activeBatterIdx]?.player;
    const move = isClean ? bases + 1 : bases;
    for (let i = 0; i < move; i++) { 
        if (curB[2] !== null) { scoringR.push(curB[2].id); scoringP.push(curP[2]!); }
        curB[2] = curB[1]; curP[2] = curP[1];
        curB[1] = curB[0]; curP[1] = curP[0];
        curB[0] = null; curP[0] = null; 
    }
    curB[bases - 1] = batter; 
    curP[bases - 1] = activePitcherId;
    recordPlay(isClean ? `Clean ${bases}B` : `${bases}B`, curB, scoringR.length, 0, curP, scoringP, scoringR);
  };

  const handleOtherAction = (actionType: string) => {
    setShowOtherModal(false);
    if (actionType !== 'Add Ghost Runner') {
       if (isTopInning) setHomePitches(p => p + 1); else setAwayPitches(p => p + 1);
    }
    switch (actionType) {
      case 'Hit By Pitch': {
          let curB = [...baseRunners]; let curP = [...baseRunnerPitchers]; let scoringP: number[] = []; let scoringR: number[] = [];
          const battingTeamId = isTopInning ? game.awayTeamId : game.homeTeamId;
          
          const hittingLineup = game.lineups
            .filter((l: any) => l.teamId === battingTeamId && l.battingOrder !== 99)
            .sort((a: any, b: any) => a.battingOrder - b.battingOrder);

          const btr = hittingLineup[isTopInning ? batterIndices.away : batterIndices.home]?.player;
          
          if (curB[2] && curB[1] && curB[0]) { scoringR.push(curB[2].id); scoringP.push(curP[2]!); }
          if (curB[1] && curB[0]) { curB[2] = curB[1]; curP[2] = curP[1]; }
          if (curB[0]) { curB[1] = curB[0]; curP[1] = curP[0]; }
          curB[0] = btr; curP[0] = activePitcherId;
          recordPlay('HBP', curB, scoringR.length, 0, curP, scoringP, scoringR);
          break;
      }
      case 'Wild Pitch': {
          clearRedo();
          let curB = [...baseRunners]; let curP = [...baseRunnerPitchers]; let runs = 0; let scoringR: number[] = [];
          if (curB[2]) { runs++; scoringR.push(curB[2].id); }
          curB[2] = curB[1]; curP[2] = curP[1]; curB[1] = curB[0]; curP[1] = curP[0]; curB[0] = null; curP[0] = null;
          if (isTopInning) setAwayScore(s => s + runs); else setHomeScore(s => s + runs);
          setPlayLog(prev => [{ type: 'event', result: `Wild Pitch`, runs, inning, isTopInning, scorerIds: scoringR.join(','), prevBaseRunners: [...baseRunners], prevBaseRunnerPitchers: [...baseRunnerPitchers], prevOuts: outs, prevBalls: balls, prevStrikes: strikes, prevBatterIndices: { ...batterIndices } }, ...prev]);
          setBaseRunners(curB); setBaseRunnerPitchers(curP); break;
      }
      case 'Sac Fly': startPlacementFlow('Tag'); break;
      case 'Fielder\'s Choice': startPlacementFlow('Error'); break;
      case 'Ground Rule Double': advanceRunnersAuto(2, 'GR Double'); break;
      case 'Clean Single': if (game.season?.isBaserunning && baseRunners.some(b => b !== null)) startPlacementFlow('Clean Single'); else handleHit(1, true); break;
      case 'Clean Double': if (game.season?.isBaserunning && baseRunners.some(b => b !== null)) startPlacementFlow('Clean Double'); else handleHit(2, true); break;
      case 'Hit with Error':
        const active = [];
        if (baseRunners[2]) active.push({ player: baseRunners[2], from: '3rd', end: '3rd', internalId: 'b2' });
        if (baseRunners[1]) active.push({ player: baseRunners[1], from: '2nd', end: '2nd', internalId: 'b1' });
        if (baseRunners[0]) active.push({ player: baseRunners[0], from: '1st', end: '1st', internalId: 'b0' });
        const btTeamId = isTopInning ? game.awayTeamId : game.homeTeamId;
        
        const hittingLineup = game.lineups
          .filter((l: any) => l.teamId === btTeamId && l.battingOrder !== 99)
          .sort((a: any, b: any) => a.battingOrder - b.battingOrder);

        const btr = hittingLineup[isTopInning ? batterIndices.away : batterIndices.home].player;
        setHitErrorData({ hitType: 'Single', fielderId: '', placements: [...active, { player: btr, from: 'Batter', end: '2nd', internalId: 'bat' }] });
        break;
      case 'Add Ghost Runner': setShowGhostModal(true); break;
    }
  };

  const handleAction = (type: string) => {
    if (!game) return;
    if (['Single', 'Double', 'Triple', 'HR', 'Fly Out', 'Ground Out', 'K', 'BB'].includes(type)) {
      if (isTopInning) setHomePitches(p => p + 1); else setAwayPitches(p => p + 1);
    }
    if (['Single', 'Double', 'Triple'].includes(type)) {
      if (game.season?.isBaserunning && baseRunners.some(b => b !== null)) startPlacementFlow(type);
      else advanceRunnersAuto(type === 'Triple' ? 3 : type === 'Double' ? 2 : 1, type);
      return;
    }
    if (type === 'Ball' || type === 'Strike') {
      clearRedo();
      setPlayLog(prev => [{ type: 'pitch', result: type, prevBalls: balls, prevStrikes: strikes, prevBaseRunners: [...baseRunners], prevBaseRunnerPitchers: [...baseRunnerPitchers], prevOuts: outs, prevBatterIndices: { ...batterIndices } }, ...prev]);
      if (type === 'Ball') {
        if (balls >= (game.season?.balls || 4) - 1) {
           let curB = [...baseRunners]; let curP = [...baseRunnerPitchers]; let scoringP: number[] = []; let scoringR: number[] = [];
           const btTeamId = isTopInning ? game.awayTeamId : game.homeTeamId;
           
           const hittingLineup = game.lineups
            .filter((l: any) => l.teamId === btTeamId && l.battingOrder !== 99)
            .sort((a: any, b: any) => a.battingOrder - b.battingOrder);

           const btr = hittingLineup[isTopInning ? batterIndices.away : batterIndices.home].player;
           if (curB[2] && curB[1] && curB[0]) { scoringR.push(curB[2].id); scoringP.push(curP[2]!); }
           if (curB[1] && curB[0]) { curB[2] = curB[1]; curP[2] = curP[1]; }
           if (curB[0]) { curB[1] = curB[0]; curP[1] = curP[0]; }
           curB[0] = btr; curP[0] = activePitcherId;
           recordPlay('Walk', curB, scoringR.length, 0, curP, scoringP, scoringR);
        } else setBalls(b => b + 1);
      } else {
        if (strikes >= (game.season?.strikes || 3) - 1) recordPlay('K', [...baseRunners], 0, 1, [...baseRunnerPitchers]);
        else setStrikes(s => s + 1);
      }
      return;
    }
    if (type === 'K') { recordPlay('K', [...baseRunners], 0, 1, [...baseRunnerPitchers]); return; }
    if (type === 'BB') {
      let curB = [...baseRunners]; let curP = [...baseRunnerPitchers]; let scoringR: number[] = []; let scoringP: number[] = [];
      const btTeamId = isTopInning ? game.awayTeamId : game.homeTeamId;
      
      const hittingLineup = game.lineups
        .filter((l: any) => l.teamId === btTeamId && l.battingOrder !== 99)
        .sort((a: any, b: any) => a.battingOrder - b.battingOrder);

      const btr = hittingLineup[isTopInning ? batterIndices.away : batterIndices.home].player;
      if (curB[2] && curB[1] && curB[0]) { scoringR.push(curB[2].id); scoringP.push(curP[2]!); }
      if (curB[1] && curB[0]) { curB[2] = curB[1]; curP[2] = curP[1]; }
      if (curB[0]) { curB[1] = curB[0]; curP[1] = curP[0]; }
      curB[0] = btr; curP[0] = activePitcherId;
      recordPlay('Walk', curB, scoringR.length, 0, curP, scoringP, scoringR);
      return;
    }
    if (type === 'HR') advanceRunnersAuto(4, 'HR');
    if (['Fly Out', 'Ground Out'].includes(type)) recordPlay(type, [...baseRunners], 0, 1, [...baseRunnerPitchers]);
  };

  const undoLastPlay = async () => {
    if (playLog.length === 0) return;
    const last = playLog[0];
    if (last.type === 'play') { try { await fetch(`/api/games/${id}/undo`, { method: 'DELETE' }); } catch (err) {} }
    const snapshot = { type: last.type, batterIndices: { ...batterIndices }, isTopInning, inning, outs, balls, strikes, baseRunners: [...baseRunners], baseRunnerPitchers: [...baseRunnerPitchers], homeScore, awayScore, homePitches, awayPitches, logEntry: last };
    setRedoStack(prev => [snapshot, ...prev]);
    setBaseRunners(last.prevBaseRunners); setBaseRunnerPitchers(last.prevBaseRunnerPitchers || [null, null, null]); setOuts(last.prevOuts); setBalls(last.prevBalls); setStrikes(last.prevStrikes);
    if (last.type === 'play' || last.type === 'event' || last.type === 'ghost') {
      if (last.runs > 0) { if (isTopInning) setAwayScore(p => p - last.runs); else setHomeScore(p => p - last.runs); }
    }
    if (last.type === 'play') setBatterIndices(last.prevBatterIndices);
    if (last.type === 'pitch' || last.type === 'play') {
        if (isTopInning) setHomePitches(p => Math.max(0, p-1)); else setAwayPitches(p => Math.max(0, p-1));
    }
    if (last.type === 'divider') {
      setIsTopInning(!isTopInning); if (isTopInning) setInning(i => i-1); setBatterIndices(last.prevBatterIndices);
    }
    setPlayLog(prev => prev.slice(1));
  };

  const redoLastPlay = async () => {
    if (redoStack.length === 0) return;
    const [next, ...remaining] = redoStack;
    const entry = next.logEntry;
    if (entry.type === 'play') {
      try { await fetch('/api/at-bats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ 
        gameId: Number(id), batterId: entry.batterId, pitcherId: entry.pitcherId, inning: entry.inning, isTopInning: entry.isTopInning, 
        result: entry.result, runsScored: entry.runsScored || 0, outs: entry.outs || 0, slot: entry.slot || 0, 
        runAttribution: entry.runAttribution || null, runner1Id: entry.runner1Id, runner2Id: entry.runner2Id, runner3Id: entry.runner3Id, scorerIds: entry.scorerIds 
      }) }); } catch (err) {}
    }
    setBaseRunners(next.baseRunners); setBaseRunnerPitchers(next.baseRunnerPitchers || [null, null, null]); setInning(next.inning); setIsTopInning(next.isTopInning); setOuts(next.outs); setBalls(next.balls); setStrikes(next.strikes); setHomeScore(next.homeScore); setAwayScore(next.awayScore); setHomePitches(next.homePitches); setAwayPitches(next.awayPitches); setBatterIndices(next.batterIndices);
    setPlayLog(prev => [entry, ...prev]); setRedoStack(remaining);
  };

  const finalizeGame = async () => {
    try { await fetch(`/api/admin/games/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED', homeScore, awayScore })
      });
      localStorage.removeItem(`game-sync-${id}`); 
      router.push(backUrl);
    } catch (error) { alert("Failed to mark game as completed."); }
  };

  if (!game) return <div className="bg-slate-950 min-h-screen flex items-center justify-center font-black italic text-white animate-pulse">WARMING UP...</div>;

  const btrTeamId = isTopInning ? game.awayTeamId : game.homeTeamId;
  
  // THE FIX: Define hittingLineup for UI displays
  const activeHittingLineup = game.lineups
    .filter((l: any) => l.teamId === btrTeamId && l.battingOrder !== 99)
    .sort((a: any, b: any) => a.battingOrder - b.battingOrder);

  const currentBatterIdx = isTopInning ? batterIndices.away : batterIndices.home;
  const currentBatter = activeHittingLineup[currentBatterIdx]?.player;
  const currentBatterPosition = game.lineups.find((l: any) => l.playerId === currentBatter?.id)?.position || 'Fielder';
  const currentPitcher = game.lineups.find((l: any) => l.playerId === activePitcherId)?.player;

  const getBatterStats = (playerId: number) => {
    const initial = game?.preGameStats?.[playerId] || { ab: 0, h: 0 };
    let gameAb = 0, gameH = 0;
    playLog.forEach(log => {
      if (log.type === 'play' && log.batterId === playerId) {
        const res = log.result.toUpperCase();
        if (['SINGLE', 'DOUBLE', 'TRIPLE', 'HR', '1B', '2B', '3B', 'K', 'OUT', 'DP'].some(h => res.includes(h))) gameAb++;
        if (['SINGLE', 'DOUBLE', 'TRIPLE', 'HR', '1B', '2B', '3B'].some(h => res.includes(h))) gameH++;
      }
    });
    const totalAb = initial.ab + gameAb; const totalH = initial.h + gameH;
    const avg = totalAb > 0 ? (totalH / totalAb).toFixed(3).replace(/^0/, '') : '.000';
    return { avg, ab: totalAb, h: totalH, gameH, gameAb };
  };

  const currentStats = currentBatter ? getBatterStats(currentBatter.id) : { avg: '.000', gameH: 0, gameAb: 0 };
  const fieldingLineup = game.lineups.filter((l: any) => l.teamId === (isTopInning ? game.homeTeamId : game.awayTeamId));

  return (
    <div className="p-4 max-w-2xl mx-auto bg-slate-950 min-h-screen text-white font-sans relative pb-24">
      <Link href={backUrl} className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-all mb-4 block tracking-[0.3em]">
        ← {backLabel}
      </Link>

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

      {showSubModal && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
          <div className="bg-[#001d3d] border-4 border-[#669bbc] p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-3xl font-black uppercase italic mb-6 text-white border-b-2 border-white/10 pb-4">
              {showSubModal === 'pitcher' ? 'Pitching Change' : 'Pinch Hitter'}
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {availableSubs.length === 0 ? (
                <p className="text-slate-400 font-bold uppercase text-xs italic">No available players.</p>
              ) : (
                availableSubs.map(player => (
                  <button key={player.id} onClick={() => handleSubstitution(player)} className="w-full bg-white/5 hover:bg-[#c1121f] p-4 text-left font-black uppercase italic transition-colors border border-white/10">{player.name}</button>
                ))
              )}
            </div>
            <button onClick={() => setShowSubModal(null)} className="w-full mt-8 py-2 text-white/30 font-black uppercase text-[10px] tracking-widest hover:text-white">Cancel</button>
          </div>
        </div>
      )}

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
                }} className="w-full bg-red-600 p-4 rounded-xl font-black uppercase tracking-widest shadow-lg">Confirm DP</button>
              </div>
            )}
            <button onClick={() => setShowDPModal(false)} className="w-full mt-4 text-[10px] font-black text-white/30 uppercase">Cancel</button>
          </div>
        </div>
      )}

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
                        <button key={base} onClick={() => setPlacementDetails(placementDetails.map(p => p.internalId === rp.internalId ? {...p, end: base} : p))} className={`py-2 rounded font-black text-[8px] uppercase border ${rp.end === base ? (placementAction === 'Error' ? 'bg-yellow-600' : (placementAction === 'Tag' ? 'bg-orange-600' : 'bg-green-500')) + ' border-white' : 'border-white/10 text-slate-500'}`}>{base}</button>
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
              }} className={`w-full p-4 rounded-xl font-black uppercase tracking-widest shadow-lg ${placementAction === 'Error' ? 'bg-yellow-600' : placementAction === 'Tag' ? 'bg-orange-600' : 'bg-green-500'}`}>Confirm Play</button>
            </div>
            <button onClick={() => setPlacementAction(null)} className="w-full mt-4 py-2 text-white/30 font-black uppercase text-[10px]">Cancel</button>
          </div>
        </div>
      )}

      {hitErrorData && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/95 p-4 overflow-y-auto">
          <div className="bg-[#002D62] border-2 border-pink-500 p-6 rounded-3xl w-full max-w-md shadow-2xl flex flex-col my-auto max-h-[95vh]">
             <h2 className="text-xl font-black uppercase italic mb-4 text-center text-pink-400">Hit + Error</h2>
             <div className="mb-4">
                <label className="text-[10px] font-black uppercase text-pink-300 block mb-2">Credited Hit</label>
                <div className="grid grid-cols-3 gap-2">
                   {['Single', 'Double', 'Triple'].map(ht => (
                      <button key={ht} onClick={() => setHitErrorData({...hitErrorData, hitType: ht})} className={`py-2 rounded-xl font-black text-xs uppercase border ${hitErrorData.hitType === ht ? 'bg-pink-600 border-white text-white shadow-inner' : 'border-white/20 text-slate-400'}`}>{ht}</button>
                   ))}
                </div>
             </div>
             <div className="mb-4">
                <label className="text-[10px] font-black uppercase text-pink-300 block mb-2">Error Committed By</label>
                <select value={hitErrorData.fielderId} onChange={(e) => setHitErrorData({...hitErrorData, fielderId: e.target.value})} className="w-full bg-[#001d3d] border border-pink-500/50 p-3 text-white font-bold uppercase">
                   <option value="">-- Select Fielder --</option>
                   {fieldingLineup.map((l: any) => (
                      <option key={l.player.id} value={l.player.id}>{l.player.name} ({l.position})</option>
                   ))}
                </select>
             </div>
             <div className="space-y-2 mb-6 flex-1 overflow-y-auto pr-1">
                {hitErrorData.placements.map((rp: any) => (
                   <div key={rp.internalId} className="bg-white/5 p-2 rounded-xl border border-white/10">
                     <div className="flex justify-between text-[10px] font-black uppercase text-pink-200 mb-2"><span>From: {rp.from}</span><span>{rp.player.name}</span></div>
                     <div className="grid grid-cols-5 gap-1">
                       {['Out', '1st', '2nd', '3rd', 'Home'].map(base => (
                         <button key={base} onClick={() => setHitErrorData({...hitErrorData, placements: hitErrorData.placements.map((p: any) => p.internalId === rp.internalId ? {...p, end: base} : p)})} className={`py-2 rounded font-black text-[8px] uppercase border ${rp.end === base ? 'bg-pink-600 border-white text-white' : 'border-white/10 text-slate-500 hover:border-pink-500/50'}`}>{base}</button>
                       ))}
                     </div>
                   </div>
                ))}
             </div>
             <button onClick={() => {
                if (!hitErrorData.fielderId) return triggerJackass("Select the fielder who made the error.");
                if (!validatePlacements(hitErrorData.placements)) return;
                let nB = [null, null, null] as (any|null)[]; let r = 0; let oX = 0; 
                hitErrorData.placements.forEach((rp: any) => { if (rp.end === '1st') nB[0] = rp.player; else if (rp.end === '2nd') nB[1] = rp.player; else if (rp.end === '3rd') nB[2] = rp.player; else if (rp.end === 'Home') r++; else if (rp.end === 'Out') oX++; });
                const fielderName = fieldingLineup.find((l: any) => String(l.player.id) === String(hitErrorData.fielderId))?.player.name;
                recordPlay(`${hitErrorData.hitType} + E (${fielderName})`, nB, r, oX); 
                setHitErrorData(null);
             }} className="w-full p-4 rounded-xl font-black uppercase shadow-lg bg-pink-600 text-white">Confirm Play</button>
             <button onClick={() => setHitErrorData(null)} className="w-full mt-4 py-2 text-white/30 font-black uppercase text-[10px]">Cancel</button>
          </div>
        </div>
      )}

      {showGhostModal && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/95 p-6 backdrop-blur-sm">
          <div className="bg-[#002D62] border-2 border-slate-400 p-6 rounded-3xl w-full max-sm shadow-2xl text-center">
            <h2 className="text-xl font-black uppercase italic mb-6 text-slate-300">Place Ghost Runner</h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[0, 1, 2].map(idx => (
                <button key={idx} onClick={() => { let gB = [...baseRunners]; gB[idx] = { id: `ghost-${Date.now()}`, name: 'Ghost Runner' }; setPlayLog(prev => [{ type: 'ghost', batter: 'System', result: `Add Ghost Runner (${idx+1}st)`, runs: 0, inning, isTopInning, prevBaseRunners: [...baseRunners], prevOuts: outs, prevBalls: balls, prevStrikes: strikes, prevBatterIndices: { ...batterIndices } }, ...prev]); setBaseRunners(gB); setShowGhostModal(false); }} className="bg-slate-800 p-4 rounded-xl border border-white/10 hover:bg-white hover:text-[#002D62] font-black text-lg">{idx+1}{idx === 0 ? 'st' : idx === 1 ? 'nd' : 'rd'}</button>
              ))}
            </div>
            <button onClick={() => setShowGhostModal(false)} className="w-full py-2 text-white/30 font-black uppercase text-[10px] tracking-widest hover:text-white">Cancel</button>
          </div>
        </div>
      )}

      {showOtherModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/95 p-6 backdrop-blur-sm">
          <div className="bg-[#002D62] border-2 border-purple-600 p-6 rounded-3xl w-full max-sm shadow-2xl">
            <h2 className="text-xl font-black uppercase italic mb-6 text-center text-purple-400">Special Actions</h2>
            <div className="space-y-2">
              <button onClick={() => handleOtherAction('Hit By Pitch')} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl font-black uppercase text-xs hover:bg-purple-600 text-left flex justify-between items-center group mb-2">Hit By Pitch (HBP) <span className="group-hover:text-white">→</span></button>
              {!game.season?.isBaserunning && (
                 <button onClick={() => handleOtherAction('Wild Pitch')} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl font-black uppercase text-xs hover:bg-purple-600 text-left flex justify-between items-center group">Wild Pitch (Advance Runners) <span className="group-hover:text-white">→</span></button>
              )}
            </div>
            <div className="space-y-2 pt-4 border-t border-white/10 mt-4">
              {[ 'Sac Fly', 'Fielder\'s Choice', 'Ground Rule Double'].map(action => (
                <button key={action} onClick={() => handleOtherAction(action)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl font-black uppercase text-xs hover:bg-purple-600 text-left flex justify-between items-center group">{action} <span>→</span></button>
              ))}
              {game.season?.cleanHitRule && (
                <div className="pt-4"><p className="text-[10px] font-black uppercase text-yellow-500 mb-2">Clean Hits (Extra Base)</p>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleOtherAction('Clean Single')} className="bg-yellow-600/20 border border-yellow-600/40 p-4 rounded-xl font-black uppercase text-[10px] hover:bg-yellow-600 transition-all">Clean 1B</button>
                        <button onClick={() => handleOtherAction('Clean Double')} className="bg-yellow-600/20 border border-yellow-600/40 p-4 rounded-xl font-black uppercase text-[10px] hover:bg-yellow-600 transition-all">Clean 2B</button>
                    </div>
                </div>
              )}
              <div className="pt-4">
                  <button onClick={() => handleOtherAction('Add Ghost Runner')} className="w-full bg-slate-800 border border-white/10 p-4 rounded-xl font-black uppercase text-[10px] hover:bg-slate-600">+ Add Ghost Runner</button>
              </div>
            </div>
            <button onClick={() => setShowOtherModal(false)} className="w-full mt-8 py-2 text-white/30 font-black uppercase text-[10px] hover:text-white">Close Menu</button>
          </div>
        </div>
      )}

      <div className="bg-[#002D62] overflow-hidden rounded shadow-2xl mb-8 border border-white/20 select-none">
        <div className="bg-[#c1121f] text-white px-3 py-1 flex justify-between items-center font-black uppercase text-[9px]">
            <span>{game.season?.name}</span>
            <span>{game.season?.inningsPerGame} INN | {game.season?.balls || 4}B {game.season?.strikes || 3}S {game.season?.outs || 3}O {game.season?.mercyRule > 0 ? `| ${game.season.mercyRule} Run Mercy` : ''}</span>
        </div>
        <div className="flex">
            <div className="grid grid-cols-[1fr_auto] border-r border-white/20 bg-white text-black min-w-[210px]">
                <div className="px-5 py-3 font-black flex items-center gap-3 border-b border-black/10">
                    <span className="w-7 h-7 bg-red-700 text-white flex items-center justify-center text-xs rounded-sm font-bold">{game.awayTeam.name.substring(0,3)}</span>
                    <span className="uppercase text-base truncate font-bold">{game.awayTeam.name}</span>
                </div>
                <div className="px-6 py-3 bg-white font-black text-3xl flex items-center justify-center border-b border-black/10">{awayScore}</div>
                <div className="px-5 py-3 font-black flex items-center gap-3">
                    <span className="w-7 h-7 bg-blue-800 text-white flex items-center justify-center text-xs rounded-sm font-bold">{game.homeTeam.name.substring(0,3)}</span>
                    <span className="uppercase text-base truncate font-bold">{game.homeTeam.name}</span>
                </div>
                <div className="px-6 py-3 bg-white font-black text-3xl flex items-center justify-center">{homeScore}</div>
            </div>
            <div className="flex-1 grid grid-cols-2 bg-[#002D62]">
                <div className="flex flex-col items-center justify-center p-3 border-r border-white/10 text-center">
                    <div className="relative w-11 h-11 mb-2">
                        {[1, 2, 0].map(idx => <div key={idx} className={`absolute ${idx===1?'top-0 left-1/2 -translate-x-1/2':idx===2?'top-1/2 left-0 -translate-y-1/2':'top-1/2 right-0 -translate-y-1/2'} w-3.5 h-3.5 rotate-45 border border-white/30 ${baseRunners[idx] ? 'bg-yellow-400 border-yellow-200 shadow-lg' : ''}`}></div>)}
                    </div>
                    <div className="text-lg font-black">{balls}-{strikes}</div>
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
        <div className="bg-white text-black px-4 py-2 border-t border-black/10 font-black italic text-[10px]">
          <div className="flex justify-between items-center mb-1">
             <div>{currentBatterIdx + 1}. {currentBatter?.name} <span className="ml-2 text-slate-400 uppercase not-italic text-[9px]">({currentBatterPosition})</span></div>
             <div className="flex gap-4">
                <span className="opacity-40">{currentStats.gameH}-{currentStats.gameAb} TODAY</span>
                <span className="text-[#002D62]">AVG: {currentStats.avg}</span>
             </div>
          </div>
          {/* THE FIX: Define hittingLineup for the ON DECK indicator */}
          <div className="text-[8px] uppercase text-[#669bbc] border-t border-black/5 pt-1">
            ON DECK: {activeHittingLineup[(currentBatterIdx + 1) % activeHittingLineup.length]?.player.name}
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-8">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => handleAction('Ball')} className="bg-slate-900 border-b-4 border-slate-700 py-6 rounded-xl font-black text-xl uppercase italic">Ball</button>
          <button onClick={() => handleAction('Strike')} className="bg-slate-900 border-b-4 border-slate-700 py-6 rounded-xl font-black text-xl uppercase italic">Strike</button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {['Single', 'Double', 'Triple', 'HR'].map((h) => <button key={h} onClick={() => handleAction(h)} className="bg-blue-900 border-b-4 border-blue-950 p-4 rounded-lg font-black text-[10px] uppercase italic">{h}</button>)}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => recordPlay('Fly Out', [...baseRunners], 0, 1, [...baseRunnerPitchers])} className="bg-red-950 border-b-4 border-red-900 p-4 rounded-lg font-black text-[10px] uppercase italic">Fly Out</button>
          <button onClick={() => recordPlay('Ground Out', [...baseRunners], 0, 1, [...baseRunnerPitchers])} className="bg-red-950 border-b-4 border-red-900 p-4 rounded-lg font-black text-[10px] uppercase italic">Ground Out</button>
          <button onClick={handleDPAction} className="bg-red-950 border-b-4 border-red-900 p-4 rounded-lg font-black text-[10px] uppercase italic">Double Play</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => recordPlay('K', [...baseRunners], 0, 1, [...baseRunnerPitchers])} className="bg-red-900/40 border-b-4 border-red-900/60 p-3 rounded-lg font-black text-[10px] uppercase italic">K</button>
          <button onClick={() => handleAction('BB')} className="bg-blue-900/40 border-b-4 border-blue-900/60 p-3 rounded-lg font-black text-[10px] uppercase italic">BB</button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => startPlacementFlow('Error')} className="bg-yellow-600/20 border-b-4 border-yellow-600/40 p-3 rounded-lg font-black text-[10px] uppercase italic">Error</button>
          <button onClick={() => setShowOtherModal(true)} className="bg-purple-900/40 border-b-4 border-purple-900/60 p-3 rounded-lg font-black text-[10px] uppercase italic text-purple-200">Other...</button>
          <button onClick={() => startPlacementFlow('Tag')} className="bg-orange-900/40 border-b-4 border-orange-900/60 p-3 rounded-lg font-black text-[10px] uppercase italic">Tag</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button onClick={undoLastPlay} disabled={playLog.length === 0} className="bg-slate-900 border border-white/5 py-3 rounded-lg text-[10px] font-black uppercase text-slate-500">Undo ↩</button>
        <button onClick={redoLastPlay} disabled={redoStack.length === 0} className="bg-slate-900 border border-white/5 py-3 rounded-lg text-[10px] font-black uppercase text-slate-500">Redo ↪</button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <button onClick={() => openSubModal('pitcher')} className="bg-[#003566] border-b-4 border-[#001d3d] py-4 rounded-xl font-black text-xs uppercase italic text-blue-200">Pitching Change</button>
        <button onClick={() => openSubModal('batter')} className="bg-[#003566] border-b-4 border-[#001d3d] py-4 rounded-xl font-black text-xs uppercase italic text-blue-200">Pinch Hitter</button>
      </div>

      <div className="bg-slate-900/40 rounded-xl border border-white/5 overflow-hidden shadow-inner">
        <div className="bg-white/5 px-4 py-2 font-black uppercase text-[10px] text-slate-400 text-center italic">Live Game Feed</div>
        <div className="p-2 space-y-1 h-[120px] overflow-y-auto scrollbar-hide">
          {playLog.filter(l => l.type !== 'pitch').map((log, i) => (
            <div key={i} className={`flex flex-col px-3 py-2 rounded text-xs ${log.runs > 0 ? 'bg-blue-600/20 border-blue-500/30 border' : ''}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 font-black uppercase"><span className="text-[9px] font-bold text-slate-500 w-8">{log.logDisplayInning}</span>{log.batter}</div>
                <div className="flex items-center gap-4"><span className={`font-black italic uppercase ${log.runs > 0 ? 'text-blue-400' : 'text-slate-400'}`}>{log.result}</span>{log.runs > 0 && <span className="bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">+{log.runs}</span>}</div>
              </div>
              {log.runs > 0 && log.scorerIds && (
                <div className="text-[8px] text-blue-300/80 font-bold uppercase mt-1 pl-11">
                   Scored: {log.scorerIds.split(',').map((id: string) => game?.lineups?.find((l:any) => String(l.playerId) === String(id))?.player.name || 'Ghost Runner').join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => { setGameOverMessage("Manual Game Over"); setShowEndGameModal(true); }} className="w-full mt-8 bg-red-600/10 border-2 border-red-600/50 text-red-500 py-4 rounded-xl font-black uppercase italic tracking-widest hover:bg-red-600 hover:text-white transition-all">End Game</button>

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