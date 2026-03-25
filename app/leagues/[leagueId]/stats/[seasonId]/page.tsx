'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function SeasonStatsPage() {
  const { leagueId, seasonId } = useParams();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We'll use your existing global stats logic but pass the seasonId as a filter
    fetch(`/api/public/stats/global?seasonId=${seasonId}`)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      });
  }, [seasonId]);

  if (loading) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black italic text-white text-5xl animate-pulse">CALCULATING LEADERS...</div>;

  return (
    <div className="min-h-screen bg-[#001d3d] text-white p-8 border-[16px] border-[#ffd60a]">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 border-b-4 border-[#c1121f] pb-6 flex justify-between items-end">
          <div>
            <Link href={`/leagues/${leagueId}/stats`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white transition-colors">
              ← Back to Archives
            </Link>
            <h1 className="text-6xl font-black italic uppercase tracking-tighter mt-2">{stats.seasonName || "Season Stats"}</h1>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
          {/* Batting Leaders Table */}
          <section className="bg-black/20 p-6 border-2 border-white/5 rounded-3xl">
             <h2 className="text-2xl font-black italic uppercase text-[#ffd60a] mb-6">Batting Leaders</h2>
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                 <thead className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/10">
                   <tr>
                     <th className="pb-4">Player</th>
                     <th className="pb-4 text-center">AVG</th>
                     <th className="pb-4 text-center">HR</th>
                     <th className="pb-4 text-center">RBI</th>
                     <th className="pb-4 text-center">OPS</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {stats.batting?.slice(0, 15).map((p: any) => (
                     <tr key={p.id} className="hover:bg-white/5 transition-colors">
                       <td className="py-4 font-black italic uppercase">{p.name}</td>
                       <td className="py-4 text-center font-mono">{p.avg}</td>
                       <td className="py-4 text-center font-black text-red-500">{p.hr}</td>
                       <td className="py-4 text-center font-bold">{p.rbi}</td>
                       <td className="py-4 text-center font-black text-[#ffd60a]">{p.ops}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </section>

          {/* Pitching Leaders Table */}
          <section className="bg-black/20 p-6 border-2 border-white/5 rounded-3xl">
             <h2 className="text-2xl font-black italic uppercase text-[#669bbc] mb-6">Pitching Leaders</h2>
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                 <thead className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/10">
                   <tr>
                     <th className="pb-4">Player</th>
                     <th className="pb-4 text-center">ERA</th>
                     <th className="pb-4 text-center">W-L</th>
                     <th className="pb-4 text-center">K</th>
                     <th className="pb-4 text-center">WHIP</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {stats.pitching?.slice(0, 15).map((p: any) => (
                     <tr key={p.id} className="hover:bg-white/5 transition-colors">
                       <td className="py-4 font-black italic uppercase">{p.name}</td>
                       <td className="py-4 text-center font-black text-[#669bbc]">{p.era}</td>
                       <td className="py-4 text-center font-mono">{p.w}-{p.l}</td>
                       <td className="py-4 text-center font-bold">{p.k}</td>
                       <td className="py-4 text-center font-mono">{p.whip}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}