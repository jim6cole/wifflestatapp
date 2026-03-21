'use client';

import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [teamName, setTeamName] = useState('');
  const [teams, setTeams] = useState<any[]>([]);

  // Load teams when page opens
  useEffect(() => {
    fetch('/api/teams').then(res => res.json()).then(setTeams);
  }, []);

  const addTeam = async () => {
    if (!teamName) return;
    const res = await fetch('/api/teams', {
      method: 'POST',
      body: JSON.stringify({ name: teamName }),
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      setTeamName('');
      // Refresh list
      fetch('/api/teams').then(res => res.json()).then(setTeams);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">AWAA Commissioner Dashboard</h1>
      
      <div className="flex gap-2 mb-8">
        <input 
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Team Name (e.g. meats)"
          className="border p-2 flex-1 rounded text-black"
        />
        <button onClick={addTeam} className="bg-blue-600 text-white px-4 py-2 rounded">
          Add Team
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-2">Registered Teams ({teams.length})</h2>
      <ul className="list-disc pl-5">
        {teams.map(team => (
          <li key={team.id} className="py-1">{team.name}</li>
        ))}
      </ul>
    </div>
  );
}

