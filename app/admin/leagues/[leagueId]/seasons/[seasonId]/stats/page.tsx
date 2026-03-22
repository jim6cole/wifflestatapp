'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function SeasonLeaderboard({ params }: { params: Promise<{ leagueId: string, seasonId: string }> }) {
  const { leagueId, seasonId } = use(params);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // The single, cache-busting fetch inside the useEffect
    fetch(`/api/admin/seasons/${seasonId}/stats`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setStats(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load stats:", err);
        setLoading(false);
      });
  }, [seasonId]);

  if (loading) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black uppercase text-white animate-pulse italic text-2xl">Calculating Leaderboard...</div>;

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] font-sans p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-12 border-b-4 border-[#669bbc] pb-8 flex justify-between items-end">
          <div>
            <Link href={`/admin/leagues/${leagueId}/seasons/${seasonId}`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white mb-4 block">
              ← Back to Terminal
            </Link>
            <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f]">
              Leaderboard
            </h1>
            <p className="text-[#669bbc] font-bold uppercase text-xs tracking-[0.4em] mt-2 italic">
              Season #{seasonId} Official Statistics
            </p>
          </div>
        </header>

        {stats.length === 0 ? (
          <div className="bg-[#003566] border-2 border-dashed border-[#669bbc] p-20 text-center opacity-50">
            <p className="text-2xl font-black uppercase italic">No Stats Recorded</p>
            <p className="text-sm font-bold mt-2">Score some games in the Live Scorer to populate this board.</p>
          </div>
        ) : (
          <div className="bg-[#003566] border-2 border-[#669bbc] shadow-2xl overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#c1121f] text-white border-b-4 border-[#001d3d]">
                  <th className="p-4 font-black italic uppercase tracking-widest">Player</th>
                  <th className="p-4 font-black italic uppercase text-center text-[#fdf0d5]/70">PA</th>
                  <th className="p-4 font-black italic uppercase text-center text-[#fdf0d5]/70">AB</th>
                  <th className="p-4 font-black italic uppercase text-center">H</th>
                  <th className="p-4 font-black italic uppercase text-center">HR</th>
                  <th className="p-4 font-black italic uppercase text-center text-[#fdf0d5]/70">BB</th>
                  <th className="p-4 font-black italic uppercase text-center text-[#fdf0d5]/70">K</th>
                  <th className="p-4 font-black italic uppercase text-center text-white text-xl drop-shadow-md">AVG</th>
                  <th className="p-4 font-black italic uppercase text-center text-white text-xl drop-shadow-md">OPS</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#001d3d]">
                {stats.map((player, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold uppercase text-lg text-white whitespace-nowrap">
                      <span className="text-[#669bbc] font-black text-[10px] mr-3">{idx + 1}.</span> 
                      {player.name}
                    </td>
                    <td className="p-4 text-center font-bold text-[#669bbc]">{player.pa}</td>
                    <td className="p-4 text-center font-bold text-[#669bbc]">{player.ab}</td>
                    <td className="p-4 text-center font-bold text-white">{player.h}</td>
                    <td className="p-4 text-center font-bold text-white">{player.hr}</td>
                    <td className="p-4 text-center font-bold text-slate-400">{player.bb}</td>
                    <td className="p-4 text-center font-bold text-red-400">{player.k}</td>
                    
                    {/* The "Hero" Stats */}
                    <td className="p-4 text-center font-black italic text-xl text-[#ffd60a]">{player.avg}</td>
                    <td className="p-4 text-center font-black italic text-xl text-[#ffd60a]">{player.ops}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}