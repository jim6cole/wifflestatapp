"use client";

export default function PitchingBoxScoreTable({ stats, teamName }: any) {
  return (
    <div className="bg-[#0f172a] text-slate-200 rounded-lg overflow-hidden shadow-xl border border-slate-800">
      <div className="p-4 border-b border-slate-800 bg-[#1e293b]">
        <h2 className="font-black text-lg uppercase tracking-wider text-[#669bbc]">{teamName} - Pitching</h2>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="text-slate-500 uppercase text-[9px] bg-[#0f172a] tracking-widest border-b border-slate-800">
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
        <tbody className="divide-y divide-slate-800">
          {stats.map((p: any) => (
            <tr key={p.id} className="hover:bg-slate-800/50">
              <td className="px-4 py-3 font-semibold text-white">{p.name}</td>
              <td className="px-2 py-3 text-center">{p.ip}</td>
              <td className="px-2 py-3 text-center">{p.h}</td>
              <td className="px-2 py-3 text-center">{p.r}</td>
              <td className="px-2 py-3 text-center text-green-600">{p.bb}</td>
              <td className="px-2 py-3 text-center text-[#669bbc]">{p.k}</td>
              <td className="px-2 py-3 text-center text-red-400">{p.hr}</td>
              <td className="px-2 py-3 text-center text-slate-400">{p.whip}</td>
              <td className="px-2 py-3 text-center font-bold">{p.era}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}