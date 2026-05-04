'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import BoxScoreTable from '@/components/stats/BoxScoreTable';
import PitchingBoxScoreTable from '@/components/stats/PitchingBoxScoreTable';

const KNOWN_RESULTS = ["SINGLE", "CLEAN_SINGLE", "DOUBLE", "CLEAN_DOUBLE", "GROUND_RULE_DOUBLE", "TRIPLE", "HR", "WALK", "BB", "HBP", "ERROR", "K", "STRIKEOUT", "OUT", "FLY_OUT", "GROUND_OUT", "DOUBLE_PLAY", "DP", "TRIPLE_PLAY", "FIELDERS_CHOICE", "MANUAL_OUT"];

export default function StatCorrectionPage({ params }: { params: Promise<{ leagueId: string, seasonId: string, gameId: string }> }) {
  const { leagueId, seasonId, gameId } = use(params);
  
  const [game, setGame] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const t = new Date().getTime();
    try {
      const [gRes, sRes, hRes, pRes] = await Promise.all([
        fetch(`/api/games/${gameId}/setup?t=${t}`),
        fetch(`/api/games/${gameId}/box-score?t=${t}`),
        fetch(`/api/admin/games/${gameId}/history?t=${t}`),
        fetch(`/api/admin/seasons/${seasonId}/players?t=${t}`)
      ]);
      
      setGame(await gRes.json());
      setStats(await sRes.json());
      setHistory(await hRes.json());
      setPlayers(await pRes.json());
      setLoading(false);
    } catch (err) {
      console.error("Vault Access Error:", err);
    }
  };

  useEffect(() => {
    if (gameId) load();
  }, [gameId]);

  const handleUpdate = async (atBatId: number, updates: any) => {
    const isPlayerChange = 'batterId' in updates || 'pitcherId' in updates;
    
    const res = await fetch(`/api/admin/at-bats/${atBatId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...updates,
        ...(isPlayerChange && { updateFuture: true }) 
      })
    });
    
    if (res.ok) {
      await load(); 
    }
  };

  if (loading || !game || !stats || !history) return (
    <div className="min-h-screen bg-[#001d3d] flex items-center justify-center text-[#ffd60a] animate-pulse font-black italic text-2xl uppercase tracking-widest">
      Retrieving Archival Data...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] p-4 md:p-8 font-sans border-[12px] border-[#c1121f]">
      <div className="max-w-5xl mx-auto">
        
        {/* --- NAVIGATION --- */}
        <div className="mb-8 flex justify-between items-center">
          <Link 
            href={`/admin/leagues/${leagueId}/seasons/${seasonId}/games/${gameId}`} 
            className="group flex items-center gap-2 w-fit"
          >
            <div className="bg-white text-[#001d3d] p-1.5 border-2 border-[#c1121f] skew-x-[-12deg] group-hover:bg-[#ffd60a] transition-colors shadow-[4px_4px_0px_#c1121f]">
              <span className="text-[10px] font-black uppercase italic tracking-tighter block skew-x-[12deg]">
                ← Back to Summary
              </span>
            </div>
          </Link>
        </div>

        {/* --- SCOREBOARD --- */}
        <header className="bg-white p-6 border-4 border-[#001d3d] shadow-[8px_8px_0px_#c1121f] mb-12 text-[#001d3d]">
          <div className="flex justify-between items-center text-center mb-10">
            <div className="flex-1">
              <h2 className="text-2xl font-black uppercase italic">{game.awayTeam.name}</h2>
              <span className="text-7xl font-black text-[#c1121f]">{game.awayScore}</span>
            </div>
            <div className="px-10 font-black italic text-xl tracking-tighter uppercase">
              {game.status === 'COMPLETED' ? 'FINAL' : game.status}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black uppercase italic">{game.homeTeam.name}</h2>
              <span className="text-7xl font-black text-[#c1121f]">{game.homeScore}</span>
            </div>
          </div>

          <div className="overflow-x-auto border-t-2 border-black/5 pt-6">
            <table className="w-full text-center font-black uppercase italic text-[11px] border-collapse">
              <thead>
                <tr className="text-[#669bbc] tracking-widest">
                  <th className="text-left pr-4">TEAM</th>
                  {stats.lineScore?.map((s: any) => <th key={s.inning} className="px-2">{s.inning}</th>)}
                  <th className="pl-6 text-[#001d3d]">R</th>
                  <th className="px-2 text-[#001d3d]">H</th>
                  <th className="px-2 text-[#001d3d]">E</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-black/5">
                  <td className="text-left font-bold pr-4">{game.awayTeam.name.substring(0,3)}</td>
                  {stats.lineScore?.map((s: any) => <td key={s.inning} className="px-2 text-slate-400">{s.away}</td>)}
                  <td className="pl-6 text-2xl text-[#c1121f]">{game.awayScore}</td>
                  <td className="px-2 text-xl">{stats.totals?.awayH || 0}</td>
                  <td className="px-2 text-xl text-slate-400">{stats.totals?.awayE || 0}</td>
                </tr>
                <tr>
                  <td className="text-left font-bold pr-4">{game.homeTeam.name.substring(0,3)}</td>
                  {stats.lineScore?.map((s: any) => <td key={s.inning} className="px-2 text-slate-400">{s.home}</td>)}
                  <td className="pl-6 text-2xl text-[#c1121f]">{game.homeScore}</td>
                  <td className="px-2 text-xl">{stats.totals?.homeH || 0}</td>
                  <td className="px-2 text-xl text-slate-400">{stats.totals?.homeE || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </header>

        {/* --- STAT TABLES --- */}
        <section className="space-y-16">
          <div className="space-y-8">
            <BoxScoreTable stats={stats.away.batters} teamName={game.awayTeam.name} hrDetails={stats.hrEvents.filter((hr: any) => hr.teamId === game.awayTeamId)} />
            <PitchingBoxScoreTable stats={stats.away.pitchers} teamName={game.awayTeam.name} />
          </div>
          <div className="space-y-8">
            <BoxScoreTable stats={stats.home.batters} teamName={game.homeTeam.name} hrDetails={stats.hrEvents.filter((hr: any) => hr.teamId === game.homeTeamId)} />
            <PitchingBoxScoreTable stats={stats.home.pitchers} teamName={game.homeTeam.name} />
          </div>
        </section>

        {/* --- RAW PLAY EDITOR --- */}
        <div className="mt-20 pt-10 border-t-8 border-[#ffd60a]/30">
          <h2 className="text-3xl font-black italic uppercase text-[#ffd60a] mb-6 border-b-2 border-white/20 pb-2">Raw Play Editor</h2>
          <div className="space-y-6">
            {!history.atBats || history.atBats.length === 0 ? (
              <div className="bg-black/30 border-4 border-dashed border-[#669bbc] p-20 text-center">
                <p className="text-2xl font-black italic uppercase text-white/20 tracking-widest">No play history found.</p>
              </div>
            ) : (
              history.atBats.map((ab: any, idx: number) => {
                const battingTeamId = ab.isTopInning ? game.awayTeamId : game.homeTeamId;
                const pitchingTeamId = ab.isTopInning ? game.homeTeamId : game.awayTeamId;
                const battingRoster = players.filter((p: any) => p.teamId === battingTeamId);
                const pitchingRoster = players.filter((p: any) => p.teamId === pitchingTeamId);

                return (
                  <div key={ab.id} className="bg-white border-4 border-[#c1121f] p-6 flex flex-col md:flex-row justify-between items-center text-[#001d3d] shadow-[10px_10px_0px_#000]">
                    <div className="flex gap-6 items-center">
                      <span className="text-4xl font-black italic text-[#669bbc]/20">#{idx + 1}</span>
                      <div className="space-y-4">
                        
                        <div className="flex items-center gap-2">
                          <span className="bg-[#001d3d] text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-tighter border border-[#c1121f]">
                            INN {ab.inning}
                          </span>
                          <span className="bg-[#ffd60a] text-[#001d3d] text-[9px] font-black px-2 py-0.5 uppercase tracking-tighter border border-[#001d3d]">
                            {ab.isTopInning ? 'Away Batting' : 'Home Batting'}
                          </span>
                        </div>

                        <div className="flex flex-col">
                          <label className="text-[9px] font-black uppercase text-[#c1121f] mb-1">Batter</label>
                          <select 
                            value={ab.batterId}
                            onChange={(e) => handleUpdate(ab.id, { batterId: e.target.value })}
                            className="bg-[#fdf0d5] border-2 border-[#001d3d] font-black italic uppercase text-xl outline-none p-1 focus:border-[#c1121f] cursor-pointer"
                          >
                            {battingRoster.map((p: any) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col">
                          <label className="text-[9px] font-black uppercase text-[#669bbc] mb-1 italic">Pitching vs</label>
                          <select 
                            value={ab.pitcherId}
                            onChange={(e) => handleUpdate(ab.id, { pitcherId: e.target.value })}
                            className="bg-[#fdf0d5] border-2 border-[#001d3d] font-bold uppercase text-xs outline-none p-1 focus:border-[#669bbc] cursor-pointer"
                          >
                            {pitchingRoster.map((p: any) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-6 md:mt-0 items-start">
                      <div className="flex flex-col">
                        <label className="text-[10px] font-black uppercase mb-1 tracking-widest text-[#669bbc]">Outs at Start</label>
                        <select 
                          value={ab.outsAtStart ?? 0}
                          onChange={(e) => handleUpdate(ab.id, { outsAtStart: e.target.value })}
                          className="bg-[#fdf0d5] border-2 border-[#001d3d] p-3 font-black text-sm outline-none"
                        >
                          <option value="0">0 Outs</option>
                          <option value="1">1 Out</option>
                          <option value="2">2 Outs</option>
                        </select>
                      </div>

                      <div className="flex flex-col">
                        <label className="text-[10px] font-black uppercase mb-1 tracking-widest text-[#669bbc]">Result</label>
                        <select 
                          value={ab.result || ''} 
                          onChange={(e) => handleUpdate(ab.id, { result: e.target.value })}
                          className="bg-[#fdf0d5] border-2 border-[#001d3d] p-3 font-black uppercase text-sm outline-none focus:border-[#ffd60a]"
                        >
                          {!KNOWN_RESULTS.includes(ab.result) && ab.result && (
                            <option value={ab.result}>{ab.result} (Custom)</option>
                          )}
                          <optgroup label="Hits">
                            <option value="SINGLE">Single</option>
                            <option value="CLEAN_SINGLE">Clean Single</option>
                            <option value="DOUBLE">Double</option>
                            <option value="CLEAN_DOUBLE">Clean Double</option>
                            <option value="GROUND_RULE_DOUBLE">Ground Rule Double</option>
                            <option value="TRIPLE">Triple</option>
                            <option value="HR">Home Run</option>
                          </optgroup>
                          <optgroup label="On Base">
                            <option value="WALK">Walk</option>
                            <option value="BB">Walk (BB)</option>
                            <option value="HBP">Hit By Pitch</option>
                            <option value="ERROR">Reached on Error</option>
                          </optgroup>
                          <optgroup label="Outs">
                            <option value="K">Strikeout (K)</option>
                            <option value="STRIKEOUT">Strikeout</option>
                            <option value="OUT">General Out</option>
                            <option value="FLY_OUT">Fly Out</option>
                            <option value="GROUND_OUT">Ground Out</option>
                            <option value="DOUBLE_PLAY">Double Play</option>
                            <option value="DP">Double Play (DP)</option>
                            <option value="TRIPLE_PLAY">Triple Play</option>
                            <option value="FIELDERS_CHOICE">Fielder's Choice</option>
                            <option value="MANUAL_OUT">Manual Out / Ghost Runner</option>
                          </optgroup>
                        </select>
                      </div>

                      <div className="flex flex-col">
                        <label className="text-[10px] font-black uppercase mb-1 tracking-widest text-[#669bbc]">Runs</label>
                        <input 
                          type="number" 
                          defaultValue={ab.runsScored} 
                          onBlur={(e) => handleUpdate(ab.id, { runsScored: e.target.value })}
                          className="w-20 bg-[#fdf0d5] border-2 border-[#001d3d] p-3 font-black text-center text-sm outline-none focus:border-[#ffd60a]"
                        />
                      </div>

                      {ab.runsScored > 0 && (
                        <div className="flex flex-col">
                          <label className="text-[10px] font-black uppercase mb-1 tracking-widest text-[#c1121f]">Charge Runs To (IDs)</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 101,101,105"
                            defaultValue={ab.runAttribution || ''} 
                            onBlur={(e) => handleUpdate(ab.id, { runAttribution: e.target.value })}
                            className="w-32 bg-[#fdf0d5] border-2 border-[#c1121f] p-3 font-mono text-[10px] outline-none placeholder:opacity-20"
                          />
                          <p className="text-[7px] font-bold text-slate-400 mt-1 uppercase text-center">Pitcher ID per run</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}