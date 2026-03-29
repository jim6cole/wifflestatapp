"use client";

export default function PitchingBoxScoreTable({ stats, teamName, isSeasonStats = false }: any) {
  const formatLastName = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    return parts.length > 0 ? parts[parts.length - 1] : fullName;
  };

  return (
    <div className="bg-[#001d3d] rounded-lg overflow-hidden border-4 border-[#001d3d] mb-10 shadow-2xl">
      <div className="p-4 border-b-4 border-[#669bbc] bg-[#001d3d]">
        <h2 className="font-black text-lg uppercase text-[#669bbc] italic tracking-wider">
          {teamName} - Pitching
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[700px]">
          <thead className="text-slate-500 uppercase text-[9px] tracking-widest border-b border-white/10 bg-[#001d3d]">
            <tr>
              <th className="px-4 py-3 text-white">Pitcher</th>
              {/* Decision columns for Season Stats */}
              {isSeasonStats && <th className="px-2 py-3 text-center">W</th>}
              {isSeasonStats && <th className="px-2 py-3 text-center">L</th>}
              <th className="px-2 py-3 text-center">IP</th>
              <th className="px-2 py-3 text-center">H</th>
              <th className="px-2 py-3 text-center">R</th>
              <th className="px-2 py-3 text-center">ER</th>
              <th className="px-2 py-3 text-center">BB</th>
              <th className="px-2 py-3 text-center">K</th>
              <th className="px-2 py-3 text-center">HR</th>
              <th className="px-2 py-3 text-center text-[#669bbc]">WHIP</th>
              <th className="px-2 py-3 text-center text-[#c1121f] font-bold">ERA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-white/5">
            {stats.map((p: any, idx: number) => (
              <tr key={idx} className="hover:bg-white/10 transition-colors group">
                <td className="px-4 py-3 text-white font-black italic uppercase group-hover:text-[#ffd60a]">
                  {formatLastName(p.name)}
                  {!isSeasonStats && p.decision && (
                    <span className="ml-2 text-slate-500 text-[10px] lowercase">({p.decision}, {p.record})</span>
                  )}
                </td>
                {isSeasonStats && <td className="px-2 py-3 text-center tabular-nums font-bold text-green-500">{p.wins || 0}</td>}
                {isSeasonStats && <td className="px-2 py-3 text-center tabular-nums font-bold text-red-500">{p.losses || 0}</td>}
                <td className="px-2 py-3 text-center tabular-nums">{p.ip}</td>
                <td className="px-2 py-3 text-center tabular-nums">{p.h}</td>
                <td className="px-2 py-3 text-center tabular-nums">{p.r}</td>
                <td className="px-2 py-3 text-center tabular-nums">{p.er}</td>
                <td className="px-2 py-3 text-center tabular-nums">{p.bb}</td>
                <td className="px-2 py-3 text-center tabular-nums">{p.k}</td>
                <td className="px-2 py-3 text-center tabular-nums">{p.hr}</td>
                <td className="px-2 py-3 text-center tabular-nums font-black text-[#669bbc] text-[11px]">{p.whip}</td>
                <td className="px-2 py-3 text-center tabular-nums text-[#c1121f] font-black text-[11px]">{p.era}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}