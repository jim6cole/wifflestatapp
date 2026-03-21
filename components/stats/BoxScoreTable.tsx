"use client";

interface PlayerStats {
  id: number;
  name: string;
  ab: number;
  r: number;
  h: number;
  rbi: number;
  bb: number;
  k: number;
  tb: number; // Total Bases for SLG
}

interface BoxScoreProps {
  stats: PlayerStats[];
  teamName: string;
  isAdmin: boolean;
  gameId: string;
  // This is the "handshake" to the parent page
  onPlayerClick?: (player: { id: number; name: string }) => void;
}

export default function BoxScoreTable({ 
  stats, 
  teamName, 
  isAdmin, 
  gameId,
  onPlayerClick 
}: BoxScoreProps) {
  
  const calculateAVG = (h: number, ab: number) => 
    (ab > 0 ? (h / ab).toFixed(3).replace(/^0/, '') : '.000');
  
  const calculateOPS = (h: number, ab: number, bb: number, tb: number) => {
    if (ab + bb === 0) return '.000';
    const obp = (h + bb) / (ab + bb);
    const slg = ab > 0 ? tb / ab : 0;
    return (obp + slg).toFixed(3).replace(/^0/, '');
  };

  return (
    <div className="bg-[#0f172a] text-slate-200 rounded-lg overflow-hidden shadow-xl mb-8 border border-slate-800">
      <div className="p-4 border-b border-slate-800 bg-[#1e293b] flex justify-between items-center">
        <h2 className="font-bold text-lg uppercase tracking-wider">Batters - {teamName}</h2>
        {isAdmin && (
          <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded font-medium">
            Admin Edit Mode
          </span>
        )}
      </div>
      
      <table className="w-full text-left text-sm">
        <thead className="text-slate-500 uppercase text-[10px] bg-[#0f172a] tracking-widest">
          <tr>
            <th className="px-4 py-3">Player</th>
            <th className="px-2 py-3 text-center">AB</th>
            <th className="px-2 py-3 text-center">R</th>
            <th className="px-2 py-3 text-center">H</th>
            <th className="px-2 py-3 text-center">RBI</th>
            <th className="px-2 py-3 text-center">BB</th>
            <th className="px-2 py-3 text-center">K</th>
            <th className="px-2 py-3 text-center">AVG</th>
            <th className="px-2 py-3 text-center font-bold">OPS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {stats.map((player) => (
            <tr 
              key={player.id} 
              className={`transition-colors ${isAdmin ? 'hover:bg-blue-900/20 cursor-pointer' : 'hover:bg-slate-800/50'}`}
              // When an admin clicks the row, trigger the editor state in the parent
              onClick={() => isAdmin && onPlayerClick?.({ id: player.id, name: player.name })}
            >
              <td className="px-4 py-3 font-semibold text-white">
                <span className={isAdmin ? "text-blue-400 border-b border-transparent hover:border-blue-400" : ""}>
                  {player.name}
                </span>
              </td>
              <td className="px-2 py-3 text-center">{player.ab}</td>
              <td className="px-2 py-3 text-center">{player.r}</td>
              <td className="px-2 py-3 text-center">{player.h}</td>
              <td className="px-2 py-3 text-center">{player.rbi}</td>
              <td className="px-2 py-3 text-center">{player.bb}</td>
              <td className="px-2 py-3 text-center">{player.k}</td>
              <td className="px-2 py-3 text-center text-slate-400">
                {calculateAVG(player.h, player.ab)}
              </td>
              <td className="px-2 py-3 text-center font-bold">
                {calculateOPS(player.h, player.ab, player.bb, player.tb)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}