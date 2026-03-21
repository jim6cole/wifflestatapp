'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function UnifiedScorekeeper() {
  const { gameId } = useParams();
  const [loading, setLoading] = useState(true);
  
  // THE ENGINE: This stores our Season rules
  const [rules, setRules] = useState<any>(null);
  
  // THE STATE: Current game situation
  const [gameState, setGameState] = useState({
    homeScore: 0,
    awayScore: 0,
    inning: 1,
    isTop: true,
    outs: 0,
    strikes: 0,
    balls: 0,
    bases: [null, null, null], // Ghost Runner Tracking
  });

  // 1. FETCH RULES & GAME DATA ON LOAD
  useEffect(() => {
    async function loadGameData() {
      const res = await fetch(`/api/games/${gameId}`);
      const data = await res.json();
      
      // Setting the rules from the Season Wizard
      if (data.season) {
        setRules(data.season);
      }
      setLoading(false);
    }
    loadGameData();
  }, [gameId]);

  // 2. THE CORE LOGIC (Using Wizard Settings)
  const handleAction = (type: string) => {
    if (!rules) return;

    let nextState = { ...gameState };

    switch (type) {
      case 'STRIKE':
        nextState.strikes++;
        if (nextState.strikes >= rules.strikes) {
           handleAction('OUT'); // Auto-trigger out based on Wizard 'strikes' setting
           return;
        }
        break;

      case 'BALL':
        nextState.balls++;
        if (nextState.balls >= rules.balls) {
           // Handle Walk Logic based on Wizard 'isBaserunning'
        }
        break;

      case 'SINGLE':
        // CLEAN HIT LOGIC CHECK
        // If rules.cleanHitRule is true, we check if it's a "Clean Hit"
        // to determine if runners move 1 or 2 bases.
        console.log("Processing Single with Ghost Bases...");
        break;

      case 'OUT':
        nextState.outs++;
        nextState.strikes = 0;
        nextState.balls = 0;
        
        // CHECK INNING OVER (Based on Wizard 'outs' setting)
        if (nextState.outs >= rules.outs) {
           nextState.outs = 0;
           if (!nextState.isTop) nextState.inning++;
           nextState.isTop = !nextState.isTop;
        }
        break;
    }

    setGameState(nextState);
  };

  if (loading) return <div className="p-20 text-white font-black italic animate-pulse text-center">INITIALIZING WIZARD LOGIC...</div>;

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] border-[12px] border-[#c1121f] p-6">
      
      {/* HEADER: Shows which Season Rules are active */}
      <div className="flex justify-between items-center mb-6 bg-white/5 p-4 border border-[#669bbc]">
        <div>
          <p className="text-[10px] font-black uppercase text-[#669bbc]">Active Rulebook</p>
          <h2 className="text-xl font-black italic uppercase text-white">{rules?.name || "Standard Rules"}</h2>
        </div>
        <div className="text-right">
          <span className="text-[9px] font-bold bg-[#c1121f] px-2 py-1 uppercase">{rules?.inningsPerGame} Innings</span>
        </div>
      </div>

      {/* SCOREBOARD & CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* GAME STATUS CARD */}
        <div className="bg-[#003566] border-4 border-[#669bbc] p-8 shadow-2xl">
           <div className="flex justify-between mb-8">
              <div className="text-center">
                <p className="text-4xl font-black italic">{gameState.awayScore}</p>
                <p className="text-[10px] font-black text-[#669bbc]">AWAY</p>
              </div>
              <div className="text-center bg-black/40 px-4 py-2">
                <p className="text-xs font-black uppercase">{gameState.isTop ? 'TOP' : 'BOT'}</p>
                <p className="text-2xl font-black italic">{gameState.inning}</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-black italic">{gameState.homeScore}</p>
                <p className="text-[10px] font-black text-[#669bbc]">HOME</p>
              </div>
           </div>
           
           {/* COUNT TRACKER */}
           <div className="space-y-4">
              <p className="font-black italic text-center text-xl">
                {gameState.balls} - {gameState.strikes}
              </p>
              <p className="text-center text-red-600 font-black italic">{gameState.outs} OUTS</p>
           </div>
        </div>

        {/* INPUT PANEL */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
           <InputBtn label="Ball" color="bg-green-700" onClick={() => handleAction('BALL')} />
           <InputBtn label="Strike" color="bg-yellow-600" onClick={() => handleAction('STRIKE')} />
           <InputBtn label="Out" color="bg-black" onClick={() => handleAction('OUT')} />
           <InputBtn label="Single" color="bg-[#003566]" onClick={() => handleAction('SINGLE')} />
           <InputBtn label="Double" color="bg-[#003566]" onClick={() => handleAction('DOUBLE')} />
           <InputBtn label="Home Run" color="bg-[#c1121f]" onClick={() => handleAction('HR')} />
        </div>

      </div>
    </div>
  );
}

function InputBtn({ label, color, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`${color} border-2 border-white/10 p-10 text-xl font-black italic uppercase tracking-tighter hover:scale-105 active:scale-95 transition-all shadow-lg`}
    >
      {label}
    </button>
  );
}