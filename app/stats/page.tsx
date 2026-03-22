'use client';
import { useState, useEffect } from 'react';

export default function StatsPage() {
  const [playerStats, setPlayerStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cache busted to ensure fresh stats every time!
    fetch('/api/stats/players', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setPlayerStats(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load stats:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center font-black uppercase text-white animate-pulse italic text-2xl">Calculating League Leaders...</div>;

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto bg-black min-h-screen text-white">
      <h1 className="text-4xl font-black italic mb-8 uppercase tracking-tighter border-b-4 border-blue-600 inline-block">
        League Leaders
      </h1>

      {playerStats.length === 0 ? (
        <div className="bg-slate-900 border-2 border-dashed border-slate-700 p-20 text-center opacity-50 rounded-xl">
          <p className="text-2xl font-black uppercase italic">No Stats Recorded</p>
          <p className="text-sm font-bold mt-2">Data will appear here once games are scored.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-slate-900 rounded-xl border border-slate-800 shadow-2xl">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-slate-800 text-slate-400 text-xs uppercase tracking-widest">
                <th className="p-4 font-black italic">Player</th>
                <th className="p-4 font-black italic">Team</th>
                <th className="p-4 text-center font-black italic">AB</th>
                <th className="p-4 text-center font-black italic">H</th>
                <th className="p-4 text-center font-black italic">HR</th>
                <th className="p-4 text-center font-black italic">RBI</th>
                <th className="p-4 text-right text-blue-400 font-black italic">AVG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {playerStats.map((p, index) => (
                <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-bold uppercase">
                    <span className="text-slate-500 mr-2 text-sm">{index + 1}.</span>
                    {p.name}
                  </td>
                  <td className="p-4 text-sm font-bold text-slate-400 uppercase">{p.teamName}</td>
                  <td className="p-4 text-center font-bold">{p.stats.ab}</td>
                  <td className="p-4 text-center font-bold text-white">{p.stats.hits}</td>
                  <td className="p-4 text-center font-bold text-white">{p.stats.hr}</td>
                  <td className="p-4 text-center font-bold">{p.stats.rbi}</td>
                  <td className="p-4 text-right font-black italic text-blue-400 text-xl drop-shadow-md">
                    {p.stats.avg}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}