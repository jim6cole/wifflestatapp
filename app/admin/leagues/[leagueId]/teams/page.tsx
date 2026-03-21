'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function TeamManager() {
  const { leagueId } = useParams();
  const [teams, setTeams] = useState<any[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, [leagueId]);

  async function fetchTeams() {
    const res = await fetch(`/api/admin/leagues/${leagueId}/teams`);
    if (res.ok) {
      const data = await res.json();
      setTeams(data);
    }
    setLoading(false);
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName) return;

    const res = await fetch(`/api/admin/leagues/${leagueId}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTeamName }),
    });

    if (res.ok) {
      setNewTeamName('');
      fetchTeams();
    }
  };

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] font-sans p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-5xl mx-auto">
        
        <header className="mb-12 border-b-4 border-[#669bbc] pb-6 flex justify-between items-end">
          <div>
            <Link href={`/admin/global`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white">← League Map</Link>
            <h1 className="text-6xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f] mt-2">
              Roster Depot
            </h1>
          </div>
        </header>

        {/* CREATE TEAM FORM */}
        <form onSubmit={handleCreateTeam} className="bg-[#003566] border-2 border-[#669bbc] p-8 mb-12 shadow-xl flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-[10px] font-black uppercase text-[#669bbc] mb-2">New Team Franchise</label>
            <input 
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value.toUpperCase())}
              placeholder="e.g. DIRTBAGS"
              className="w-full bg-[#001d3d] border-2 border-[#fdf0d5] p-4 text-2xl font-black italic text-white outline-none focus:border-[#c1121f]"
            />
          </div>
          <button type="submit" className="bg-[#c1121f] border-2 border-[#fdf0d5] px-10 py-4 font-black italic uppercase tracking-widest text-white hover:bg-white hover:text-[#c1121f] self-end">
            Register Franchise ★
          </button>
        </form>

        {/* TEAM GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {loading ? (
            <p className="font-black italic animate-pulse">Accessing Personnel Files...</p>
          ) : teams.map((team) => (
            <div key={team.id} className="bg-[#003566] border-2 border-[#669bbc] p-6 relative overflow-hidden group">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-3xl font-black italic uppercase text-white leading-none">{team.name}</h3>
                <span className="text-[10px] font-black bg-[#c1121f] px-2 py-1">ID: {team.id}</span>
              </div>
              
              <div className="space-y-2 mb-6">
                <p className="text-[10px] font-black uppercase text-[#669bbc] border-b border-white/10 pb-1">Active Roster</p>
                {team.players.length === 0 ? (
                  <p className="text-xs italic opacity-50 uppercase">No players drafted yet.</p>
                ) : (
                  team.players.map((p: any) => (
                    <div key={p.id} className="text-sm font-bold uppercase flex justify-between">
                      <span>{p.name}</span>
                      <span className="text-[#669bbc]">#0{p.id % 99}</span>
                    </div>
                  ))
                )}
              </div>

              <Link 
                href={`/admin/leagues/${leagueId}/teams/${team.id}/players`}
                className="block text-center border border-[#fdf0d5] p-3 text-[10px] font-black uppercase tracking-widest hover:bg-[#fdf0d5] hover:text-[#001d3d] transition-all"
              >
                Draft Players →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}