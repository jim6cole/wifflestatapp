'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StatCorrectionPage({ params }: { params: Promise<{ gameId: string, leagueId: string, seasonId: string }> }) {
  const { gameId, leagueId, seasonId } = use(params);
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/admin/games/${gameId}/history`)
      .then(res => res.json())
      .then(data => {
        if (!data || data.error) {
          console.error("API Error:", data?.error);
          setGame(null);
        } else {
          setGame(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch Error:", err);
        setLoading(false);
      });
  }, [gameId]);

  const handleUpdate = async (atBatId: number, result: string, runs: string) => {
    const res = await fetch(`/api/admin/at-bats/${atBatId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result, runsScored: runs })
    });
    if (res.ok) {
      const updated = await res.json();
      setGame((prev: any) => ({
        ...prev,
        homeScore: updated.updatedGame.homeScore,
        awayScore: updated.updatedGame.awayScore
      }));
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#001d3d] flex items-center justify-center">
      <div className="text-white font-black italic animate-pulse text-4xl uppercase tracking-tighter">Vault Accessing...</div>
    </div>
  );

  if (!game) return (
    <div className="min-h-screen bg-[#001d3d] flex flex-col items-center justify-center p-12 border-[16px] border-[#c1121f]">
      <h1 className="text-5xl font-black italic uppercase text-white mb-6">Record Not Found</h1>
      <Link href={`/admin/leagues/${leagueId}/seasons/${seasonId}/history`} className="bg-[#c1121f] text-white px-8 py-4 font-black uppercase italic shadow-[6px_6px_0px_#000]">Return to Archives</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#001d3d] text-white p-4 md:p-12 border-[16px] border-[#c1121f]">
      <div className="max-w-5xl mx-auto">
        
        <header className="mb-12 border-b-8 border-[#ffd60a] pb-6">
          <Link href={`/admin/leagues/${leagueId}/seasons/${seasonId}/history`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-[0.3em] hover:text-[#ffd60a] transition-colors mb-4 block">
            ← Back to Archive
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none">Stat Audit</h1>
              <p className="text-[#ffd60a] font-bold uppercase text-xs tracking-[0.5em] mt-2 italic">Official Review // ID: {gameId}</p>
            </div>
            <div className="bg-white text-[#001d3d] p-6 border-4 border-[#c1121f] shadow-[8px_8px_0px_#ffd60a] text-right">
              <p className="text-[10px] font-black uppercase text-[#669bbc]">Adjusted Scoreboard</p>
              <p className="text-5xl font-black italic leading-none mt-1">{game.awayScore} - {game.homeScore}</p>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          {!game.atBats || game.atBats.length === 0 ? (
            <div className="bg-black/30 border-4 border-dashed border-[#669bbc] p-20 text-center">
              <p className="text-2xl font-black italic uppercase text-white/20 tracking-widest">No plays recorded for this matchup.</p>
            </div>
          ) : (
            game.atBats.map((ab: any, idx: number) => (
              <div key={ab.id} className="bg-white border-4 border-[#c1121f] p-6 flex flex-col md:flex-row justify-between items-center text-[#001d3d] shadow-[10px_10px_0px_#000]">
                <div className="flex gap-6 items-center">
                  <span className="text-4xl font-black italic text-[#669bbc]/20">#{idx + 1}</span>
                  <div>
                    {/* INNING & OUTS BADGES */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-[#001d3d] text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-tighter border border-[#c1121f]">
                        INN {ab.inning || '?'}
                      </span>
                      <span className="bg-[#ffd60a] text-[#001d3d] text-[9px] font-black px-2 py-0.5 uppercase tracking-tighter border border-[#001d3d]">
                        {ab.outs || 0} {ab.outs === 1 ? 'OUT' : 'OUTS'}
                      </span>
                    </div>

                   <p className="text-[10px] font-black uppercase text-[#c1121f]">{ab.isTopInning ? 'Away' : 'Home'}</p>
                    <p className="text-3xl font-black italic uppercase leading-none">{ab.batter?.name || 'Unknown'}</p>
                    <p className="text-[10px] font-bold uppercase text-slate-400 mt-1 italic">vs {ab.pitcher?.name || 'Unknown'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-6 md:mt-0">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black uppercase mb-1 tracking-widest text-[#669bbc]">Result</label>
                    <select 
                      defaultValue={ab.result} 
                      onChange={(e) => handleUpdate(ab.id, e.target.value, ab.runsScored)}
                      className="bg-[#fdf0d5] border-2 border-[#001d3d] p-3 font-black uppercase text-sm outline-none focus:border-[#ffd60a]"
                    >
                      <option value="SINGLE">Single</option>
                      <option value="DOUBLE">Double</option>
                      <option value="TRIPLE">Triple</option>
                      <option value="HR">Home Run</option>
                      <option value="OUT">Out</option>
                      <option value="K">Strikeout</option>
                      <option value="WALK">Walk</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-[10px] font-black uppercase mb-1 tracking-widest text-[#669bbc]">Runs</label>
                    <input 
                      type="number" 
                      defaultValue={ab.runsScored} 
                      onBlur={(e) => handleUpdate(ab.id, ab.result, e.target.value)}
                      className="w-20 bg-[#fdf0d5] border-2 border-[#001d3d] p-3 font-black text-center text-sm outline-none focus:border-[#ffd60a]"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}