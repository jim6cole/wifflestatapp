'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import BoxScoreTable from '@/components/stats/BoxScoreTable';
import PitchingBoxScoreTable from '@/components/stats/PitchingBoxScoreTable';

export default function PublicLiveFeed() {
  const { id } = useParams();

  const [game, setGame] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [liveState, setLiveState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const t = new Date().getTime();
        const [gameRes, statsRes] = await Promise.all([
          fetch(`/api/games/${id}/setup?t=${t}`),
          fetch(`/api/games/${id}/box-score?t=${t}`)
        ]);

        if (gameRes.ok && statsRes.ok) {
          const gameData = await gameRes.json();

          // Trigger Overlay and Redirect if Game is Finished
          if (gameData.status === 'COMPLETED') {
            setGame(gameData);
            setIsFinalizing(true);
            
            // Wait 5 seconds so they can see the final score banner, then redirect
            setTimeout(() => {
              window.location.replace(`/games/${id}`);
            }, 5000);
            return;
          }

          setGame(gameData);
          setStats(await statsRes.json());
          if (gameData.liveState) setLiveState(JSON.parse(gameData.liveState));
        }
        setLoading(false);
      } catch (err) {
        console.error("Broadcast Fetch Error:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000); 
    return () => clearInterval(interval);
  }, [id]);

  if (loading || !game) return (
    <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black italic text-[#ffd60a] text-3xl md:text-5xl animate-pulse uppercase border-[12px] md:border-[16px] border-[#c1121f]">
      Calibrating Broadcast...
    </div>
  );

  const isTopInning = liveState?.isTopInning ?? true;
  const inning = liveState?.inning ?? 1;
  const outs = liveState?.outs ?? 0;
  const balls = liveState?.balls ?? 0;
  const strikes = liveState?.strikes ?? 0;
  const baseRunners = liveState?.baseRunners ?? [null, null, null];
  const homeScore = game?.homeScore ?? liveState?.homeScore ?? 0;
  const awayScore = game?.awayScore ?? liveState?.awayScore ?? 0;
  const playLog = liveState?.playLog ?? [];
  const batterIndices = liveState?.batterIndices ?? { away: 0, home: 0 };
  const homePitches = liveState?.homePitches ?? 0;
  const awayPitches = liveState?.awayPitches ?? 0;

  const activePitcherId = isTopInning ? game?.currentHomePitcherId : game?.currentAwayPitcherId;
  const currentPitcher = game?.lineups?.find((l: any) => l.playerId === activePitcherId)?.player;
  
  const currentBatterIdx = isTopInning ? batterIndices.away : batterIndices.home;
  const battingTeamId = isTopInning ? game.awayTeamId : game.homeTeamId;
  const currentBatter = game?.lineups?.filter((l: any) => l.teamId === battingTeamId)[currentBatterIdx]?.player;

  const currentBatterStatsArray = isTopInning ? stats?.away?.batters : stats?.home?.batters;
  const batterSeasonStats = currentBatterStatsArray?.find((b: any) => b.id === currentBatter?.id);
  const currentAVG = batterSeasonStats?.avg || ".000";

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] p-4 md:p-8 border-[12px] md:border-[16px] border-[#c1121f] relative">
      
      {/* FINAL SCORE OVERLAY */}
      {isFinalizing && (
        <div className="fixed inset-0 z-[5000] bg-black/95 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 backdrop-blur-md">
          <div className="bg-[#c1121f] text-white px-12 py-4 skew-x-[-12deg] mb-8 shadow-[8px_8px_0px_#ffd60a]">
            <h2 className="text-6xl md:text-9xl font-black italic uppercase tracking-tighter skew-x-[12deg]">FINAL</h2>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-20 mb-12">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-[#669bbc] uppercase italic tracking-widest mb-2">{game.awayTeam.name}</span>
              <span className="text-8xl md:text-[12rem] font-black text-white leading-none">{game.awayScore}</span>
            </div>
            <div className="text-4xl font-black text-white/20 italic uppercase pr-4">VS</div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-[#669bbc] uppercase italic tracking-widest mb-2">{game.homeTeam.name}</span>
              <span className="text-8xl md:text-[12rem] font-black text-white leading-none">{game.homeScore}</span>
            </div>
          </div>
          
          <div className="text-[#ffd60a] font-black italic uppercase tracking-[0.5em] text-sm animate-pulse">
            Redirecting to Official Box Score...
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto">
        <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b-8 border-[#ffd60a] pb-6">
          <div>
            <Link href={`/leagues/${game.season.leagueId}/schedule/${game.seasonId}`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white transition-colors mb-2 block">
              ← Exit Live Feed
            </Link>
            <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f] leading-none">
              AWAA <span className="text-[#ffd60a]">Live</span>
            </h1>
          </div>
          <div className="bg-[#22c55e] text-[#001d3d] px-6 py-2 border-4 border-[#001d3d] font-black italic uppercase tracking-[0.4em] text-xs animate-pulse shadow-[6px_6px_0px_#000]">
            ON AIR
          </div>
        </header>

        {/* --- SCOREBUG --- */}
        <div className="bg-[#002D62] overflow-hidden shadow-[12px_12px_0px_#000] mb-10 border-4 border-[#001d3d] flex flex-col select-none max-w-5xl mx-auto">
          <div className="bg-[#c1121f] text-white px-4 py-2 flex justify-between items-center font-black uppercase tracking-widest text-[9px] border-b-4 border-[#001d3d]">
              <span>{game.season?.name} Broadcast</span>
              <span className="text-[#ffd60a] italic">Field {game.fieldNumber || '1'}</span>
          </div>

          <div className="flex flex-col lg:flex-row">
            <div className="flex-1 bg-white grid grid-cols-[1fr_auto] lg:border-r-4 border-[#001d3d]">
              <div className="flex flex-col">
                <div className={`flex items-center gap-4 px-6 py-4 border-b-4 border-[#001d3d]/10 ${isTopInning ? 'bg-[#ffd60a]/10' : ''}`}>
                  <span className="w-8 h-8 bg-[#c1121f] text-white flex items-center justify-center font-black italic text-lg border-2 border-[#001d3d] shadow-[3px_3px_0px_#000]">{game.awayTeam.name.substring(0,1)}</span>
                  <span className="text-xl md:text-4xl font-black italic uppercase text-[#001d3d]">{game.awayTeam.name}</span>
                </div>
                <div className={`flex items-center gap-4 px-6 py-4 ${!isTopInning ? 'bg-[#ffd60a]/10' : ''}`}>
                  <span className="w-8 h-8 bg-[#001d3d] text-white flex items-center justify-center font-black italic text-lg border-2 border-white shadow-[3px_3px_0px_#c1121f]">{game.homeTeam.name.substring(0,1)}</span>
                  <span className="text-xl md:text-4xl font-black italic uppercase text-[#001d3d]">{game.homeTeam.name}</span>
                </div>
              </div>
              <div className="flex flex-col bg-[#fdf0d5] border-l-4 border-[#001d3d] w-20 md:w-36">
                <div className="flex-1 flex items-center justify-center text-3xl md:text-6xl font-black text-[#001d3d] border-b-4 border-[#001d3d]/10 italic">{awayScore}</div>
                <div className="flex-1 flex items-center justify-center text-3xl md:text-6xl font-black text-[#c1121f] italic">{homeScore}</div>
              </div>
            </div>

            <div className="lg:w-[350px] grid grid-cols-2 bg-[#001d3d] text-white border-t-4 lg:border-t-0">
              <div className="p-6 border-r-4 border-white/10 flex flex-col items-center justify-center bg-black/20">
                <div className="relative w-12 h-12 mb-4">
                    {[1, 2, 0].map(idx => (
                      <div key={idx} className={`absolute ${idx===1?'top-0 left-1/2 -translate-x-1/2':idx===2?'top-1/2 left-0 -translate-y-1/2':'top-1/2 right-0 -translate-y-1/2'} w-4 h-4 rotate-45 border-2 border-white/20 ${baseRunners[idx] ? 'bg-[#ffd60a] border-white shadow-[0_0_15px_#ffd60a]' : ''}`}></div>
                    ))}
                </div>
                <div className="text-3xl font-black tracking-tighter text-[#ffd60a] italic">{balls}-{strikes}</div>
              </div>
              <div className="p-6 flex flex-col items-center justify-center text-center">
                <div className="font-black text-6xl leading-none italic text-white">{isTopInning ? '▲' : '▼'}{inning}</div>
                <div className="flex gap-2 mt-4">
                  <div className={`w-4 h-4 rounded-full border-2 border-white ${outs > 0 ? 'bg-[#c1121f]' : ''}`}></div>
                  <div className={`w-4 h-4 rounded-full border-2 border-white ${outs > 1 ? 'bg-[#c1121f]' : ''}`}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#ffd60a] border-t-4 border-[#001d3d] flex divide-x-4 divide-[#001d3d]">
            <div className="flex-1 px-6 py-3 flex justify-between items-center min-w-0">
              <div className="flex flex-col min-w-0 flex-1 pr-4">
                <span className="text-[8px] font-black uppercase text-[#c1121f] tracking-widest leading-none mb-1">Current Pitcher</span>
                <span className="text-sm md:text-lg font-black italic uppercase text-[#001d3d] leading-tight break-words">{currentPitcher?.name || "TBD"}</span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[8px] font-black uppercase text-[#001d3d]/50 tracking-widest leading-none mb-1 block">Pitches</span>
                <span className="text-xl font-black text-[#001d3d] leading-none">{isTopInning ? homePitches : awayPitches}</span>
              </div>
            </div>
            <div className="flex-1 px-6 py-3 flex justify-between items-center bg-white min-w-0">
              <div className="flex flex-col min-w-0 flex-1 pr-4">
                <span className="text-[8px] font-black uppercase text-[#669bbc] tracking-widest leading-none mb-1">Currently At Plate</span>
                <span className="text-sm md:text-lg font-black italic uppercase text-[#001d3d] leading-tight break-words">{currentBatter?.name || "TBD"}</span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[8px] font-black uppercase text-[#001d3d]/50 tracking-widest leading-none mb-1 block">AVG</span>
                <span className="text-xl font-black text-[#c1121f] leading-none font-mono">{currentAVG}</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- STAT TABLES & TICKER --- */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-12">
          <div className="xl:col-span-3 space-y-8">
            <h2 className="text-3xl font-black italic uppercase text-white border-b-4 border-[#c1121f] pb-2 mb-8">
              Active <span className="text-[#ffd60a]">Matchup Stats</span>
            </h2>
            <div className="space-y-12">
              <BoxScoreTable 
                stats={isTopInning ? (stats?.away?.batters || []) : (stats?.home?.batters || [])} 
                teamName={isTopInning ? game.awayTeam.name : game.homeTeam.name} 
                hrDetails={(stats?.hrEvents || []).filter((hr: any) => hr.teamId === (isTopInning ? game.awayTeamId : game.homeTeamId))}
              />
              <PitchingBoxScoreTable 
                stats={isTopInning ? (stats?.home?.pitchers || []) : (stats?.away?.pitchers || [])} 
                teamName={isTopInning ? game.homeTeam.name : game.awayTeam.name} 
              />
            </div>
          </div>

          <div className="bg-[#001d3d] border-4 border-[#ffd60a] shadow-[12px_12px_0px_#000] flex flex-col h-[900px] sticky top-8">
             <div className="bg-[#c1121f] p-4 text-center border-b-4 border-[#001d3d]">
               <h3 className="font-black italic uppercase tracking-[0.2em] text-white">Live Ticker</h3>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/20 scrollbar-hide">
               {playLog.filter((l:any) => l.type !== 'pitch').map((log: any, i: number) => {
                 if (log.type === 'divider') return (
                   <div key={i} className="bg-[#ffd60a] text-[#001d3d] text-center py-1 font-black uppercase tracking-[0.3em] text-[10px] border-y-2 border-[#001d3d] my-4 italic">{log.label}</div>
                 );
                 return (
                   <div key={i} className={`flex justify-between items-center p-4 border-2 ${log.runs > 0 ? 'bg-[#22c55e] text-[#001d3d] border-[#001d3d] shadow-[4px_4px_0px_#000]' : 'bg-white/5 border-white/10'}`}>
                     <div className="flex items-center gap-3">
                       <span className="text-[10px] font-black uppercase text-[#669bbc] w-8">{log.inning}</span>
                       <span className="font-black italic uppercase text-xs break-words max-w-[80px] leading-tight">{log.batter}</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <span className="font-black italic uppercase text-[10px]">{log.result}</span>
                       {log.runs > 0 && <span className="bg-[#001d3d] text-white px-1.5 py-0.5 font-black text-[9px]">+{log.runs}</span>}
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}