'use client';
import { useState, useEffect, use } from 'react';
import BoxScoreTable from '@/components/stats/BoxScoreTable';
import PitchingBoxScoreTable from '@/components/stats/PitchingBoxScoreTable';
import AtBatEditor from '@/components/admin/AtBatEditor';
import Link from 'next/link';

export default function GameAdminPage({ params }: { params: Promise<{ leagueId: string, seasonId: string, gameId: string }> }) {
  const { leagueId, seasonId, gameId } = use(params);
  const [game, setGame] = useState<any>(null);
  const [boxData, setBoxData] = useState<{batters: any[], pitchers: any[]}>({ batters: [], pitchers: [] });
  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [gRes, bRes] = await Promise.all([
        fetch(`/api/games/${gameId}/setup`),
        fetch(`/api/games/${gameId}/box-score`)
      ]);
      if (gRes.ok) setGame(await gRes.json());
      if (bRes.ok) setBoxData(await bRes.json());
      setLoading(false);
    }
    loadData();
  }, [gameId]);

  if (loading) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black uppercase text-white animate-pulse italic text-2xl">Scanning Scorecard...</div>;

  const getTeamStats = (teamId: number) => ({
    hitting: boxData.batters.filter(b => b.teamId === teamId),
    pitching: boxData.pitchers.filter(p => p.teamId === teamId)
  });

  const away = getTeamStats(game?.awayTeamId);
  const home = getTeamStats(game?.homeTeamId);

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] p-4 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-12 border-b-4 border-[#669bbc] pb-8 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <Link href={`/admin/leagues/${leagueId}/seasons/${seasonId}/history`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white transition-colors block mb-4">
              ← Back to History
            </Link>
            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f] leading-none">
              Scorecard
            </h1>
            <p className="text-[#ffd60a] font-black uppercase text-xs tracking-[0.4em] mt-3 italic">Official Box Score // ID: {gameId}</p>
          </div>

          <div className="bg-black/30 border-2 border-[#ffd60a] p-4 text-center skew-x-[-10deg] shadow-[6px_6px_0px_#c1121f]">
            <p className="text-[10px] font-black uppercase text-[#ffd60a] skew-x-[10deg] mb-1">Final Result</p>
            <h2 className="text-4xl font-black italic text-white skew-x-[10deg]">
              {game?.awayTeam?.name} {game?.awayScore} - {game?.homeScore} {game?.homeTeam?.name}
            </h2>
          </div>
        </header>

        <div className="space-y-20">
          {/* AWAY TEAM SECTION */}
          <div className="space-y-6">
            <h2 className="text-4xl font-black italic uppercase text-white border-l-8 border-[#c1121f] pl-6">
              {game?.awayTeam?.name}
            </h2>
            <BoxScoreTable 
              stats={away.hitting} 
              teamName={game?.awayTeam?.name || "Away"} // FIX: Added teamName prop
              isAdmin={true} 
              onPlayerClick={setEditingPlayer} 
            />
            <PitchingBoxScoreTable 
              stats={away.pitching} 
              teamName={game?.awayTeam?.name || "Away"} 
            />
          </div>

          {/* HOME TEAM SECTION */}
          <div className="space-y-6">
            <h2 className="text-4xl font-black italic uppercase text-white border-l-8 border-[#ffd60a] pl-6">
              {game?.homeTeam?.name}
            </h2>
            <BoxScoreTable 
              stats={home.hitting} 
              teamName={game?.homeTeam?.name || "Home"} // FIX: Added teamName prop
              isAdmin={true} 
              onPlayerClick={setEditingPlayer} 
            />
            <PitchingBoxScoreTable 
              stats={home.pitching} 
              teamName={game?.homeTeam?.name || "Home"} 
            />
          </div>
        </div>

        {editingPlayer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <AtBatEditor 
                gameId={gameId}
                playerId={editingPlayer.id}
                playerName={editingPlayer.name}
                onClose={() => { setEditingPlayer(null); window.location.reload(); }} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}