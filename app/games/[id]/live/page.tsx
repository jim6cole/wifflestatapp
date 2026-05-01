'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// --- BASERUNNING UTILITIES ---
const baseToInt = (b: string) => b === '1st' ? 1 : b === '2nd' ? 2 : b === '3rd' ? 3 : b === 'Home' ? 4 : b === 'Batter' ? 0 : -1;
const intToBase = (i: number) => i === 1 ? '1st' : i === 2 ? '2nd' : i === 3 ? '3rd' : i >= 4 ? 'Home' : 'Out';

const isBaseDisabled = (from: string, target: string, action: string | null = null) => {
    if (target === 'Out' || target === 'Home') return false;
    if (action === 'Move Runners') return false; 
    return baseToInt(from) > baseToInt(target);
};

export default function LiveScorer() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const source = searchParams.get('source');

  const [clientId, setClientId] = useState('');
  const [activeScorerId, setActiveScorerId] = useState<string | null>(null);

  const [game, setGame] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  let backUrl = `/admin/leagues/${game?.season?.leagueId}/seasons/${game?.seasonId}/play`;
  let backLabel = "Back to Gameday Board";

  if (source === 'public') {
    backUrl = `/leagues/${game?.season?.leagueId}/live`;
    backLabel = "Back to Live Action";
  }

  const [batterIndices, setBatterIndices] = useState({ away: 0, home: 0 }); 
  const [baseRunnerPitchers, setBaseRunnerPitchers] = useState<(number | null)[]>([null, null, null]);
  const [showSubModal, setShowSubModal] = useState<'pitcher' | 'batter' | null>(null);
  const [availableSubs, setAvailableSubs] = useState<any[]>([]);
  const [retiredPitchers, setRetiredPitchers] = useState<number[]>([]); 

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
  
  const [runsThisInning, setRunsThisInning] = useState(0);
  
  const [playLog, setPlayLog] = useState<any[]>([]); 
  const [redoStack, setRedoStack] = useState<any[]>([]);

  const [showDPModal, setShowDPModal] = useState(false);
  const [dpStep, setDpStep] = useState(1); 
  const [batterWasOut, setBatterWasOut] = useState(true);
  const [dpPlacements, setDpPlacements] = useState<any[]>([]);
  const [showJackassError, setShowJackassError] = useState(false);
  const [jackassMessage, setJackassMessage] = useState("");
  const [showOtherModal, setShowOtherModal] = useState(false);
  const [showGhostModal, setShowGhostModal] = useState(false);
  const [ghostSetupBases, setGhostSetupBases] = useState([false, false, false]);

  useEffect(() => {
      if (showGhostModal) {
          setGhostSetupBases([!!baseRunners[0], !!baseRunners[1], !!baseRunners[2]]);
      }
  }, [showGhostModal, baseRunners]);

  const [placementAction, setPlacementAction] = useState<string | null>(null);
  const [placementDetails, setPlacementDetails] = useState<any[]>([]);
  const [hitErrorData, setHitErrorData] = useState<any>(null);

  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState("");

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let storedId = localStorage.getItem('scorer-client-id');
    if (!storedId) {
        storedId = 'scorer_' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem('scorer-client-id', storedId);
    }
    setClientId(storedId);
  }, []);

  const syncStateFromCloud = useCallback((data: any) => {
    if (data.status === 'COMPLETED') {
        localStorage.removeItem(`game-sync-${id}`);
        const exitUrl = source === 'public' 
            ? `/leagues/${data.season?.leagueId}/live` 
            : `/admin/leagues/${data.season?.leagueId}/seasons/${data.seasonId}/play`;
        router.push(exitUrl);
        return;
    }

    setGame(data);
    setActiveScorerId(data.activeScorerId || null);
    
    const localData = localStorage.getItem(`game-sync-${id}`);
    const weHaveControl = !data.activeScorerId || data.activeScorerId === clientId;
    
    if (!weHaveControl) {
        setShowDPModal(false);
        setShowSubModal(null);
        setShowOtherModal(false);
        setShowGhostModal(false);
        setPlacementAction(null);
        setHitErrorData(null);
    }
    
    const savedState = (weHaveControl && localData) ? JSON.parse(localData) : (data.liveState ? JSON.parse(data.liveState) : null);

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
      setRunsThisInning(savedState.runsThisInning ?? 0);
      setPlayLog(savedState.playLog ?? []);
      setRedoStack(savedState.redoStack ?? []);
      setRetiredPitchers(savedState.retiredPitchers ?? []);
    }
    setIsLoaded(true);
  }, [id, clientId, router, source]);

  useEffect(() => {
    if (!id || !clientId) return;

    const loadGame = async () => {
      try {
          const res = await fetch(`/api/games/${id}/setup`);
          const data = await res.json();
          
          if (!data.activeScorerId && data.status !== 'COMPLETED') {
              await fetch(`/api/games/${id}/baton`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ clientId })
              });
              data.activeScorerId = clientId;
          }
          
          syncStateFromCloud(data);
      } catch (err) { console.error("Error loading game:", err); }
    };

    if (!isLoaded) {
        loadGame();
    }

    const pollInterval = setInterval(async () => {
        try {
            const res = await fetch(`/api/games/${id}/setup`);
            const data = await res.json();
            
            const weAreSpectating = activeScorerId && activeScorerId !== clientId;
            const serverSaysWeLostControl = data.activeScorerId && data.activeScorerId !== clientId;
            
            if (weAreSpectating || serverSaysWeLostControl || data.status === 'COMPLETED') {
                syncStateFromCloud(data);
            }
        } catch (err) {}
    }, 5000); 

    return () => clearInterval(pollInterval);
  }, [id, clientId, activeScorerId, isLoaded, syncStateFromCloud]);

  const claimBaton = async () => {
      localStorage.removeItem(`game-sync-${id}`);
      
      const resBaton = await fetch(`/api/games/${id}/baton`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId })
      });

      if (!resBaton.ok) {
          const resData = await resBaton.json();
          if (resData.error === "Game is already completed") {
              alert("Cannot take control. This game has been finalized.");
              router.push(source === 'public' ? `/leagues/${game?.season?.leagueId}/live` : `/admin/leagues/${game?.season?.leagueId}/seasons/${game?.seasonId}/play`);
              return;
          }
      }

      setActiveScorerId(clientId);
      
      const res = await fetch(`/api/games/${id}/setup`);
      const data = await res.json();
      syncStateFromCloud(data);
  };

  const hasControl = !activeScorerId || activeScorerId === clientId;

  useEffect(() => {
    if (!isLoaded || !game || !id || !hasControl) return; 
    
    const stateToSave = {
      batterIndices, isTopInning, inning, outs, balls, strikes,
      baseRunners, baseRunnerPitchers, homeScore, awayScore, homePitches, awayPitches,
      runsThisInning, playLog, redoStack, retiredPitchers
    };
    
    localStorage.setItem(`game-sync-${id}`, JSON.stringify(stateToSave));
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/games/${id}/live-state`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: stateToSave, clientId })
        });
        
        if (res.status === 403) {
            const data = await res.json();
            setActiveScorerId(data.activeScorerId);
        }
      } catch (err) { console.error("Cloud Autosave failed:", err); }
    }, 1500);
  }, [isLoaded, game, id, hasControl, clientId, batterIndices, isTopInning, inning, outs, balls, strikes, baseRunners, baseRunnerPitchers, homeScore, awayScore, homePitches, awayPitches, runsThisInning, playLog, redoStack, retiredPitchers]);

  const activePitcherId = isTopInning ? game?.currentHomePitcherId : game?.currentAwayPitcherId;

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

  // ⚡ FIX: 10-Run Rule Application & "Keep Playing" state transition
  const toggleInning = useCallback(() => {
    if (!game) return;
    const rules = game.season;
    const targetInnings = rules?.inningsPerGame || 5;
    const mercyLimit = rules?.mercyRule || 0;
    const mercyInning = rules?.mercyRuleInningApply || 3;

    const scoreDiff = Math.abs(homeScore - awayScore);
    
    // Check if the game has reached the minimum inning for mercy rule (e.g. 2.5 innings if home is winning)
    const isMercyEligible = inning > mercyInning || 
                            (inning === mercyInning && !isTopInning) || 
                            (inning === mercyInning && isTopInning && homeScore > awayScore);

    let isGameOver = false;
    let overMessage = "";

    if (mercyLimit > 0 && scoreDiff >= mercyLimit && isMercyEligible) {
        isGameOver = true;
        overMessage = `MERCY RULE! ${homeScore > awayScore ? 'Home' : 'Away'} Team wins.`;
    } else if (isTopInning && inning >= targetInnings && homeScore > awayScore) {
        isGameOver = true;
        overMessage = `GAME OVER! ${game.homeTeam.name} Wins!`;
    } else if (!isTopInning && inning >= targetInnings && homeScore !== awayScore) {
        isGameOver = true;
        overMessage = `GAME OVER! ${homeScore > awayScore ? 'Home' : 'Away'} Team Wins!`;
    }

    const breakLabel = isTopInning ? `Mid ${inning}` : `End ${inning}`;
    const nextIsTop = !isTopInning;
    const nextInning = nextIsTop ? inning + 1 : inning;
    
    let nextBases: (any | null)[] = [null, null, null];
    let nextPitchers: (number | null)[] = [null, null, null];
    
    if (rules?.ghostRunner && nextInning > targetInnings) {
       setShowGhostModal(true);
    }

    setPlayLog(prev => [{ 
      type: 'divider', 
      label: breakLabel, 
      prevBaseRunners: [...baseRunners], 
      prevBaseRunnerPitchers: [...baseRunnerPitchers],
      prevOuts: outs, prevBalls: balls, prevStrikes: strikes,
      prevBatterIndices: { ...batterIndices },
      prevRunsThisInning: runsThisInning 
    }, ...prev]);
    
    // ⚡ Execute the inning transition BEFORE showing the modal so 'Keep Playing' drops you perfectly into the next inning
    setIsTopInning(nextIsTop);
    setOuts(0); 
    setBaseRunners(nextBases); 
    setBaseRunnerPitchers(nextPitchers);
    setBalls(0); 
    setStrikes(0);
    setRunsThisInning(0); 
    if (!isTopInning) setInning(prev => prev + 1);

    if (isGameOver) {
        setGameOverMessage(overMessage);
        setShowEndGameModal(true);
    }
  }, [game, isTopInning, inning, baseRunners, baseRunnerPitchers, outs, balls, strikes, batterIndices, homeScore, awayScore, runsThisInning]);

  const recordPlay = useCallback((
      result: string, newBases: (any|null)[], runs: number, extraOuts: number = 0, 
      nextPitchers?: (number|null)[], scoringPitcherIds?: number[], scoringRunnerIds?: number[], 
      isManualOut: boolean = false
    ) => {
    clearRedo();
    if (!game) return;
    
    const rules = game.season;
    const targetOuts = rules?.outs || 3;
    const inningLimit = rules?.mercyRulePerInning || 0;
    const isUnlimitedInning = rules?.unlimitedLastInning && inning >= (rules?.inningsPerGame || 5);
    const newRunsThisInning = runsThisInning + runs;

    const isMidAtBat = result === 'Move Runners' || isManualOut;

    if (outs >= targetOuts && extraOuts > 0) {
       triggerJackass(`Inning is already over! (Current Outs: ${outs})`);
       return;
    }

    if (!isMidAtBat) {
        if (isTopInning) setHomePitches(p => p + 1); else setAwayPitches(p => p + 1);
    }

    const battingTeamId = isTopInning ? game.awayTeamId : game.homeTeamId;
    const hittingLineup = game.lineups
      .filter((l: any) => l.teamId === battingTeamId && l.battingOrder !== 99)
      .sort((a: any, b: any) => a.battingOrder - b.battingOrder);

    const activeBatterIdx = isTopInning ? batterIndices.away : batterIndices.home;
    const effectiveBatterIdx = isMidAtBat 
        ? (activeBatterIdx - 1 + hittingLineup.length) % hittingLineup.length 
        : activeBatterIdx;
    
    const batter = isManualOut ? null : hittingLineup[effectiveBatterIdx]?.player;

    const runner1Id = baseRunners[0]?.id || null;
    const runner2Id = baseRunners[1]?.id || null;
    const runner3Id = baseRunners[2]?.id || null;
    
    const scorerIdsString = (scoringRunnerIds || []).join(',');
    const runAttributionString = (scoringPitcherIds || []).filter(id => id !== null).join(',');

    fetch(`/api/games/${id}/at-bat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: id, batterId: isManualOut ? null : batter?.id, pitcherId: activePitcherId, slot: effectiveBatterIdx + 1,
        runAttribution: runAttributionString, result: result.toUpperCase().replace(/\s/g, '_'), 
        runsScored: runs, outs: extraOuts, inning: inning, isTopInning: isTopInning,
        runner1Id, runner2Id, runner3Id, scorerIds: scorerIdsString,
        runnersOn: baseRunners.filter(b => b !== null).length, outsAtStart: outs
      })
    });

    if (isTopInning) setAwayScore(prev => prev + runs); else setHomeScore(prev => prev + runs);
    setRunsThisInning(newRunsThisInning); 

    setPlayLog(prev => [{
      type: 'play', batter: isManualOut ? 'System' : (batter?.name || 'Unknown'), batterId: isManualOut ? undefined : batter?.id, pitcherId: activePitcherId, 
      result, runsScored: runs, runs: runs,
      inning: inning, isTopInning: isTopInning, slot: effectiveBatterIdx + 1, runAttribution: runAttributionString,
      runner1Id, runner2Id, runner3Id, scorerIds: scorerIdsString,
      logDisplayInning: `${isTopInning ? 'TOP' : 'BOT'} ${inning}`,
      prevBaseRunners: [...baseRunners], prevBaseRunnerPitchers: [...baseRunnerPitchers], 
      prevOuts: outs, prevBalls: balls, prevStrikes: strikes,
      prevBatterIndices: { ...batterIndices }, prevRunsThisInning: runsThisInning, 
      extraOuts 
    }, ...prev]);

    if (!isMidAtBat) {
        setBatterIndices(prev => ({
          ...prev,
          [isTopInning ? 'away' : 'home']: (prev[isTopInning ? 'away' : 'home'] + 1) % hittingLineup.length
        }));
    }

    const newAwayScore = isTopInning ? awayScore + runs : awayScore;
    const newHomeScore = !isTopInning ? homeScore + runs : homeScore;

    // ⚡ FIX: Added Mercy Rule Walk-Off support
    const targetInnings = rules?.inningsPerGame || 5;
    const mercyLimit = rules?.mercyRule || 0;
    const mercyInning = rules?.mercyRuleInningApply || 3;

    const homeJustTookLead = !isTopInning && inning >= targetInnings && newHomeScore > newAwayScore;
    const wasHomeAlreadyLeading = !isTopInning && homeScore > awayScore;

    const isMercyEligibleNow = inning >= mercyInning && !isTopInning;
    const homeHitMercyLead = mercyLimit > 0 && isMercyEligibleNow && (newHomeScore - newAwayScore) >= mercyLimit;

    if ((homeJustTookLead && !wasHomeAlreadyLeading) || homeHitMercyLead) {
        setBaseRunners(newBases);
        setGameOverMessage(homeHitMercyLead ? "MERCY RULE WALK-OFF!" : "WALK-OFF WIN!");
        setShowEndGameModal(true);
        return;
    }

    const runLimitReached = inningLimit > 0 && newRunsThisInning >= inningLimit && !isUnlimitedInning;

    if (runLimitReached || outs + extraOuts >= targetOuts) {
      toggleInning();
    } else {
      setBaseRunners(newBases); 
      setBaseRunnerPitchers(nextPitchers || [null, null, null]);
      setOuts(outs + extraOuts); 
      
      if (!isMidAtBat) {
          setBalls(0); 
          setStrikes(0);
      }
    }
  }, [game, id, isTopInning, batterIndices, outs, inning, baseRunners, baseRunnerPitchers, activePitcherId, homeScore, awayScore, runsThisInning, toggleInning, clearRedo, setHomePitches, setAwayPitches, triggerJackass, setAwayScore, setHomeScore, setPlayLog, balls, strikes, setBatterIndices, setBaseRunners, setBaseRunnerPitchers, setOuts, setBalls, setStrikes, setRunsThisInning]);

  const advanceRunnersAuto = useCallback((basesToMove: number, type: string) => {
    if (!game) return;
    const battingTeamId = isTopInning ? game.awayTeamId : game.homeTeamId;
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

  const validatePlacements = (placements: any[], action: string | null = null) => {
    const counts: any = { '1st': 0, '2nd': 0, '3rd': 0 };
    for (const p of placements) { if (counts[p.end] !== undefined) counts[p.end]++; }
    const dupes = Object.keys(counts).filter(k => counts[k] > 1);
    if (dupes.length > 0) { triggerJackass(`Multiple runners on ${dupes.join(' & ')}!`); return false; }

    const activeRunners = placements.filter(p => p.end !== 'Out' && p.end !== 'Home');
    
    for (let i = 0; i < activeRunners.length; i++) {
       for (let j = 0; j < activeRunners.length; j++) {
          if (i === j) continue;
          const rA = activeRunners[i];
          const rB = activeRunners[j];
          if (baseToInt(rA.from) < baseToInt(rB.from) && baseToInt(rA.end) >= baseToInt(rB.end)) {
             triggerJackass(`${rA.player.name} cannot pass ${rB.player.name} on the basepaths!`);
             return false;
          }
       }
    }

    for (const p of placements) {
       if (p.end !== 'Out' && p.end !== 'Home') {
           if (action !== 'Move Runners' && baseToInt(p.from) > baseToInt(p.end)) {
              triggerJackass(`${p.player.name} cannot move backwards from ${p.from} to ${p.end}!`);
              return false;
           }
       }
    }
    return true;
  };

  const handleDPAction = () => {
    const rules = game?.season;
    const targetOuts = rules?.outs || 3;
    if (outs >= targetOuts - 1) return triggerJackass(`Can't get ${targetOuts + 1} outs jackass.`);
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

    if (actionType === 'Move Runners') {
        const lastLog = playLog[0];
        if (lastLog && (lastLog.runs > 0 || lastLog.runsScored > 0) && lastLog.scorerIds) {
            const scoredIds = lastLog.scorerIds.split(',').map((id: string) => parseInt(id.trim())).filter((id: number) => !isNaN(id));
            const pIds = lastLog.runAttribution ? lastLog.runAttribution.split(',') : [];

            scoredIds.forEach((sId: number, idx: number) => {
                const scoredPlayer = game.lineups.find((l: any) => l.playerId === sId)?.player || { id: sId, name: 'Ghost Runner' };
                const responsiblePitcher = pIds[idx] ? parseInt(pIds[idx]) : activePitcherId;
                
                active.push({ player: scoredPlayer, from: 'Home', end: 'Home', internalId: `scored_${idx}`, pId: responsiblePitcher });
            });
        }
        
        if (active.length === 0) {
            return triggerJackass(`No baserunners to move!`);
        }
        setPlacementDetails([...active]); 
    } else if (actionType === 'Tag') {
        if (runnersOn.length === 0) return triggerJackass(`Can't tag if nobody is on base cheater`);
        setPlacementDetails([...active]); 
    } else if (actionType === 'Triple Play') {
        if (outs > 0) return triggerJackass("Can't turn a triple play with outs already on the board!");
        if (runnersOn.length < 2) return triggerJackass("Need at least 2 runners on for a Triple Play!");
        setPlacementDetails([...active, { player: btr, from: 'Batter', end: 'Out', internalId: 'bat' }]);
    } else {
        const hitVal = actionType.includes('Triple') ? 3 : actionType.includes('Double') ? 2 : actionType.includes('Single') || actionType === 'Error' || actionType === 'Fielder\'s Choice' ? 1 : 0;
        let batterEnd = intToBase(hitVal);
        if(actionType === 'Error' || actionType === 'Fielder\'s Choice') batterEnd = '1st';
        
        setPlacementDetails([...active, { player: btr, from: 'Batter', end: batterEnd, internalId: 'bat' }]);
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
    if (actionType === 'Wild Pitch') {
       if (isTopInning) setHomePitches(p => p + 1); else setAwayPitches(p => p + 1);
    }
    switch (actionType) {
      case 'Hit By Pitch': {
          let curB = [...baseRunners]; let curP = [...baseRunnerPitchers]; let scoringP: number[] = []; let scoringR: number[] = [];
          const battingTeamId = isTopInning ? game.awayTeamId : game.homeTeamId;
          const hittingLineup = game.lineups.filter((l: any) => l.teamId === battingTeamId && l.battingOrder !== 99).sort((a: any, b: any) => a.battingOrder - b.battingOrder);
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
      case 'Skip Batter': {
          clearRedo();
          const battingTeamId = isTopInning ? game.awayTeamId : game.homeTeamId;
          const hittingLineup = game.lineups.filter((l: any) => l.teamId === battingTeamId && l.battingOrder !== 99).sort((a: any, b: any) => a.battingOrder - b.battingOrder);
          const currentIdx = isTopInning ? batterIndices.away : batterIndices.home;
          const btr = hittingLineup[currentIdx]?.player;

          setPlayLog(prev => [{ type: 'event', result: `Skipped: ${btr?.name}`, runs: 0, inning, isTopInning, scorerIds: '', prevBaseRunners: [...baseRunners], prevBaseRunnerPitchers: [...baseRunnerPitchers], prevOuts: outs, prevBalls: balls, prevStrikes: strikes, prevBatterIndices: { ...batterIndices } }, ...prev]);
          
          setBatterIndices(prev => ({
              ...prev,
              [isTopInning ? 'away' : 'home']: (prev[isTopInning ? 'away' : 'home'] + 1) % hittingLineup.length
          }));
          setBalls(0);
          setStrikes(0);
          break;
      }
      case 'Manual Out': {
          recordPlay('Manual Out', [...baseRunners], 0, 1, [...baseRunnerPitchers], [], [], true);
          break;
      }
      case 'Sac Fly': startPlacementFlow('Tag'); break;
      case 'Fielder\'s Choice': startPlacementFlow('Error'); break;
      case 'Ground Rule Double': advanceRunnersAuto(2, 'GR Double'); break;
      case 'Clean Single': if (game.season?.isBaserunning && baseRunners.some(b => b !== null)) startPlacementFlow('Clean Single'); else handleHit(1, true); break;
      case 'Clean Double': if (game.season?.isBaserunning && baseRunners.some(b => b !== null)) startPlacementFlow('Clean Double'); else handleHit(2, true); break;
      case 'Move Baserunners': startPlacementFlow('Move Runners'); break;
      case 'Triple Play': startPlacementFlow('Triple Play'); break;
      case 'Hit with Error':
        const hitValE = 1;
        const activeE = [];
        if (baseRunners[2]) activeE.push({ player: baseRunners[2], from: '3rd', end: intToBase(3 + hitValE), internalId: 'b2' });
        if (baseRunners[1]) activeE.push({ player: baseRunners[1], from: '2nd', end: intToBase(2 + hitValE), internalId: 'b1' });
        if (baseRunners[0]) activeE.push({ player: baseRunners[0], from: '1st', end: intToBase(1 + hitValE), internalId: 'b0' });
        const btTeamId = isTopInning ? game.awayTeamId : game.homeTeamId;
        const hittingLineupE = game.lineups.filter((l: any) => l.teamId === btTeamId && l.battingOrder !== 99).sort((a: any, b: any) => a.battingOrder - b.battingOrder);
        const btrE = hittingLineupE[isTopInning ? batterIndices.away : batterIndices.home].player;
        setHitErrorData({ hitType: 'Single', fielderId: '', placements: [...activeE, { player: btrE, from: 'Batter', end: '2nd', internalId: 'bat' }] });
        break;
      case 'Add Ghost Runner': setShowGhostModal(true); break;
    }
  };

  const handleAction = (type: string) => {
    if (!game) return;

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
           const hittingLineup = game.lineups.filter((l: any) => l.teamId === btTeamId && l.battingOrder !== 99).sort((a: any, b: any) => a.battingOrder - b.battingOrder);
           const btr = hittingLineup[isTopInning ? batterIndices.away : batterIndices.home].player;
           if (curB[2] && curB[1] && curB[0]) { scoringR.push(curB[2].id); scoringP.push(curP[2]!); }
           if (curB[1] && curB[0]) { curB[2] = curB[1]; curP[2] = curP[1]; }
           if (curB[0]) { curB[1] = curB[0]; curP[1] = curP[0]; }
           curB[0] = btr; curP[0] = activePitcherId;
           recordPlay('Walk', curB, scoringR.length, 0, curP, scoringP, scoringR);
        } else {
           setBalls(b => b + 1);
           if (isTopInning) setHomePitches(p => p + 1); else setAwayPitches(p => p + 1);
        }
      } else {
        if (strikes >= (game.season?.strikes || 3) - 1) {
           recordPlay('K', [...baseRunners], 0, 1, [...baseRunnerPitchers]);
        } else {
           setStrikes(s => s + 1);
           if (isTopInning) setHomePitches(p => p + 1); else setAwayPitches(p => p + 1);
        }
      }
      return;
    }
    
    if (type === 'K') { recordPlay('K', [...baseRunners], 0, 1, [...baseRunnerPitchers]); return; }
    if (type === 'BB') {
      let curB = [...baseRunners]; let curP = [...baseRunnerPitchers]; let scoringR: number[] = []; let scoringP: number[] = [];
      const btTeamId = isTopInning ? game.awayTeamId : game.homeTeamId;
      const hittingLineup = game.lineups.filter((l: any) => l.teamId === btTeamId && l.battingOrder !== 99).sort((a: any, b: any) => a.battingOrder - b.battingOrder);
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
    
    const itemsToUndo = [playLog[0]];
    if (playLog[0].type === 'divider' && playLog.length > 1 && playLog[1].type === 'play') {
       itemsToUndo.push(playLog[1]);
    }
    
    const snapshot = {
       state: {
         baseRunners: [...baseRunners], baseRunnerPitchers: [...baseRunnerPitchers], outs, balls, strikes, 
         homeScore, awayScore, homePitches, awayPitches, 
         batterIndices: { ...batterIndices }, isTopInning, inning
       },
       entries: itemsToUndo
    };
    
    setRedoStack(prev => [snapshot, ...prev]);
    
    const lastItem = itemsToUndo[itemsToUndo.length - 1];
    
    for (const item of itemsToUndo) {
       if (item.type === 'play') {
          try { await fetch(`/api/games/${id}/undo`, { method: 'DELETE' }); } catch (err) {}
       }
    }
    
    let newHomeScore = homeScore;
    let newAwayScore = awayScore;
    let newHomePitches = homePitches;
    let newAwayPitches = awayPitches;
    
    for (const item of itemsToUndo) {
       if (item.type === 'play' || item.type === 'event' || item.type === 'ghost') {
          if (item.runs > 0) {
             const isTop = item.isTopInning !== undefined ? item.isTopInning : isTopInning;
             if (isTop) newAwayScore -= item.runs;
             else newHomeScore -= item.runs;
          }
       }
       if (item.type === 'pitch' || item.type === 'play') {
          const isTop = item.isTopInning !== undefined ? item.isTopInning : isTopInning;
          if (isTop) newHomePitches = Math.max(0, newHomePitches - 1);
          else newAwayPitches = Math.max(0, newAwayPitches - 1);
       }
    }
    
    setHomeScore(newHomeScore);
    setAwayScore(newAwayScore);
    setHomePitches(newHomePitches);
    setAwayPitches(newAwayPitches);
    
    setBaseRunners(lastItem.prevBaseRunners);
    setBaseRunnerPitchers(lastItem.prevBaseRunnerPitchers || [null, null, null]);
    setOuts(lastItem.prevOuts);
    setBalls(lastItem.prevBalls);
    setStrikes(lastItem.prevStrikes);
    
    if (lastItem.prevRunsThisInning !== undefined) {
       setRunsThisInning(lastItem.prevRunsThisInning);
    }
    
    if (itemsToUndo.some(i => i.type === 'divider')) {
       setIsTopInning(!isTopInning);
       if (isTopInning) setInning(i => i - 1);
    }
    
    setBatterIndices(lastItem.prevBatterIndices);
    setPlayLog(prev => prev.slice(itemsToUndo.length));
  };

  const redoLastPlay = async () => {
    if (redoStack.length === 0) return;
    const [snapshot, ...remaining] = redoStack;
    
    const chronologicalEntries = [...snapshot.entries].reverse();
    
    for (const entry of chronologicalEntries) {
       if (entry.type === 'play') {
          try { 
             await fetch(`/api/games/${id}/at-bat`, { 
               method: 'POST', 
               headers: { 'Content-Type': 'application/json' }, 
               body: JSON.stringify({ 
                 gameId: Number(id), batterId: entry.batterId, pitcherId: entry.pitcherId, 
                 inning: entry.inning, isTopInning: entry.isTopInning, 
                 result: entry.result, runsScored: entry.runsScored || 0, 
                 outs: entry.extraOuts || 0, slot: entry.slot || 0, 
                 runAttribution: entry.runAttribution || null, runner1Id: entry.runner1Id || null, 
                 runner2Id: entry.runner2Id || null, runner3Id: entry.runner3Id || null, 
                 scorerIds: entry.scorerIds || null, 
                 runnersOn: (entry.prevBaseRunners || []).filter((b: any) => b !== null).length, 
                 outsAtStart: entry.prevOuts || 0 
               }) 
             }); 
          } catch (err) {}
       }
    }
    
    setBaseRunners(snapshot.state.baseRunners);
    setBaseRunnerPitchers(snapshot.state.baseRunnerPitchers);
    setOuts(snapshot.state.outs);
    setBalls(snapshot.state.balls);
    setStrikes(snapshot.state.strikes);
    setHomeScore(snapshot.state.homeScore);
    setAwayScore(snapshot.state.awayScore);
    setHomePitches(snapshot.state.homePitches);
    setAwayPitches(snapshot.state.awayPitches);
    setBatterIndices(snapshot.state.batterIndices);
    setIsTopInning(snapshot.state.isTopInning);
    setInning(snapshot.state.inning);
    
    setPlayLog(prev => [...snapshot.entries, ...prev]);
    setRedoStack(remaining);
  };

  const finalizeGame = async () => {
    try { 
      await fetch(`/api/admin/games/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED', homeScore, awayScore })
      });
      localStorage.removeItem(`game-sync-${id}`); 
      router.push(backUrl);
    } catch (error) { alert("Failed to mark game as completed."); }
  };

  if (!game || !clientId) return <div className="bg-slate-950 min-h-screen flex flex-col items-center justify-center font-black italic text-white animate-pulse"><div className="text-2xl mb-2">WARMING UP...</div><div className="text-xs text-blue-400">Securing Local Connection</div></div>;

  const btrTeamId = isTopInning ? game.awayTeamId : game.homeTeamId;
  const activeHittingLineup = game.lineups.filter((l: any) => l.teamId === btrTeamId && l.battingOrder !== 99).sort((a: any, b: any) => a.battingOrder - b.battingOrder);
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
        
        const isHit = ['SINGLE', 'DOUBLE', 'TRIPLE', 'HR', '1B', '2B', '3B'].some(h => res.includes(h)) && !res.includes('PLAY');
        const isOut = ['FLY OUT', 'GROUND OUT', 'OUT', 'DP', 'TRIPLE PLAY'].some(o => res === o || res.includes(o));
        const isK = res === 'K' || res.includes('STRIKEOUT');

        if (res === 'MANUAL_OUT') return; 

        if (isHit) {
          gameH++;
          gameAb++;
        } else if (isOut || isK) {
          gameAb++;
        }
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

      {/* MODALS */}
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
                        {['Out', '1st', '2nd', '3rd', 'Home'].map(base => {
                          const disabled = isBaseDisabled(rp.from, base, 'Double Play');
                          return (
                          <button 
                            key={base} 
                            disabled={disabled}
                            onClick={() => setDpPlacements(dpPlacements.map(p => p.internalId === rp.internalId ? {...p, end: base} : p))} 
                            className={`py-2 rounded font-black text-[8px] uppercase border ${rp.end === base ? 'bg-red-600 border-white text-white' : disabled ? 'border-white/5 text-slate-700 opacity-50 cursor-not-allowed' : 'border-white/10 text-slate-500 hover:text-white hover:border-red-600'}`}>{base}</button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => {
                  if (!validatePlacements(dpPlacements, 'Double Play')) return;
                  let nB = [null, null, null] as (any|null)[]; 
                  let nP = [null, null, null] as (number|null)[]; 
                  let r = 0; let scoringR: number[] = []; let scoringP: number[] = [];
                  
                  dpPlacements.forEach(rp => { 
                    let pId = rp.internalId === 'b0' ? baseRunnerPitchers[0] : rp.internalId === 'b1' ? baseRunnerPitchers[1] : rp.internalId === 'b2' ? baseRunnerPitchers[2] : activePitcherId;
                    if (rp.end === '1st') { nB[0] = rp.player; nP[0] = pId; }
                    else if (rp.end === '2nd') { nB[1] = rp.player; nP[1] = pId; }
                    else if (rp.end === '3rd') { nB[2] = rp.player; nP[2] = pId; }
                    else if (rp.end === 'Home') { r++; if(rp.player?.id) scoringR.push(rp.player.id); if(pId) scoringP.push(pId); }
                  });
                  recordPlay('Double Play', nB, r, 2, nP, scoringP, scoringR); 
                  setShowDPModal(false);
                }} className="w-full bg-red-600 p-4 rounded-xl font-black uppercase tracking-widest shadow-lg">Confirm DP</button>
              </div>
            )}
            <button onClick={() => setShowDPModal(false)} className="w-full mt-4 text-[10px] font-black text-white/30 uppercase">Cancel</button>
          </div>
        </div>
      )}

      {placementAction && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/95 p-4">
          <div className={`bg-[#002D62] border-2 ${placementAction === 'Error' ? 'border-yellow-600' : placementAction === 'Tag' ? 'border-orange-600' : placementAction === 'Move Runners' ? 'border-blue-500' : placementAction === 'Triple Play' ? 'border-red-600' : 'border-green-500'} p-6 rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]`}>
            <div className="flex flex-col flex-1 overflow-hidden">
              <h2 className="text-xl font-black uppercase italic mb-2 text-center text-white">{placementAction} Placement</h2>
              
              <div className="relative w-20 h-20 mx-auto my-2">
                <div className="absolute top-[18%] left-[18%] w-[64%] h-[64%] border-2 border-white/20 rotate-45 rounded-sm"></div>
                <div className={`absolute top-[10%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rotate-45 border-2 z-10 ${baseRunners[1] ? 'bg-[#ffd60a] border-white shadow-[0_0_10px_rgba(255,214,10,0.6)]' : 'bg-[#001d3d] border-white/30'}`}></div>
                <div className={`absolute top-1/2 left-[10%] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rotate-45 border-2 z-10 ${baseRunners[2] ? 'bg-[#ffd60a] border-white shadow-[0_0_10px_rgba(255,214,10,0.6)]' : 'bg-[#001d3d] border-white/30'}`}></div>
                <div className={`absolute top-1/2 left-[90%] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rotate-45 border-2 z-10 ${baseRunners[0] ? 'bg-[#ffd60a] border-white shadow-[0_0_10px_rgba(255,214,10,0.6)]' : 'bg-[#001d3d] border-white/30'}`}></div>
                <div className="absolute top-[90%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 border-2 border-white/10 bg-white/5 rotate-45 z-10"></div>
              </div>

              {placementAction === 'Move Runners' && (
                  <p className="text-[10px] text-blue-300 font-bold uppercase text-center mb-2 px-4 leading-tight">
                      Adjusting runners mid-at-bat. Pulling a runner back from home deducts a run. 
                  </p>
              )}

              <div className="space-y-3 mb-6 overflow-y-auto flex-1 pr-2">
                {placementDetails.map((rp) => (
                  <div key={rp.internalId} className="bg-white/5 p-3 rounded-xl border border-white/10 shrink-0">
                    <div className="flex justify-between text-[10px] font-black uppercase text-blue-400 mb-2"><span>From: {rp.from}</span><span>{rp.player.name}</span></div>
                    <div className="grid grid-cols-5 gap-1">
                      {['Out', '1st', '2nd', '3rd', 'Home'].map(base => {
                        const disabled = isBaseDisabled(rp.from, base, placementAction);
                        return (
                        <button 
                          key={base} 
                          disabled={disabled}
                          onClick={() => setPlacementDetails(placementDetails.map(p => p.internalId === rp.internalId ? {...p, end: base} : p))} 
                          className={`py-2 rounded font-black text-[8px] uppercase border ${rp.end === base ? (placementAction === 'Error' ? 'bg-yellow-600' : (placementAction === 'Tag' ? 'bg-orange-600' : placementAction === 'Move Runners' ? 'bg-blue-600' : placementAction === 'Triple Play' ? 'bg-red-600' : 'bg-green-500')) + ' border-white text-white' : disabled ? 'border-white/5 text-slate-700 opacity-50 cursor-not-allowed' : 'border-white/10 text-slate-500 hover:text-white'}`}>{base}</button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => {
                if (!validatePlacements(placementDetails, placementAction)) return;
                let nB = [null, null, null] as (any|null)[]; 
                let nP = [null, null, null] as (number|null)[]; 
                let r = 0; 
                let oX = placementAction === 'Tag' ? 1 : 0; 
                let scoringR: number[] = []; let scoringP: number[] = [];
                
                placementDetails.forEach(rp => { 
                  let pId = null;
                  if (rp.internalId === 'b0') pId = baseRunnerPitchers[0];
                  else if (rp.internalId === 'b1') pId = baseRunnerPitchers[1];
                  else if (rp.internalId === 'b2') pId = baseRunnerPitchers[2];
                  else if (rp.internalId === 'bat') pId = activePitcherId;
                  else if (rp.internalId.startsWith('scored_')) pId = (rp as any).pId; 
                  
                  if (rp.end === '1st') { nB[0] = rp.player; nP[0] = pId; }
                  else if (rp.end === '2nd') { nB[1] = rp.player; nP[1] = pId; }
                  else if (rp.end === '3rd') { nB[2] = rp.player; nP[2] = pId; }
                  
                  if (rp.end === 'Home' && rp.from !== 'Home') { 
                      r++; 
                      if(rp.player?.id) scoringR.push(rp.player.id); 
                      if(pId) scoringP.push(pId); 
                  } else if (rp.end === 'Out' && rp.from !== 'Out') {
                      if (placementAction === 'Tag' && rp.from !== 'Batter') {
                          oX++;
                      } else if (placementAction !== 'Tag') {
                          oX++;
                      }
                  }

                  if (rp.from === 'Home' && rp.end !== 'Home') {
                      r--;
                  }
                });

                if (placementAction === 'Triple Play' && oX !== 3) {
                    return triggerJackass("A Triple Play must result in exactly 3 outs!");
                }

                recordPlay(placementAction === 'Tag' ? 'Tag Up' : placementAction, nB, r, oX, nP, scoringP, scoringR); 
                setPlacementAction(null);
              }} className={`w-full p-4 rounded-xl font-black uppercase tracking-widest shadow-lg ${placementAction === 'Error' ? 'bg-yellow-600' : placementAction === 'Tag' ? 'bg-orange-600' : placementAction === 'Move Runners' ? 'bg-blue-600' : placementAction === 'Triple Play' ? 'bg-red-600' : 'bg-green-500'}`}>Confirm Play</button>
            </div>
            <button onClick={() => setPlacementAction(null)} className="w-full mt-4 py-2 text-white/30 font-black uppercase text-[10px]">Cancel</button>
          </div>
        </div>
      )}

      {hitErrorData && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/95 p-4 overflow-y-auto">
          <div className="bg-[#002D62] border-2 border-pink-500 p-6 rounded-3xl w-full max-w-md shadow-2xl flex flex-col my-auto max-h-[95vh]">
             <h2 className="text-xl font-black uppercase italic mb-2 text-center text-pink-400">Hit + Error</h2>
             
             <div className="relative w-20 h-20 mx-auto my-2">
                <div className="absolute top-[18%] left-[18%] w-[64%] h-[64%] border-2 border-white/20 rotate-45 rounded-sm"></div>
                <div className={`absolute top-[10%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rotate-45 border-2 z-10 ${baseRunners[1] ? 'bg-[#ffd60a] border-white shadow-[0_0_10px_rgba(255,214,10,0.6)]' : 'bg-[#001d3d] border-white/30'}`}></div>
                <div className={`absolute top-1/2 left-[10%] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rotate-45 border-2 z-10 ${baseRunners[2] ? 'bg-[#ffd60a] border-white shadow-[0_0_10px_rgba(255,214,10,0.6)]' : 'bg-[#001d3d] border-white/30'}`}></div>
                <div className={`absolute top-1/2 left-[90%] -translate-x-1/2 -translate-y-1/2 w-6 h-6 rotate-45 border-2 z-10 ${baseRunners[0] ? 'bg-[#ffd60a] border-white shadow-[0_0_10px_rgba(255,214,10,0.6)]' : 'bg-[#001d3d] border-white/30'}`}></div>
                <div className="absolute top-[90%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 border-2 border-white/10 bg-white/5 rotate-45 z-10"></div>
             </div>

             <div className="mb-4">
                <label className="text-[10px] font-black uppercase text-pink-300 block mb-2">Credited Hit</label>
                <div className="grid grid-cols-3 gap-2">
                   {['Single', 'Double', 'Triple'].map(ht => (
                      <button key={ht} onClick={() => {
                        const hV = ht === 'Triple' ? 3 : ht === 'Double' ? 2 : 1;
                        const newPlacements = hitErrorData.placements.map((p: any) => ({
                            ...p, end: intToBase(baseToInt(p.from) + hV + (p.from === 'Batter' ? 1 : 0))
                        }));
                        setHitErrorData({...hitErrorData, hitType: ht, placements: newPlacements});
                      }} className={`py-2 rounded-xl font-black text-xs uppercase border ${hitErrorData.hitType === ht ? 'bg-pink-600 border-white text-white shadow-inner' : 'border-white/20 text-slate-400'}`}>{ht}</button>
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
                       {['Out', '1st', '2nd', '3rd', 'Home'].map(base => {
                         const disabled = isBaseDisabled(rp.from, base, 'Error');
                         return (
                         <button 
                            key={base} disabled={disabled}
                            onClick={() => setHitErrorData({...hitErrorData, placements: hitErrorData.placements.map((p: any) => p.internalId === rp.internalId ? {...p, end: base} : p)})} 
                            className={`py-2 rounded font-black text-[8px] uppercase border ${rp.end === base ? 'bg-pink-600 border-white text-white' : disabled ? 'border-white/5 text-slate-700 opacity-50 cursor-not-allowed' : 'border-white/10 text-slate-500 hover:border-pink-500/50 hover:text-white'}`}>{base}</button>
                         )
                       })}
                     </div>
                   </div>
                ))}
             </div>
             <button onClick={() => {
                if (!hitErrorData.fielderId) return triggerJackass("Select the fielder who made the error.");
                if (!validatePlacements(hitErrorData.placements, 'Error')) return;
                let nB = [null, null, null] as (any|null)[]; let nP = [null, null, null] as (number|null)[]; 
                let r = 0; let oX = 0; let scoringR: number[] = []; let scoringP: number[] = [];
                
                hitErrorData.placements.forEach((rp: any) => { 
                   let pId = rp.internalId === 'b0' ? baseRunnerPitchers[0] : rp.internalId === 'b1' ? baseRunnerPitchers[1] : rp.internalId === 'b2' ? baseRunnerPitchers[2] : activePitcherId;
                   if (rp.end === '1st') { nB[0] = rp.player; nP[0] = pId; }
                   else if (rp.end === '2nd') { nB[1] = rp.player; nP[1] = pId; }
                   else if (rp.end === '3rd') { nB[2] = rp.player; nP[2] = pId; }
                   else if (rp.end === 'Home') { r++; if(rp.player?.id) scoringR.push(rp.player.id); if(pId) scoringP.push(pId); }
                   else if (rp.end === 'Out') oX++; 
                });
                
                const fielderName = fieldingLineup.find((l: any) => String(l.player.id) === String(hitErrorData.fielderId))?.player.name;
                recordPlay(`${hitErrorData.hitType} + E (${fielderName})`, nB, r, oX, nP, scoringP, scoringR); 
                setHitErrorData(null);
             }} className="w-full p-4 rounded-xl font-black uppercase shadow-lg bg-pink-600 text-white">Confirm Play</button>
             <button onClick={() => setHitErrorData(null)} className="w-full mt-4 py-2 text-white/30 font-black uppercase text-[10px]">Cancel</button>
          </div>
        </div>
      )}

      {showGhostModal && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/95 p-6 backdrop-blur-sm">
          <div className="bg-[#002D62] border-4 border-[#669bbc] p-8 rounded-3xl w-full max-w-sm shadow-2xl text-center">
            <h2 className="text-2xl font-black uppercase italic mb-2 text-white">Extra Innings</h2>
            <p className="text-[#669bbc] font-bold uppercase tracking-widest text-[10px] mb-2">Tap to Set Ghost Runners</p>

            <div className="relative w-40 h-40 mx-auto my-8">
              <div className="absolute top-[18%] left-[18%] w-[64%] h-[64%] border-2 border-white/20 rotate-45 rounded-sm"></div>

              <button 
                onClick={() => setGhostSetupBases([ghostSetupBases[0], !ghostSetupBases[1], ghostSetupBases[2]])} 
                className={`absolute top-[10%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rotate-45 border-2 transition-all z-10 ${ghostSetupBases[1] ? 'bg-[#ffd60a] border-white shadow-[0_0_15px_rgba(255,214,10,0.6)] scale-110' : 'bg-[#001d3d] border-white/30 hover:border-white/80'}`}
              ></button>
              
              <button 
                onClick={() => setGhostSetupBases([ghostSetupBases[0], ghostSetupBases[1], !ghostSetupBases[2]])} 
                className={`absolute top-1/2 left-[10%] -translate-x-1/2 -translate-y-1/2 w-10 h-10 rotate-45 border-2 transition-all z-10 ${ghostSetupBases[2] ? 'bg-[#ffd60a] border-white shadow-[0_0_15px_rgba(255,214,10,0.6)] scale-110' : 'bg-[#001d3d] border-white/30 hover:border-white/80'}`}
              ></button>
              
              <button 
                onClick={() => setGhostSetupBases([!ghostSetupBases[0], ghostSetupBases[1], ghostSetupBases[2]])} 
                className={`absolute top-1/2 left-[90%] -translate-x-1/2 -translate-y-1/2 w-10 h-10 rotate-45 border-2 transition-all z-10 ${ghostSetupBases[0] ? 'bg-[#ffd60a] border-white shadow-[0_0_15px_rgba(255,214,10,0.6)] scale-110' : 'bg-[#001d3d] border-white/30 hover:border-white/80'}`}
              ></button>

              <div className="absolute top-[90%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-2 border-white/10 bg-white/5 rotate-45 z-10 flex items-center justify-center">
                 <span className="-rotate-45 text-[10px] font-black text-white/30">H</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
               <button onClick={() => setGhostSetupBases([true, true, true])} className="bg-white/5 p-3 rounded-xl border border-white/10 font-black uppercase text-[10px] text-white hover:bg-white/10">Bases Loaded</button>
               <button onClick={() => setGhostSetupBases([false, false, false])} className="bg-white/5 p-3 rounded-xl border border-white/10 font-black uppercase text-[10px] text-white hover:bg-white/10">Empty</button>
            </div>

            <button onClick={() => {
                let gB = [...baseRunners];
                let gP = [...baseRunnerPitchers];
                
                ghostSetupBases.forEach((isOn, idx) => {
                    if (isOn && !gB[idx]) {
                        gB[idx] = { id: `ghost-${Date.now()}-${idx}`, name: 'Ghost Runner' };
                        gP[idx] = null; 
                    } else if (!isOn && gB[idx]) {
                        gB[idx] = null;
                        gP[idx] = null;
                    }
                });

                setPlayLog(prev => [{
                    type: 'ghost', batter: 'System', result: `Ghost Runner Setup`,
                    runs: 0, inning, isTopInning,
                    prevBaseRunners: [...baseRunners], prevBaseRunnerPitchers: [...baseRunnerPitchers],
                    prevOuts: outs, prevBalls: balls, prevStrikes: strikes, prevBatterIndices: { ...batterIndices },
                    prevRunsThisInning: runsThisInning
                }, ...prev]);

                setBaseRunners(gB);
                setBaseRunnerPitchers(gP);
                setShowGhostModal(false);
            }} className="w-full bg-[#669bbc] text-white p-4 rounded-xl font-black uppercase tracking-widest hover:bg-white hover:text-[#001d3d] transition-all shadow-lg">Confirm Bases</button>
            <button onClick={() => setShowGhostModal(false)} className="w-full mt-4 py-2 text-white/30 font-black uppercase text-[10px] hover:text-white">Cancel / Play On</button>
          </div>
        </div>
      )}

      {/* OTHER ACTIONS MODAL */}
      {showOtherModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/95 p-6 backdrop-blur-sm">
          <div className="bg-[#002D62] border-2 border-purple-600 p-6 rounded-3xl w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-black uppercase italic mb-6 text-center text-purple-400">Special Actions</h2>
            <div className="space-y-2">
              <button onClick={() => handleOtherAction('Hit By Pitch')} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl font-black uppercase text-xs hover:bg-purple-600 text-left flex justify-between items-center group mb-2">Hit By Pitch (HBP) <span className="group-hover:text-white">→</span></button>
              {!game.season?.isBaserunning && (
                 <button onClick={() => handleOtherAction('Wild Pitch')} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl font-black uppercase text-xs hover:bg-purple-600 text-left flex justify-between items-center group">Wild Pitch (Advance Runners) <span className="group-hover:text-white">→</span></button>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 mt-4">
               <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Game Management</p>
               <button onClick={() => handleOtherAction('Move Baserunners')} className="w-full bg-blue-900 border border-white/10 p-4 rounded-xl font-black uppercase text-[10px] hover:bg-blue-700 mb-2 transition-all">Move Baserunners (Mid At-Bat)</button>
               
               <div className="grid grid-cols-2 gap-2 mb-2">
                   <button onClick={() => handleOtherAction('Manual Out')} className="w-full bg-slate-800 border border-white/10 p-4 rounded-xl font-black uppercase text-[10px] hover:bg-red-900 transition-all text-red-300">Manual Out</button>
                   <button onClick={() => handleOtherAction('Skip Batter')} className="w-full bg-slate-800 border border-white/10 p-4 rounded-xl font-black uppercase text-[10px] hover:bg-slate-600 transition-all text-slate-300">Skip Batter</button>
               </div>

               <button onClick={() => handleOtherAction('Add Ghost Runner')} className="w-full bg-slate-800 border border-white/10 p-4 rounded-xl font-black uppercase text-[10px] hover:bg-slate-600 transition-all">+ Add Ghost Runner</button>
            </div>

            <div className="space-y-2 pt-4 border-t border-white/10 mt-4">
              {[ 'Sac Fly', 'Fielder\'s Choice', 'Ground Rule Double', 'Triple Play'].map(action => (
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
            </div>
            <button onClick={() => setShowOtherModal(false)} className="w-full mt-8 py-2 text-white/30 font-black uppercase text-[10px] hover:text-white">Close Menu</button>
          </div>
        </div>
      )}

      {/* ⚡ THE SPECTATOR UI OVERLAY */}
      {!hasControl && (
          <div className="bg-[#002D62] border-2 border-blue-500 p-6 rounded-3xl mb-8 text-center animate-pulse shadow-[0_0_30px_rgba(59,130,246,0.3)] relative z-[50]">
              <h2 className="text-xl font-black uppercase italic mb-2 text-white">Spectator Mode</h2>
              <p className="text-xs text-blue-300 font-bold uppercase mb-6 tracking-widest leading-relaxed">
                  Another device is currently scoring this game.<br/>Your screen is syncing live.
              </p>
              <button onClick={claimBaton} className="bg-blue-600 text-white w-full py-4 rounded-xl font-black uppercase tracking-widest hover:bg-white hover:text-blue-900 transition-all pointer-events-auto">
                  Take Control
              </button>
          </div>
      )}

      {/* ⚡ GRAY OUT THE ENTIRE UI WHEN SPECTATING */}
      <div className={`transition-all duration-300 ${!hasControl ? 'opacity-40 pointer-events-none grayscale' : ''}`}>

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
                    <div className="flex items-center gap-4"><span className={`font-black italic uppercase ${log.runs > 0 ? 'text-blue-400' : log.runs < 0 ? 'text-red-400' : 'text-slate-400'}`}>{log.result}</span></div>
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

      </div>
      
      {showJackassError && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-red-600/95 backdrop-blur-md p-6 text-center z-[5000]">
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