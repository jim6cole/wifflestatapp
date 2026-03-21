'use client';
import { useState, useEffect } from 'react';

export default function PlayerManager() {
  const [players, setPlayers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [teamId, setTeamId] = useState('');

  const loadData = async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        fetch('/api/players'),
        fetch('/api/teams')
      ]);
      
      const pData = await pRes.json();
      const tData = await tRes.json();

      // Safety check: ensure we are setting arrays
      setPlayers(Array.isArray(pData) ? pData : []);
      setTeams(Array.isArray(tData) ? tData : []);
    } catch (err) {
      console.error("Failed to load data:", err);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    if (!name || !teamId) return alert("Please enter a name and select a team.");

    const res = await fetch('/api/players', {
      method: 'POST',
      body: JSON.stringify({ name, teamId: Number(teamId) }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (res.ok) {
      setName('');
      loadData();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to create player");
    }
  };

  const handleDelete = async (id: number, playerName: string) => {
    const firstCheck = confirm(`Are you sure you want to delete ${playerName}?`);
    if (!firstCheck) return;

    const secondCheck = confirm(`PERMANENT ACTION: This will erase all stats for ${playerName}. Proceed?`);
    if (!secondCheck) return;

    try {
      const res = await fetch(`/api/players/${id}`, { 
        method: 'DELETE' 
      });

      if (res.ok) {
        // Optimistic UI update: remove player from state immediately so it feels fast
        setPlayers(prev => prev.filter(p => p.id !== id));
        // Then sync with server
        loadData();
      } else {
        const errData = await res.json();
        alert(`Delete failed: ${errData.error}`);
      }
    } catch (err) {
      console.error("Network error during delete:", err);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto bg-slate-900 text-white min-h-screen">
      <h1 className="text-3xl font-black mb-8 italic uppercase border-b border-slate-700 pb-2 tracking-tighter">
        Master Roster
      </h1>

      <div className="bg-slate-800 p-6 rounded-xl mb-10 flex flex-col md:flex-row gap-4 items-end border border-slate-700 shadow-xl">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">New Player Name</label>
          <input 
            className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white outline-none focus:border-blue-500"
            value={name} 
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name..."
          />
        </div>
        <div className="w-full md:w-64">
          <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Assign Team</label>
          <select 
            className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white outline-none focus:border-blue-500" 
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
          >
            <option value="">Select Team</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <button 
          onClick={handleCreate} 
          className="w-full md:w-auto bg-blue-600 px-8 py-3 rounded font-black hover:bg-blue-500 transition-all active:scale-95"
        >
          CREATE
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {players.length === 0 ? (
          <p className="text-slate-500 italic">No players found in the league.</p>
        ) : (
          players.map(p => (
            <div key={p.id} className="bg-slate-800 p-4 rounded border border-slate-700 flex justify-between items-center group hover:border-slate-500 transition-colors">
              <div>
                <div className="font-bold text-lg leading-tight">{p.name}</div>
                <div className="text-xs text-blue-400 uppercase font-black tracking-widest">{p.team?.name || 'Free Agent'}</div>
              </div>
              <button 
                onClick={() => handleDelete(p.id, p.name)}
                className="md:opacity-0 group-hover:opacity-100 bg-red-900/20 text-red-500 px-4 py-2 rounded text-xs font-bold hover:bg-red-600 hover:text-white transition-all"
              >
                DELETE
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}