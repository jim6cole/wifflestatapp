'use client';

import { useState, useEffect } from 'react';

export default function RosterPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load all teams on initial page load
  useEffect(() => {
    fetch('/api/teams')
      .then((res) => res.json())
      .then((data) => setTeams(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error loading teams:", err));
  }, []);

  // Load players whenever the selected team changes
  useEffect(() => {
    if (selectedTeamId) {
      setLoading(true);
      fetch(`/api/teams/${selectedTeamId}/players`)
        .then((res) => res.json())
        .then((data) => {
          setPlayers(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error loading players:", err);
          setLoading(false);
        });
    } else {
      setPlayers([]);
    }
  }, [selectedTeamId]);

  const addPlayer = async () => {
    if (!playerName || !selectedTeamId) return;

    const res = await fetch('/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: playerName, teamId: selectedTeamId }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (res.ok) {
      setPlayerName('');
      // Refresh the list from the server
      const updated = await fetch(`/api/teams/${selectedTeamId}/players`);
      const data = await updated.json();
      setPlayers(Array.isArray(data) ? data : []);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto bg-slate-900 text-white rounded-xl shadow-2xl mt-10">
      <h1 className="text-2xl font-black mb-6 border-b border-slate-700 pb-2 italic">
        AWAA ROSTER MANAGEMENT
      </h1>

      <div className="mb-8">
        <label className="block text-xs font-bold text-slate-400 mb-1">SELECT TEAM</label>
        <select 
          className="w-full bg-slate-800 p-3 rounded border border-slate-700 text-white focus:border-blue-500 outline-none"
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
        >
          <option value="">Choose a team...</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {selectedTeamId && (
        <div className="space-y-6">
          <div className="flex gap-2">
            <input 
              className="flex-1 bg-slate-800 p-3 rounded border border-slate-700 text-white focus:border-blue-500 outline-none"
              placeholder="Player Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
            />
            <button 
              onClick={addPlayer}
              className="bg-blue-600 hover:bg-blue-500 px-6 rounded font-black transition-all"
            >
              ADD
            </button>
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">
              Current Roster
            </h2>
            
            {loading ? (
              <p className="text-slate-500">Loading players...</p>
            ) : Array.isArray(players) && players.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {players.map((player) => (
                  <div 
                    key={player.id} 
                    className="bg-slate-800 p-3 rounded border border-slate-700 flex justify-between items-center"
                  >
                    <span className="font-bold">{player.name}</span>
                    <span className="text-xs text-slate-500 uppercase font-black">Active</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic">No players on this roster yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}