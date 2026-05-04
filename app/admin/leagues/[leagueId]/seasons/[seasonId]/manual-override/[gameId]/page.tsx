'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function ManualBoxScorePage({ params }: { params: Promise<{ leagueId: string, seasonId: string, gameId: string }> }) {
  const { leagueId, seasonId, gameId } = use(params);
  
  const [game, setGame] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [awayStats, setAwayStats] = useState<any[]>([]);
  const [homeStats, setHomeStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = async (forceLive: boolean = false) => {
    const t = new Date().getTime();
    if (!forceLive) setLoading(true);
    try {
      const [gRes, pRes, mRes, bRes] = await Promise.all([
        fetch(`/api/games/${gameId}/setup?t=${t}`),
        fetch(`/api/admin/seasons/${seasonId}/players?t=${t}`),
        fetch(`/api/admin/games/${gameId}/box-score-override?t=${t}`),
        fetch(`/api/games/${gameId}/box-score?t=${t}`) 
      ]);
      
      const gData = await gRes.json();
      const pData = await pRes.json();
      const overrides = mRes.ok ? await mRes.json() : [];
      const liveBox = bRes.ok ? await bRes.json() : {}; 
      
      setGame(gData);
      setPlayers(pData);

      const allLiveBatters = [...(liveBox?.away?.batters || []), ...(liveBox?.home?.batters || [])];
      const allLivePitchers = [...(liveBox?.away?.pitchers || []), ...(liveBox?.home?.pitchers || [])];

      const buildStats = (teamId: number, isAway: boolean) => {
        const roster = pData.filter((p: any) => Number(p.teamId) === Number(teamId));

        return roster.map((player: any) => {
          const pId = Number(player.id);

          const saved = !forceLive && Array.isArray(overrides) 
            ? overrides.find((s: any) => Number(s.playerId) === pId)
            : null;

          const isEssentiallyEmpty = saved && saved.ab === 0 && saved.ip === 0;

          if (saved && !isEssentiallyEmpty) {
             return { 
                ...saved, 
                teamId,
                winCount: saved.winCount || 0,
                lossCount: saved.lossCount || 0,
                saveCount: saved.saveCount || 0
             }; 
          }

          const liveB = allLiveBatters.find((b: any) => Number(b.id) === pId) || {};
          const liveP = allLivePitchers.find((p: any) => Number(p.id) === pId) || {};

          return {
            playerId: pId,
            teamId: teamId,
            ab: Number(liveB.ab || 0), 
            r: Number(liveB.r || 0), 
            h: Number(liveB.h || 0), 
            d2b: Number(liveB.d || 0), 
            d3b: Number(liveB.t || 0), 
            hr: Number(liveB.hr || 0), 
            rbi: Number(liveB.rbi || 0), 
            bb: Number(liveB.bb || 0), 
            k: Number(liveB.k || 0),
            ip: liveP.ip ? parseFloat(liveP.ip) : 0, 
            ph: Number(liveP.h || 0),     
            pr: Number(liveP.r || 0),     
            per: Number(liveP.er || 0),   
            pbb: Number(liveP.bb || 0),   
            pk: Number(liveP.k || 0),     
            phr: Number(liveP.hr || 0),
            // Pull single-game W/L/SV decision properly
            winCount: liveP.decision === 'W' ? 1 : 0,
            lossCount: liveP.decision === 'L' ? 1 : 0,
            saveCount: liveP.decision === 'SV' ? 1 : 0
          };
        });
      };

      setAwayStats(buildStats(gData.awayTeamId, true));
      setHomeStats(buildStats(gData.homeTeamId, false));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => { if (gameId) load(); }, [gameId]);

  const handleStatChange = (team: 'away' | 'home', idx: number, field: string, value: string) => {
    const parsedValue = field === 'ip' ? parseFloat(value) || 0 : parseInt(value) || 0;

    // Mutually Exclusive Logic for W, L, SV
    if (['winCount', 'lossCount', 'saveCount'].includes(field)) {
      if (parsedValue === 1) {
        const clearStat = (arr: any[]) => arr.map(p => ({ ...p, [field]: 0 }));
        
        if (team === 'away') {
          setHomeStats(clearStat(homeStats)); 
          const newAway = clearStat(awayStats); 
          newAway[idx][field] = 1; 
          setAwayStats(newAway);
        } else {
          setAwayStats(clearStat(awayStats)); 
          const newHome = clearStat(homeStats); 
          newHome[idx][field] = 1; 
          setHomeStats(newHome);
        }
        return;
      }
    }

    const setter = team === 'away' ? setAwayStats : setHomeStats;
    const targetArray = team === 'away' ? [...awayStats] : [...homeStats];
    targetArray[idx] = { ...targetArray[idx], [field]: parsedValue };
    setter(targetArray);
  };

  const saveManualOverride = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/games/${gameId}/box-score-override`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ awayStats, homeStats, awayTeamId: game.awayTeamId, homeTeamId: game.homeTeamId })
      });
      if (res.ok) window.location.href = `/admin/leagues/${leagueId}/seasons/${seasonId}/games/${gameId}`;
    } catch (err) { console.error(err); }
    setIsSaving(false);
  };

  if (loading || !game) return (
    <div className="min-h-screen bg-[#001d3d] flex items-center justify-center text-[#ffd60a] animate-pulse font-black italic text-2xl uppercase tracking-widest">
      Auto-Syncing Official Stats...
    </div>
  );

  const statOptions: React.ReactNode[] = Array.from({ length: 41 }, (_, i) => <option key={i} value={i}>{i}</option>);
  const booleanOptions: React.ReactNode[] = [<option key={0} value={0}>0</option>, <option key={1} value={1}>1</option>];
  
  const ipOptions: React.ReactNode[] = [];
  for (let i = 0; i <= 15; i++) {
    ipOptions.push(<option key={`${i}.0`} value={i}>{i}.0</option>);
    ipOptions.push(<option key={`${i}.1`} value={i + 0.1}>{i}.1</option>);
    ipOptions.push(<option key={`${i}.2`} value={i + 0.2}>{i}.2</option>);
  }

  const renderTable = (teamName: string, stats: any[], type: 'away' | 'home') => (
    <div className="bg-white p-6 border-4 border-[#c1121f] shadow-[8px_8px_0px_#000] mb-12">
      <h3 className="text-3xl font-black italic uppercase text-[#001d3d] mb-6 border-b-4 border-[#c1121f] pb-2">{teamName}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse text-[#001d3d]">
          <thead>
            <tr className="bg-[#001d3d] text-white text-[10px] uppercase font-black">
              <th className="p-3 text-left w-48">Player</th>
              <th className="p-3 bg-[#c1121f]" colSpan={9}>Hitting</th>
              <th className="p-3 bg-[#669bbc]" colSpan={10}>Pitching</th>
            </tr>
            <tr className="bg-slate-100 text-[10px] font-bold border-b-2 border-[#001d3d] uppercase tracking-tighter">
              <th className="p-2 text-left">Name</th>
              <th className="p-2">AB</th><th className="p-2">R</th><th className="p-2">H</th>
              <th className="p-2">2B</th><th className="p-2">3B</th><th className="p-2">HR</th>
              <th className="p-2">RBI</th><th className="p-2">BB</th><th className="p-2">K</th>
              
              <th className="p-2 border-l-2 border-[#001d3d]">IP</th>
              <th className="p-2">H</th><th className="p-2">R</th><th className="p-2">ER</th>
              <th className="p-2">BB</th><th className="p-2">K</th><th className="p-2">HR</th>
              
              <th className="p-2 border-l-2 border-[#001d3d] text-[#c1121f]">W</th>
              <th className="p-2 text-[#c1121f]">L</th>
              <th className="p-2 text-[#c1121f]">SV</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat, idx) => {
              const player = players.find(p => Number(p.id) === Number(stat.playerId));
              return (
                <tr key={idx} className="border-b border-slate-200 hover:bg-[#fdf0d5] transition-colors">
                  <td className="p-2 text-left font-black uppercase text-xs truncate max-w-[120px]">{player?.name || 'Unknown'}</td>
                  
                  {['ab', 'r', 'h', 'd2b', 'd3b', 'hr', 'rbi', 'bb', 'k'].map(f => (
                    <td key={f} className="p-1">
                      <select value={stat[f]} onChange={(e) => handleStatChange(type, idx, f, e.target.value)} className="w-12 p-1 text-center font-bold text-sm bg-white border border-slate-300 outline-none">{statOptions}</select>
                    </td>
                  ))}
                  
                  {['ip', 'ph', 'pr', 'per', 'pbb', 'pk', 'phr', 'winCount', 'lossCount', 'saveCount'].map((f, pi) => (
                    <td key={f} className={`p-1 ${pi === 0 || pi === 7 ? 'border-l-2 border-[#001d3d]' : ''}`}>
                      <select 
                        value={stat[f]} 
                        onChange={(e) => handleStatChange(type, idx, f, e.target.value)} 
                        className={`w-14 p-1 text-center font-bold text-sm bg-white border border-slate-300 outline-none ${pi >= 7 ? 'text-[#c1121f] bg-red-50' : ''}`}
                      >
                        {f === 'ip' ? ipOptions : (f.includes('Count') ? booleanOptions : statOptions)}
                      </select>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}