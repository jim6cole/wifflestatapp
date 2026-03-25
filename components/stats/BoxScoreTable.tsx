"use client";

interface PlayerStats {
  id: number;
  name: string;
  slot: number;
  position?: string;
  ab: number;
  r: number;
  h: number;
  d: number;
  t: number;
  hr: number;
  bb: number;
  k: number;
  rbi: number;
  tb: number;
  avg: string;
  ops: string;
}

interface BoxScoreProps {
  stats: PlayerStats[];
  teamName: string;
  isAdmin: boolean;
  onPlayerClick?: (player: { id: number; name: string }) => void;
}

export default function BoxScoreTable({ 
  stats, 
  teamName, 
  isAdmin, 
  onPlayerClick 
}: BoxScoreProps) {
  
  // Helper to map full positions to abbreviations
  const getPosAbbr = (pos?: string) => {
    if (!pos) return '';
    if (pos === 'Fielder') return 'F';
    if (pos === 'Pitcher') return 'P';
    return pos; 
  };

  // Calculate Team Totals
  const totals = stats.reduce((acc, curr) => ({
    ab: acc.ab + curr.ab,
    r: acc.r + curr.r,
    h: acc.h + curr.h,
    rbi: acc.rbi + curr.rbi,
    bb: acc.bb + curr.bb,
    k: acc.k + curr.k
  }), { ab: 0, r: 0, h: 0, rbi: 0, bb: 0, k: 0 });

  // Helper to format the detail lists (e.g. "T. Edman 2; F. Freeman")
  const formatList = (players: PlayerStats[], statKey: keyof PlayerStats) => {
    return players
      .filter(p => Number(p[statKey]) > 0)
      .map(p => {
        const val = Number(p[statKey]);
        return val > 1 ? `${p.name} ${val}` : p.name;
      })
      .join('; ');
  };

  // Generate Roundup Data
  const doubles = formatList(stats, 'd');
  const triples = formatList(stats, 't');
  const homeRuns = formatList(stats, 'hr');
  const rbis = formatList(stats, 'rbi');
  const totalBases = formatList(stats, 'tb');
  
  const hasBattingDetails = doubles || triples || homeRuns || totalBases || rbis;

  return (
    <div className="bg-[#0f172a] text-slate-200 rounded-lg overflow-hidden shadow-xl border border-slate-800 flex flex-col h-full">
      <div className="p-4 border-b border-slate-800 bg-[#1e293b] flex justify-between items-center">
        <h2 className="font-black text-lg uppercase tracking-wider text-[#ffd60a]">
          {teamName} - Batting
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="text-slate-500 uppercase text-[9px] bg-[#0f172a] tracking-widest border-b border-slate-800">
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
          <tbody className="divide-y divide-slate-800/50">
            {stats.map((player, index) => {
              const isSub = index > 0 && stats[index - 1].slot === player.slot;
              const posAbbr = getPosAbbr(player.position);

              return (
                <tr 
                  key={`${player.id}-${player.slot}-${index}`} 
                  className={`transition-colors group ${
                    isSub ? 'bg-slate-900/40' : 'hover:bg-slate-800/30'
                  } ${isAdmin ? 'cursor-pointer hover:bg-blue-900/20' : ''}`}
                  onClick={() => isAdmin && onPlayerClick?.({ id: player.id, name: player.name })}
                >
                  <td className={`px-4 py-3 transition-all ${
                    isSub ? 'pl-10 text-slate-400 italic' : 'text-white font-semibold'
                  }`}>
                    <div className="flex items-center gap-2">
                      {isSub && (
                        <span className="text-[#669bbc] font-black group-hover:translate-x-1 transition-transform">
                          ↳
                        </span>
                      )}
                      <span>
                        {player.name}
                        {posAbbr && (
                          <span className={`ml-2 text-[9px] uppercase tracking-widest font-black ${isSub ? 'text-slate-500' : 'text-[#669bbc]'}`}>
                            {posAbbr}
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center tabular-nums">{player.ab}</td>
                  <td className="px-2 py-3 text-center tabular-nums">{player.r}</td>
                  <td className="px-2 py-3 text-center tabular-nums">{player.h}</td>
                  <td className="px-2 py-3 text-center tabular-nums font-medium">{player.rbi}</td>
                  <td className="px-2 py-3 text-center tabular-nums text-green-700/70">{player.bb}</td>
                  <td className="px-2 py-3 text-center tabular-nums text-red-500/70">{player.k}</td>
                  <td className="px-2 py-3 text-center tabular-nums text-slate-400 font-mono text-[11px]">
                    {player.avg}
                  </td>
                  <td className="px-2 py-3 text-center tabular-nums font-black text-white/90 font-mono text-[11px]">
                    {player.ops}
                  </td>
                </tr>
              );
            })}
            
            {/* TEAM TOTALS ROW */}
            <tr className="bg-[#1e293b] font-bold border-t-2 border-slate-700">
              <td className="px-4 py-3 text-white uppercase tracking-wider text-xs">Totals</td>
              <td className="px-2 py-3 text-center tabular-nums text-white">{totals.ab}</td>
              <td className="px-2 py-3 text-center tabular-nums text-white">{totals.r}</td>
              <td className="px-2 py-3 text-center tabular-nums text-white">{totals.h}</td>
              <td className="px-2 py-3 text-center tabular-nums text-white">{totals.rbi}</td>
              <td className="px-2 py-3 text-center tabular-nums text-white">{totals.bb}</td>
              <td className="px-2 py-3 text-center tabular-nums text-white">{totals.k}</td>
              <td className="px-2 py-3 text-center"></td>
              <td className="px-2 py-3 text-center"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* DETAIL ROUNDUP SECTION (Sticks to the bottom) */}
      {hasBattingDetails && (
        <div className="bg-[#0f172a] border-t-4 border-slate-800 p-5 text-sm leading-relaxed text-slate-300 mt-auto">
          <h3 className="font-black text-[10px] text-white uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">Batting Details</h3>
          
          <div className="space-y-1.5 text-xs">
            {doubles && (
              <p><span className="font-bold text-white mr-2">2B:</span>{doubles}</p>
            )}
            {triples && (
              <p><span className="font-bold text-white mr-2">3B:</span>{triples}</p>
            )}
            {homeRuns && (
              <p><span className="font-bold text-white mr-2">HR:</span>{homeRuns}</p>
            )}
            {totalBases && (
              <p><span className="font-bold text-white mr-2">TB:</span>{totalBases}</p>
            )}
            {rbis && (
              <p><span className="font-bold text-white mr-2">RBI:</span>{rbis}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}