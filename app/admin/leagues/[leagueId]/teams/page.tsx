'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function MasterFranchiseDepot({ params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = use(params);
  
  const [masterPool, setMasterPool] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [leagueId]);

  async function fetchData() {
    try {
      const [poolRes, seasonsRes] = await Promise.all([
        fetch(`/api/admin/leagues/${leagueId}/teams`),
        fetch(`/api/admin/leagues/${leagueId}/seasons`)
      ]);
      
      if (poolRes.ok) setMasterPool(await poolRes.json());
      if (seasonsRes.ok) setSeasons(await seasonsRes.json());
    } catch (err) {
      console.error("Failed to load depot data", err);
    } finally {
      setLoading(false);
    }
  }

  // --- REAL TIME INTERCEPTOR LOGIC ---
  const matchingTeam = masterPool.find(t => t.name.toLowerCase() === newTeamName.trim().toLowerCase());
  const isDuplicateActive = matchingTeam && matchingTeam.isActive;
  const isDuplicateArchived = matchingTeam && !matchingTeam.isActive;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || isDuplicateActive) return;

    if (isDuplicateArchived) {
      // RESTORE TEAM
      const res = await fetch(`/api/admin/leagues/${leagueId}/teams/${matchingTeam.id}`, { method: 'PATCH' });
      if (res.ok) {
        setNewTeamName('');
        fetchData();
      }
    } else {
      // CREATE BRAND NEW
      const res = await fetch(`/api/admin/leagues/${leagueId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName })
      });
      if (res.ok) {
        setNewTeamName('');
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create franchise.");
      }
    }
  };

  const handleSmartDelete = async (team: any) => {
    const gameCount = (team._count?.homeGames || 0) + (team._count?.awayGames || 0);
    
    const confirmMessage = gameCount === 0 
      ? `PERMANENT DELETE: "${team.name}" has 0 historical games. This will erase them from the database completely. Proceed?`
      : `ARCHIVE FRANCHISE: "${team.name}" has ${gameCount} historical games. They will be safely moved to the Archive to protect their stats. Proceed?`;

    if (!window.confirm(confirmMessage)) return;

    const res = await fetch(`/api/admin/leagues/${leagueId}/teams/${team.id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchData(); // Refresh the grid
    } else {
      alert("Failed to process team removal.");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black uppercase text-white animate-pulse text-2xl italic text-center">Opening the Archives...</div>;

  const activeTeams = masterPool.filter(t => t.isActive);
  const archivedTeams = masterPool.filter(t => !t.isActive);

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] font-sans p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-12 border-b-8 border-[#c1121f] pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <Link href={`/admin/leagues/${leagueId}`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white transition-colors block mb-4">
              ← Back to League Hub
            </Link>
            <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f] leading-none">
              Franchise Depot
            </h1>
            <p className="text-[#ffd60a] font-black uppercase text-xs tracking-[0.4em] mt-3 italic">Master Directory & League Archives</p>
          </div>
        </header>

        {/* SECTION 1: REGISTRY & INTERCEPTOR */}
        <section className="mb-12">
          <form onSubmit={handleSubmit} className={`p-6 shadow-[8px_8px_0px_#000] border-4 transition-colors ${isDuplicateArchived ? 'bg-[#ffd60a] border-[#c1121f]' : 'bg-white border-[#001d3d]'}`}>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${isDuplicateArchived ? 'text-[#c1121f]' : 'text-[#669bbc]'}`}>
              {isDuplicateArchived ? '⚠️ ARCHIVED FRANCHISE DETECTED' : 'Register New Franchise'}
            </label>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <input 
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value.toUpperCase())}
                placeholder="ENTER FRANCHISE NAME..."
                className={`flex-1 p-4 font-black italic uppercase outline-none focus:border-[#c1121f] border-4 ${isDuplicateArchived ? 'bg-white text-[#c1121f] border-[#c1121f]' : 'bg-[#fdf0d5] text-[#001d3d] border-[#001d3d]'}`}
              />
              <button 
                type="submit" 
                disabled={isDuplicateActive || !newTeamName.trim()}
                className={`px-10 py-4 font-black italic uppercase tracking-widest transition-all disabled:opacity-50 border-4 ${
                  isDuplicateArchived 
                  ? 'bg-[#c1121f] text-white border-[#c1121f] hover:bg-white hover:text-[#c1121f]' 
                  : 'bg-[#001d3d] text-white border-[#001d3d] hover:bg-[#c1121f] hover:border-[#c1121f]'
                }`}
              >
                {isDuplicateActive ? 'Already Active' : isDuplicateArchived ? 'Restore Franchise' : 'Register ★'}
              </button>
            </div>
            
            {isDuplicateArchived && (
              <p className="text-[#c1121f] text-[10px] font-bold uppercase mt-3 italic">
                Restoring will bring this franchise back to the active pool with all historical stats intact.
              </p>
            )}
          </form>
        </section>

        {/* SECTION 2: ACTIVE DIRECTORY */}
        <section className="mb-16">
          <h2 className="text-4xl font-black italic uppercase text-white border-b-4 border-[#ffd60a] pb-2 mb-8">Active Master Pool</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {activeTeams.length === 0 ? (
              <div className="col-span-full py-12 border-4 border-dashed border-[#669bbc]/30 text-center opacity-50">
                <p className="font-black italic uppercase text-white">No active franchises in the league pool.</p>
              </div>
            ) : (
              activeTeams.map(team => (
                <div key={team.id} className="bg-[#003566] border-2 border-[#669bbc] p-4 flex flex-col justify-between shadow-[6px_6px_0px_#000] group relative overflow-hidden min-h-[100px]">
                   <div>
                     <span className="text-[8px] font-black uppercase text-[#ffd60a] block mb-1">ID:{team.id}</span>
                     <p className="font-black italic uppercase text-white text-lg leading-tight break-words">{team.name}</p>
                   </div>
                   
                   <button 
                     onClick={() => handleSmartDelete(team)}
                     className="mt-4 text-[9px] font-black uppercase tracking-widest bg-[#c1121f] text-white py-2 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-[#c1121f]"
                   >
                     {((team._count?.homeGames || 0) + (team._count?.awayGames || 0)) === 0 ? 'Permanent Delete' : 'Send to Archive'}
                   </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* SECTION 3: THE GRAVEYARD (ARCHIVE) */}
        {archivedTeams.length > 0 && (
          <section className="pt-12 border-t-8 border-dashed border-[#003566]">
            <h2 className="text-2xl font-black italic uppercase text-slate-500 mb-6 flex items-center gap-4">
              The Archive <span className="text-[10px] font-bold tracking-widest text-[#669bbc] bg-[#003566] px-3 py-1">Soft Deleted</span>
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 opacity-60 hover:opacity-100 transition-opacity">
              {archivedTeams.map(team => (
                <div key={team.id} className="bg-[#001d3d] border-2 border-slate-700 p-4 text-center group relative overflow-hidden grayscale hover:grayscale-0 transition-all">
                   <p className="font-black italic uppercase text-slate-400 text-xs break-words mb-3">{team.name}</p>
                   <button 
                     onClick={async () => {
                       await fetch(`/api/admin/leagues/${leagueId}/teams/${team.id}`, { method: 'PATCH' });
                       fetchData();
                     }}
                     className="w-full text-[8px] font-black uppercase tracking-widest border border-slate-500 text-slate-400 py-1 hover:bg-[#ffd60a] hover:text-[#001d3d] hover:border-[#ffd60a] transition-colors"
                   >
                     Restore
                   </button>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}