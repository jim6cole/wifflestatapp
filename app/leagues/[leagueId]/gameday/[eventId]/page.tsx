'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function UnifiedGamedayBoard() {
  const { leagueId, eventId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Poll for updates every 10 seconds to keep the scoreboard live
  useEffect(() => {
    const fetchData = () => {
      fetch(`/api/public/events/${eventId}/gameday`)
        .then(res => res.json())
        .then(json => {
          setData(json);
          setLoading(false);
        });
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [eventId]);

  if (loading) return (
    <div className="min-h-screen bg-[#001d3d] flex items-center justify-center">
      <div className="text-[#ffd60a] font-black italic animate-pulse text-5xl uppercase tracking-tighter">
        Connecting to Field...
      </div>
    </div>
  );

  const { liveGame, schedule, standings, eventName } = data;

  return (
    <div className="min-h-screen bg-[#001d3d] text-white flex flex-col overflow-hidden">
      
      {/* 1. THE LIVE SCOREBUG (Top Header) */}
      {liveGame ? (
        <div className="bg-[#c1121f] border-b-8 border-[#ffd60a] p-6 flex justify-between items-center shadow-2xl animate-in slide-in-from-top duration-700">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Inning</p>
              <p className="text-4xl font-black italic uppercase leading-none">{liveGame.inning}</p>
            </div>
            <div className="h-12 w-1 bg-white/20"></div>
            <div className="flex items-center gap-12">
              <ScoreGroup team={liveGame.awayTeam} score={liveGame.awayScore} />
              <span className="text-4xl font-black italic text-[#ffd60a]">VS</span>
              <ScoreGroup team={liveGame.homeTeam} score={liveGame.homeScore} />
            </div>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Last Play</p>
            <p className="text-xl font-black italic uppercase text-[#ffd60a]">{liveGame.lastPlay || "Game in Progress"}</p>
          </div>
        </div>
      ) : (
        <div className="bg-[#003566] p-4 text-center border-b-4 border-[#669bbc]">
          <h1 className="text-2xl font-black italic uppercase tracking-widest">{eventName}</h1>
        </div>
      )}

      {/* 2. MAIN CONTENT GRID */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        
        {/* LEFT: THE SCHEDULE (70%) */}
        <div className="lg:col-span-8 p-8 overflow-y-auto border-r-4 border-white/5 bg-black/20">
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-[#669bbc] mb-8 flex items-center gap-4">
            <span className="h-0.5 w-8 bg-[#669bbc]"></span> Today's Matchups
          </h2>
          <div className="grid gap-4">
            {schedule.map((game: any) => (
              <div key={game.id} className={`p-6 border-l-8 flex justify-between items-center ${game.status === 'LIVE' ? 'bg-[#c1121f]/10 border-[#c1121f]' : 'bg-white/5 border-white/10'}`}>
                <div className="flex items-center gap-6">
                  <span className="text-2xl font-black italic text-slate-500 w-24">{game.time}</span>
                  <span className="text-3xl font-black italic uppercase tracking-tighter">
                    {game.awayTeam.name} <span className="text-[#669bbc] mx-2">@</span> {game.homeTeam.name}
                  </span>
                </div>
                {game.status === 'COMPLETED' ? (
                  <span className="bg-white/10 px-4 py-2 font-black italic uppercase text-xs">Final: {game.awayScore}-{game.homeScore}</span>
                ) : game.status === 'LIVE' ? (
                  <span className="bg-[#c1121f] text-white px-4 py-2 font-black italic uppercase text-xs animate-pulse">Live</span>
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#669bbc]">Field {game.field || 1}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: THE STANDINGS (30%) */}
        <div className="lg:col-span-4 p-8 bg-[#001d3d] border-l-4 border-white/5 shadow-[-20px_0px_40px_rgba(0,0,0,0.3)]">
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-[#ffd60a] mb-8 flex items-center gap-4">
             <span className="h-0.5 w-8 bg-[#ffd60a]"></span> Standings
          </h2>
          <table className="w-full text-left">
            <thead className="text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-white/10">
              <tr>
                <th className="pb-4">Team</th>
                <th className="pb-4 text-center">W-L</th>
                <th className="pb-4 text-center">Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {standings.map((team: any, i: number) => (
                <tr key={team.id} className="group">
                  <td className="py-4">
                    <span className="text-[#669bbc] font-bold mr-3 italic text-xs">{i + 1}</span>
                    <span className="font-black italic uppercase text-xl group-hover:text-[#ffd60a] transition-colors">{team.name}</span>
                  </td>
                  <td className="py-4 text-center font-black text-xl tabular-nums">{team.w}-{team.l}</td>
                  <td className={`py-4 text-center font-black text-xl tabular-nums ${team.diff > 0 ? 'text-green-400' : team.diff < 0 ? 'text-red-400' : ''}`}>
                    {team.diff > 0 ? `+${team.diff}` : team.diff}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="mt-12 p-6 border-2 border-dashed border-white/10 rounded-xl">
             <p className="text-[9px] font-bold uppercase tracking-widest text-[#669bbc] text-center">
                Tiebreaker: 1. Win % // 2. Run Diff // 3. Runs Scored
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreGroup({ team, score }: any) {
  return (
    <div className="text-center">
      <p className="text-5xl font-black italic leading-none">{score}</p>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-1 opacity-80">{team.name}</p>
    </div>
  );
}