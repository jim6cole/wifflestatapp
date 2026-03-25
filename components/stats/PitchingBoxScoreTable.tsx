"use client";

export default function PitchingBoxScoreTable({ stats, teamName }: any) {
  return (
    <div className="bg-[#001d3d] text-slate-200 rounded-lg overflow-hidden shadow-xl border-4 border-[#001d3d]">
      <div className="p-4 border-b-4 border-[#669bbc] bg-[#001d3d]">
        <h2 className="font-black text-lg uppercase tracking-wider text-[#669bbc] italic">{teamName} - Pitching</h2>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="text-slate-500 uppercase text-[9px] bg-[#001d3d] tracking-widest border-b border-white/10">
          <tr>
            <th className="px-4 py-3">Pitcher</th>
            <th className="px-2 py-3 text-center">IP</th>
            <th className="px-2 py-3 text-center">H</th>
            <th className="px-2 py-3 text-center">R</th>
            <th className="px-2 py-3 text-center">BB</th>
            <th className="px-2 py-3 text-center">K</th>
            <th className="px-2 py-3 text-center">HR</th>
            <th className="px-2 py-3 text-center text-[#669bbc]">WHIP</th>
            <th className="px-2 py-3 text-center text-[#c1121f] font-bold">ERA</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 bg-white/5">
          {stats.map((p: any) => (
            <tr key={p.id} className="hover:bg-white/10 transition-colors">
              <td className="px-4 py-3 font-black italic uppercase text-white">{p.name}</td>
              <td className="px-2 py-3 text-center tabular-nums">{p.ip}</td>
              <td className="px-2 py-3 text-center tabular-nums">{p.h}</td>
              <td className="px-2 py-3 text-center tabular-nums">{p.r}</td>
              <td className="px-2 py-3 text-center tabular-nums text-[#ffd60a] font-bold">{p.bb}</td>
              <td className="px-2 py-3 text-center tabular-nums text-[#669bbc] font-bold">{p.k}</td>
              <td className="px-2 py-3 text-center tabular-nums text-[#c1121f] font-bold">{p.hr}</td>
              <td className="px-2 py-3 text-center tabular-nums text-slate-400 font-mono text-xs">{p.whip}</td>
              <td className="px-2 py-3 text-center font-black text-white font-mono text-xs">{p.era}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}