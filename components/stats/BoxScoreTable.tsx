"use client";

interface HRDetail {
  batterName: string;
  pitcherName: string;
  inning: number;
  seasonTotal: number;
  runnersOn: number;
  outs: number;
}

export default function BoxScoreTable({ stats, teamName, hrDetails = [] }: any) {
  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const formatName = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length < 2) return fullName;
    const firstName = parts.shift();
    const lastName = parts.join(' ');
    return `${lastName}, ${firstName?.charAt(0)}`;
  };

  const formatList = (players: any[], statKey: string) => {
    return players
      .filter(p => Number(p[statKey]) > 0)
      .map(p => {
        const val = Number(p[statKey]);
        return val > 1 ? `${formatName(p.name)} ${val}` : formatName(p.name);
      })
      .join('; ');
  };

  const hrString = hrDetails.length > 0 
    ? hrDetails.map((hr: HRDetail) => {
        return `${formatName(hr.batterName)} (${hr.seasonTotal}, ${getOrdinal(hr.inning)} off ${formatName(hr.pitcherName)}, ${hr.runnersOn} on, ${hr.outs} out)`;
      }).join('; ') + '.'
    : formatList(stats, 'hr');

  const doubles = formatList(stats, 'd');
  const triples = formatList(stats, 't');
  const rbis = formatList(stats, 'rbi');
  const hasBattingDetails = doubles || triples || hrString || rbis;

  return (
    <div className="bg-[#001d3d] text-slate-200 rounded-lg overflow-hidden shadow-xl border-4 border-[#001d3d] flex flex-col h-full">
      <div className="p-4 border-b-4 border-[#c1121f] bg-[#001d3d]">
        <h2 className="font-black text-lg uppercase tracking-wider text-[#ffd60a] italic">{teamName} - Batting</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="text-slate-500 uppercase text-[9px] bg-[#001d3d] tracking-widest border-b border-white/10">
            <tr>
              <th className="px-4 py-3">Player</th>
              <th className="px-2 py-3 text-center">AB</th>
              <th className="px-2 py-3 text-center">R</th>
              <th className="px-2 py-3 text-center">H</th>
              <th className="px-2 py-3 text-center">RBI</th>
              <th className="px-2 py-3 text-center">BB</th>
              <th className="px-2 py-3 text-center">K</th>
              <th className="px-2 py-3 text-center text-[#ffd60a]">AVG</th>
              <th className="px-2 py-3 text-center text-[#c1121f] font-bold">OPS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-white/5">
            {stats.map((player: any, index: number) => (
              <tr key={index} className="hover:bg-white/10 transition-colors">
                <td className="px-4 py-3 text-white font-black italic uppercase">{player.name}</td>
                <td className="px-2 py-3 text-center tabular-nums">{player.ab}</td>
                <td className="px-2 py-3 text-center tabular-nums">{player.r}</td>
                <td className="px-2 py-3 text-center tabular-nums">{player.h}</td>
                <td className="px-2 py-3 text-center tabular-nums">{player.rbi}</td>
                <td className="px-2 py-3 text-center tabular-nums">{player.bb}</td>
                <td className="px-2 py-3 text-center tabular-nums">{player.k}</td>
                <td className="px-2 py-3 text-center tabular-nums text-[#ffd60a] font-black text-[11px]">{player.avg}</td>
                <td className="px-2 py-3 text-center tabular-nums font-black text-white font-mono text-[11px]">{player.ops}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasBattingDetails && (
        <div className="bg-[#001d3d] border-t-4 border-[#c1121f] p-5 text-sm leading-relaxed text-slate-300">
          <h3 className="font-black text-[10px] text-white uppercase tracking-widest mb-3 border-b border-white/10 pb-2 italic">Batting Details</h3>
          <div className="space-y-1.5 text-xs">
            {doubles && <p><span className="font-bold text-[#ffd60a] mr-2 italic">2B:</span>{doubles}</p>}
            {triples && <p><span className="font-bold text-[#ffd60a] mr-2 italic">3B:</span>{triples}</p>}
            {hrString && <p><span className="font-bold text-[#c1121f] mr-2 italic">HR:</span>{hrString}</p>}
            {rbis && <p><span className="font-bold text-white mr-2 italic">RBI:</span>{rbis}</p>}
          </div>
        </div>
      )}
    </div>
  );
}