'use client';
import { useState, useEffect } from 'react';

export default function StatsPage() {
  const [playerStats, setPlayerStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats/players')
      .then(res => res.json())
      .then(data => {
        setPlayerStats(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-10 text-center text-white">Calculating League Leaders...</div>;

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto bg-black min-h-screen text-white">
      <h1 className="text-4xl font-black italic mb-8 uppercase tracking-tighter border-b-4 border-blue-600 inline-block">
        League Leaders
      </h1>

      <div className="overflow-x-auto bg-slate-900 rounded-xl border border-slate-800 shadow-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-800 text-slate-400 text-xs uppercase tracking-widest">
              <th className="p-4">Player</th>
              <th className="p-4">Team</th>
              <th className="p-4 text-center">AB</th>
              <th className="p-4 text-center">H</th>
              <th className="p-4 text-center">HR</th>
              <th className="p-4 text-center">RBI</th>
              <th className="p-4 text-right text-blue-400">AVG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {playerStats.map((p, index) => (
              <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4 font-bold">
                  <span className="text-slate-500 mr-2 text-sm">{index + 1}.</span>
                  {p.name}
                </td>
                <td className="p-4 text-sm text-slate-400 uppercase">{p.teamName}</td>
                <td className="p-4 text-center">{p.stats.ab}</td>
                <td className="p-4 text-center">{p.stats.hits}</td>
                <td className="p-4 text-center">{p.stats.hr}</td>
                <td className="p-4 text-center">{p.stats.rbi}</td>
                <td className="p-4 text-right font-black text-blue-400 text-lg">
                  {p.stats.avg}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}