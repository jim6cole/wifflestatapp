"use client";
import { useState, use } from 'react'; // Added 'use'
import BoxScoreTable from '@/components/stats/BoxScoreTable';
import AtBatEditor from '@/components/admin/AtBatEditor';

interface Player {
  id: number;
  name: string;
}

export default function GameAdminPage({ 
  params 
}: { 
  params: Promise<{ gameId: string }> 
}) {
  // 1. Unwrap the params promise safely for Client Components
  const { gameId } = use(params);

  // 2. State to track which player is being edited
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  return (
    <div className="p-8 min-h-screen bg-[#0f172a]">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Game Management</h1>
        
        {/* The Box Score acts as the navigation for the editor */}
        <BoxScoreTable 
          gameId={gameId} 
          isAdmin={true}
          // Placeholder stats - your BoxScoreTable should fetch its own data or receive it here
          stats={[]} 
          teamName="Loading..." 
          onPlayerClick={(player: Player) => setEditingPlayer(player)} 
        />

        {/* The Editor slides out when a player row is clicked */}
        {editingPlayer && (
          <AtBatEditor 
            gameId={gameId}
            playerId={editingPlayer.id}
            playerName={editingPlayer.name}
            onClose={() => setEditingPlayer(null)} 
          />
        )}
      </div>
    </div>
  );
}