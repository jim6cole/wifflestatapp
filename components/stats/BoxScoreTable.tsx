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

  const formatLastName = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    return parts.length > 0 ? parts[parts.length - 1] : fullName;
  };

  const formatList = (players: any[], statKey: string) => {
    return players
      .filter(p => Number(p[statKey]) > 0)
      .map(p => {
        const val = Number(p[statKey]);
        return val > 1 ? `${formatLastName(p.name)} ${val}` : formatLastName(p.name);
      })
      .join('; ');
  };

  // --- THE MLB-STYLE HR STRING ---
  const hrPlayers = stats.filter((p: any) => Number(p.hr) > 0);
  
  const hrString = hrPlayers.map((p: any) => {
    const playerHRs = hrDetails
      .filter((hr: HRDetail) => hr.batterName === p.name)
      .sort((a: any, b: any) => a.inning - b.inning); // Ensure they list chronologically

    const lastName = formatLastName(p.name);
    const gameTotal = Number(p.hr);
    
    // Get the season total after the final HR of this game
    const seasonTotal = playerHRs.length > 0 ? playerHRs[playerHRs.length - 1].seasonTotal : 0;
    
    // Format individual instances: 1st inning off Gausman 0 on 0 out
    const instances = playerHRs.map((hr: HRDetail) => 
      `${getOrdinal(hr.inning)} inning off ${formatLastName(hr.pitcherName)} ${hr.runnersOn} on ${hr.outs} out`
    ).join(',');

    return `${lastName} ${gameTotal} (${seasonTotal},${instances})`;
  }).join('; ');

  const doubles = formatList(stats, 'd');
  const triples = formatList(stats, 't');
  const rbis = formatList(stats, 'rbi');

  return (
    <div className="bg-[#001d3d] rounded-lg overflow-hidden border-4 border-[#001d3d] mb-10">
      <div className="p-4 border-b-4 border-[#c1121f]">
        <h2 className="font-black text-lg uppercase text-[#ffd60a] italic">{teamName} - Batting</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="text-slate-500 uppercase text-[9px] tracking-widest border-b border-white/10">
            <tr>
              <th className="px-4 py-3 text-white">Player</th>
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
          <tbody className="divide-y divide-white/5">
            {stats.map((player: any, idx: number) => (
              <tr key={idx} className="hover:bg-white/5">
                <td className="px-4 py-3 text-white font-black italic uppercase">{player.name}</td>
                <td className="px-2 py-3 text-center tabular-nums">{player.ab}</td>
                <td className="px-2 py-3 text-center tabular-nums">{player.r}</td>
                <td className="px-2 py-3 text-center tabular-nums">{player.h}</td>
                <td className="px-2 py-3 text-center tabular-nums">{player.rbi}</td>
                <td className="px-2 py-3 text-center tabular-nums">{player.bb}</td>
                <td className="px-2 py-3 text-center tabular-nums">{player.k}</td>
                <td className="px-2 py-3 text-center tabular-nums text-[#ffd60a] font-black text-[11px]">{player.avg}</td>
                <td className="px-2 py-3 text-center tabular-nums font-black text-white text-[11px]">{player.ops}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-black/20 p-5 text-[11px] font-bold uppercase italic space-y-1.5 text-slate-300 border-t border-white/5">
        <div className="text-[#669bbc] mb-1 font-black tracking-widest">Batting Details</div>
        {doubles && <p><span className="text-white mr-2">2B:</span>{doubles}</p>}
        {triples && <p><span className="text-white mr-2">3B:</span>{triples}</p>}
        {hrString && <p><span className="text-white mr-2">HR–</span>{hrString}</p>}
        {rbis && <p><span className="text-white mr-2">RBI:</span>{rbis}</p>}
      </div>
    </div>
  );
}