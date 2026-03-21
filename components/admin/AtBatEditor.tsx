"use client";
import { useState, useEffect } from 'react';

// Define the shape of your AtBat data to satisfy TypeScript
interface AtBatRecord {
  id: number;
  inning: number;
  result: string;
  rbi: number;
  runsScored: number;
}

interface AtBatEditorProps {
  gameId: string;
  playerId: number;
  playerName: string;
  onClose: () => void;
}

export default function AtBatEditor({ gameId, playerId, playerName, onClose }: AtBatEditorProps) {
  // Fix the 'never[]' error by providing a type to useState
  const [atBats, setAtBats] = useState<AtBatRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/games/${gameId}/players/${playerId}/at-bats`)
      .then(res => res.json())
      .then(data => {
        setAtBats(data);
        setLoading(false);
      });
  }, [gameId, playerId]);

  const updateResult = async (atBatId: number, newResult: string) => {
    await fetch(`/api/admin/at-bats/${atBatId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result: newResult }),
    });
    
    // Type-safe state update
    setAtBats(prev => prev.map((ab) => ab.id === atBatId ? { ...ab, result: newResult } : ab));
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#1e293b] shadow-2xl p-6 text-white z-50 border-l border-slate-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Edit: {playerName}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-slate-400">
          <p className="animate-pulse">Loading plays...</p>
        </div>
      ) : (
        <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
          {atBats.map((ab, index) => (
            <div key={ab.id} className="p-4 bg-[#0f172a] rounded-lg border border-slate-800">
              <p className="text-xs text-slate-500 mb-2 uppercase font-bold tracking-widest">
                Appearance #{index + 1} — Inning {ab.inning}
              </p>
              
              <select 
                value={ab.result} 
                onChange={(e) => updateResult(ab.id, e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-700 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="SINGLE">Single</option>
                <option value="DOUBLE">Double</option>
                <option value="TRIPLE">Triple</option>
                <option value="HR">Home Run</option>
                <option value="WALK">Walk</option>
                <option value="STRIKEOUT">Strikeout</option>
                <option value="OUT">Ground/Fly Out</option>
                <option value="ERROR">Reached on Error</option>
              </select>

              <div className="mt-3 flex gap-4 text-xs font-mono text-slate-400">
                <span className="bg-slate-800 px-2 py-1 rounded">RBI: {ab.rbi}</span>
                <span className="bg-slate-800 px-2 py-1 rounded">Runs: {ab.runsScored}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-[#1e293b] border-t border-slate-700">
        <button 
          onClick={() => window.location.reload()} 
          className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold transition-all shadow-lg active:scale-95"
        >
          Finalize & Refresh Box Score
        </button>
      </div>
    </div>
  );
}