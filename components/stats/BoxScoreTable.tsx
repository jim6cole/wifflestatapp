"use client";
import Link from "next/link"; // Make sure to import Link

interface HRDetail {
  batterName: string;
  pitcherName: string;
  inning: number;
  seasonTotal: number;
  runsScored: number;
}

export default function BoxScoreTable({ stats, teamName, hrDetails = [] }: any) {
  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const formatNameWithInitial = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length <= 1) return fullName;
    const lastName = parts[parts.length - 1];
    const firstInitial = parts[0].charAt(0);
    return `${lastName}, ${firstInitial}.`;
  };

  const formatList = (players: any[], statKey: string) => {
    return players
      .filter(p => Number(p[statKey]) > 0)
      .map(p => {
        const val = Number(p[statKey]);
        return val > 1 ? `${formatNameWithInitial(p.name)} ${val}` : formatNameWithInitial(p.name);
      })
      .join('; ');
  };

  // --- THE MLB-STYLE HR STRING ---
  const hrPlayers = stats.filter((p: any) => Number(p.hr) > 0);
  
  const hrString = hrPlayers.map((p: any) => {
    const playerHRs = hrDetails
      .filter((hr: HRDetail) => hr.batterName === p.name)
      .sort((a: any, b: any) => a.inning - b.inning);

    const formattedBatter = formatNameWithInitial(p.name);
    const gameTotal = Number(p.hr);
    const seasonTotal = playerHRs.length > 0 ? playerHRs[playerHRs.length - 1].seasonTotal : 0;
    
    const instances = playerHRs.map((hr: HRDetail) => {
      // Use runsScored for flawless type designation
      const runs = hr.runsScored || 1;
      const hrType = runs === 4 ? 'Grand Slam' : runs === 1 ? 'Solo' : `${runs}-Run`;
      return `${hrType} in the ${getOrdinal(hr.inning)} off ${formatNameWithInitial(hr.pitcherName)}`;
    }).join(', ');

    return `${formattedBatter} ${gameTotal} (${seasonTotal}, ${instances})`;
  }).join('; ');

  const doubles = formatList(stats, 'd');
  const triples = formatList(stats, 't');
  const rbis = formatList(stats, 'rbi');

  return (
    <div className="bg-[#001d3d] rounded-lg overflow-hidden border-4 border-[#001d3d] mb-10">
      <div className="p-3 md:p-4 border-b-4 border-[#c1121f]">
        <h2 className="font-black text-base md:text-lg uppercase text-[#ffd60a] italic">{teamName} - Batting</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-max">
          <thead className="text-slate-500 uppercase text-[8px] md:text-[9px] tracking-widest border-b border-white/10">
            <tr>
              <th className="px-2 py-2 md:px-4 md:py-3 text-white sticky left-0 bg-[#001d3d] z-10 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">Player</th>
              <th className="px-1 md:px-2 py-2 md:py-3 text-center">AB</th>
              <th className="px-1 md:px-2 py-2 md:py-3 text-center">R</th>
              <th className="px-1 md:px-2 py-2 md:py-3 text-center">H</th>
              <th className="px-1 md:px-2 py-2 md:py-3 text-center">RBI</th>
              <th className="px-1 md:px-2 py-2 md:py-3 text-center">BB</th>
              <th className="px-1 md:px-2 py-2 md:py-3 text-center">K</th>
              <th className="px-1 md:px-2 py-2 md:py-3 text-center text-[#ffd60a]">AVG</th>
              <th className="px-1 md:px-2 py-2 md:py-3 text-center text-[#c1121f] font-bold">OPS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {stats.map((player: any, idx: number) => (
              <tr key={idx} className="hover:bg-white/5">
                <td className="px-2 py-1.5 md:px-4 md:py-3 sticky left-0 bg-[#001d3d] z-10 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                  <Link href={`/players/${player.id}`} className="text-white font-black italic uppercase hover:text-[#ffd60a] transition-colors whitespace-nowrap">
                    {player.name}
                  </Link>
                </td>
                <td className="px-1 md:px-2 py-1.5 md:py-3 text-center tabular-nums text-xs md:text-sm">{player.ab}</td>
                <td className="px-1 md:px-2 py-1.5 md:py-3 text-center tabular-nums text-xs md:text-sm">{player.r}</td>
                <td className="px-1 md:px-2 py-1.5 md:py-3 text-center tabular-nums text-xs md:text-sm">{player.h}</td>
                <td className="px-1 md:px-2 py-1.5 md:py-3 text-center tabular-nums text-xs md:text-sm">{player.rbi}</td>
                <td className="px-1 md:px-2 py-1.5 md:py-3 text-center tabular-nums text-xs md:text-sm">{player.bb}</td>
                <td className="px-1 md:px-2 py-1.5 md:py-3 text-center tabular-nums text-xs md:text-sm">{player.k}</td>
                <td className="px-1 md:px-2 py-1.5 md:py-3 text-center tabular-nums text-[#ffd60a] font-black text-[10px] md:text-[11px]">{player.avg}</td>
                <td className="px-1 md:px-2 py-1.5 md:py-3 text-center tabular-nums font-black text-white text-[10px] md:text-[11px]">{player.ops}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-black/20 p-3 md:p-5 text-[10px] md:text-[11px] font-bold uppercase italic space-y-1 md:space-y-1.5 text-slate-300 border-t border-white/5">
        <div className="text-[#669bbc] mb-1 font-black tracking-widest">Batting Details</div>
        {doubles && <p><span className="text-white mr-1 md:mr-2">2B:</span>{doubles}</p>}
        {triples && <p><span className="text-white mr-1 md:mr-2">3B:</span>{triples}</p>}
        {hrString && <p><span className="text-white mr-1 md:mr-2">HR–</span>{hrString}</p>}
        {rbis && <p><span className="text-white mr-1 md:mr-2">RBI:</span>{rbis}</p>}
      </div>
    </div>
  );
}