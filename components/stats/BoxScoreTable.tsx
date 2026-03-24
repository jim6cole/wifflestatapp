"use client";

interface PlayerStats {
  id: number;
  name: string;
  slot: number; // Used to identify substitutes
  ab: number;
  h: number;
  d: number;
  t: number;
  hr: number;
  bb: number;
  rbi: number;
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
  
  return (
    <div className="bg-[#0f172a] text-slate-200 rounded-lg overflow-hidden shadow-xl border border-slate-800">
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
              <th className="px-2 py-3 text-center">H</th>
              <th className="px-2 py-3 text-center">2B</th>
              <th className="px-2 py-3 text-center">3B</th>
              <th className="px-2 py-3 text-center">HR</th>
              <th className="px-2 py-3 text-center">BB</th>
              <th className="px-2 py-3 text-center">RBI</th>
              <th className="px-2 py-3 text-center text-[#ffd60a]">AVG</th>
              <th className="px-2 py-3 text-center text-[#c1121f] font-bold">OPS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {stats.map((player, index) => {
              // LOGIC: If this player's slot is the same as the person above them, they are a substitute
              const isSub = index > 0 && stats[index - 1].slot === player.slot;

              return (
                <tr 
                  key={`${player.id}-${player.slot}`} 
                  className={`transition-colors group ${
                    isSub ? 'bg-slate-900/40' : 'hover:bg-slate-800/30'
                  } ${isAdmin ? 'cursor-pointer hover:bg-blue-900/20' : ''}`}
                  onClick={() => isAdmin && onPlayerClick?.({ id: player.id, name: player.name })}
                >
                  <td className={`px-4 py-3 font-semibold transition-all ${
                    isSub ? 'pl-10 text-slate-400 italic text-xs' : 'text-white'
                  }`}>
                    <div className="flex items-center gap-2">
                      {isSub && (
                        <span className="text-[#669bbc] font-black group-hover:translate-x-1 transition-transform">
                          ↳
                        </span>
                      )}
                      {player.name}
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center tabular-nums">{player.ab}</td>
                  <td className="px-2 py-3 text-center tabular-nums">{player.h}</td>
                  <td className="px-2 py-3 text-center tabular-nums text-slate-500">{player.d}</td>
                  <td className="px-2 py-3 text-center tabular-nums text-slate-500">{player.t}</td>
                  <td className={`px-2 py-3 text-center tabular-nums font-bold ${
                    player.hr > 0 ? 'text-[#c1121f]' : 'text-slate-500'
                  }`}>
                    {player.hr}
                  </td>
                  <td className="px-2 py-3 text-center tabular-nums text-green-700/70">{player.bb}</td>
                  <td className="px-2 py-3 text-center tabular-nums font-medium">{player.rbi}</td>
                  <td className="px-2 py-3 text-center tabular-nums text-slate-400 font-mono text-[11px]">
                    {player.avg}
                  </td>
                  <td className="px-2 py-3 text-center tabular-nums font-black text-white/90 font-mono text-[11px]">
                    {player.ops}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}