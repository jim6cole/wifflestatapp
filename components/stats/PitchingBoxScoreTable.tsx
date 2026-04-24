"use client";
import Link from "next/link"; // Make sure to import Link

export default function PitchingBoxScoreTable({ stats, teamName }: any) {
  // Helper to format: Cole, J.
  const formatNameWithInitial = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length <= 1) return fullName;
    const lastName = parts[parts.length - 1];
    const firstInitial = parts[0].charAt(0);
    return `${lastName}, ${firstInitial}.`;
  };

  const pitchStrikeDetails = stats.map((p: any) => `${formatNameWithInitial(p.name)} ${p.totalPitches}-${p.totalStrikes}`).join('; ');
  const goFoDetails = stats.map((p: any) => `${formatNameWithInitial(p.name)} ${p.groundOuts}-${p.flyOuts}`).join('; ');
  const bfDetails = stats.map((p: any) => `${formatNameWithInitial(p.name)} ${p.battersFaced}`).join('; ');

  return (
    <div className="bg-[#001d3d] text-slate-200 rounded-lg overflow-hidden shadow-xl border-4 border-[#001d3d] mb-8">
      <div className="p-3 md:p-4 border-b-4 border-[#669bbc] bg-[#001d3d]">
        <h2 className="font-black text-base md:text-lg uppercase tracking-wider text-[#669bbc] italic">{teamName} - Pitching</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-max">
          <thead className="text-slate-500 uppercase text-[8px] md:text-[9px] bg-[#001d3d] tracking-widest border-b border-white/10">
            <tr>
              <th className="px-2 py-2 md:px-4 md:py-3 sticky left-0 bg-[#001d3d] z-10 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">Pitcher</th>
              <th className="px-1 md:px-2 py-2 md:py-3 text-center">IP</th>
              <th className="px-1 md:px-2 py-2 md:py-3 text-center">H</th>
              <th className="px-1 md:px-2 py-2 md:py-3 text-center">R</th>
              <th className="px-1 md:px-2 py-2 md:py-3 text-center">ER</th>
              <th className="px-1 md:px-2 py-2 md:py-3 text-center">BB</th>
              <th className="px-1 md:px-2 py-2 md:py-3 text-center">K</th>
              <th className="px-1 md:px-2 py-2 md:py-3 text-center">HR</th>
              <th className="px-1 md:px-2 py-2 md:py-3 text-center text-[#669bbc]">WHIP</th>
              <th className="px-1 md:px-2 py-2 md:py-3 text-center text-[#c1121f] font-bold">ERA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-white/5">
            {stats.map((p: any) => (
              <tr key={p.id} className="hover:bg-white/10 transition-colors">
                <td className="px-2 py-1.5 md:px-4 md:py-3 sticky left-0 bg-[#001d3d] z-10 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                  <Link href={`/players/${p.id}`} className="font-black italic uppercase text-white hover:text-[#669bbc] transition-colors whitespace-nowrap">
                    {p.name}
                  </Link>
                  {p.decision && <span className="ml-1 md:ml-2 text-slate-400 font-bold uppercase italic text-[10px] md:text-xs">({p.decision}, {p.record})</span>}
                </td>
                <td className="px-1 md:px-2 py-1.5 md:py-3 text-center tabular-nums text-xs md:text-sm">{p.ip}</td>
                <td className="px-1 md:px-2 py-1.5 md:py-3 text-center tabular-nums text-xs md:text-sm">{p.h}</td>
                <td className="px-1 md:px-2 py-1.5 md:py-3 text-center tabular-nums text-xs md:text-sm">{p.r}</td>
                <td className="px-1 md:px-2 py-1.5 md:py-3 text-center tabular-nums text-xs md:text-sm">{p.er}</td>
                <td className="px-1 md:px-2 py-1.5 md:py-3 text-center tabular-nums text-[#ffd60a] font-bold text-xs md:text-sm">{p.bb}</td>
                <td className="px-1 md:px-2 py-1.5 md:py-3 text-center tabular-nums text-[#669bbc] font-bold text-xs md:text-sm">{p.k}</td>
                <td className="px-1 md:px-2 py-1.5 md:py-3 text-center tabular-nums text-[#c1121f] font-bold text-xs md:text-sm">{p.hr}</td>
                <td className="px-1 md:px-2 py-1.5 md:py-3 text-center tabular-nums text-slate-400 font-mono text-[10px] md:text-xs">{p.whip}</td>
                <td className="px-1 md:px-2 py-1.5 md:py-3 text-center font-black text-white font-mono text-[10px] md:text-xs">{p.era}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-black/20 p-3 md:p-5 text-[10px] md:text-[11px] font-bold uppercase italic space-y-1 md:space-y-1.5 text-slate-300 border-t border-white/5">
        <div className="text-[#669bbc] mb-1 font-black tracking-widest">Pitching Details</div>
        <p><span className="text-white mr-1 md:mr-2">Pitches-strikes:</span>{pitchStrikeDetails}.</p>
        <p><span className="text-white mr-1 md:mr-2">Groundouts-flyouts:</span>{goFoDetails}.</p>
        <p><span className="text-white mr-1 md:mr-2">Batters faced:</span>{bfDetails}.</p>
      </div>
    </div>
  );
}