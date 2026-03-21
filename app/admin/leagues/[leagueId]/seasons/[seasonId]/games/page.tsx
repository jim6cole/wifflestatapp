'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function EditSchedule({ params }: { params: Promise<{ leagueId: string, seasonId: string }> }) {
  const { leagueId, seasonId } = use(params);
  
  const [activeTeams, setActiveTeams] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection/Edit State
  const [editingGameId, setEditingGameId] = useState<number | null>(null);
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [gameDate, setGameDate] = useState('');
  const [gameTime, setGameTime] = useState('');

  // 15-Min Slot Generator (Same as Scheduler)
  const timeSlots = Array.from({ length: 96 }, (_, i) => {
    const h = Math.floor(i / 4).toString().padStart(2, '0');
    const m = (i % 4 * 15).toString().padStart(2, '0');
    const period = +h >= 12 ? 'PM' : 'AM';
    const displayH = +h % 12 === 0 ? 12 : +h % 12;
    return { value: `${h}:${m}`, label: `${displayH}:${m} ${period}` };
  });

  useEffect(() => {
    async function loadData() {
      const [tRes, gRes] = await Promise.all([
        fetch(`/api/admin/seasons/${seasonId}/teams`),
        fetch(`/api/admin/seasons/${seasonId}/games`)
      ]);
      if (tRes.ok) {
        const tData = await tRes.json();
        setActiveTeams(tData.filter((t: any) => t.seasonId === parseInt(seasonId)));
      }
      if (gRes.ok) setGames(await gRes.json());
      setLoading(false);
    }
    loadData();
  }, [seasonId]);

  // Load a game into the Editor
  const loadGameToEdit = (game: any) => {
    const d = new Date(game.scheduledAt);
    setEditingGameId(game.id);
    setHomeTeamId(game.homeTeamId.toString());
    setAwayTeamId(game.awayTeamId.toString());
    setGameDate(d.toISOString().split('T')[0]);
    setGameTime(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const scheduledAt = new Date(`${gameDate}T${gameTime}`).toISOString();
    
    const res = await fetch(`/api/admin/games/${editingGameId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ homeTeamId, awayTeamId, scheduledAt })
    });

    if (res.ok) {
      const updated = await res.json();
      setGames(games.map(g => g.id === updated.id ? updated : g));
      setEditingGameId(null); // Close editor
      setHomeTeamId(''); setAwayTeamId(''); setGameDate(''); setGameTime('');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Permanently delete this game?")) return;
    const res = await fetch(`/api/admin/games/${id}`, { method: 'DELETE' });
    if (res.ok) setGames(games.filter(g => g.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-12 border-b-4 border-[#669bbc] pb-6 flex justify-between items-end">
          <div>
            <Link href={`/admin/leagues/${leagueId}/seasons`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white transition-colors">
              ← Back to Season Archive
            </Link>
            <h1 className="text-6xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f] mt-2">
              Schedule Manager
            </h1>
          </div>
          <Link href={`/admin/leagues/${leagueId}/seasons/${seasonId}/schedule/new`} className="bg-[#669bbc] text-[#001d3d] px-6 py-3 font-black uppercase text-[10px] hover:bg-white transition-all">
            + New Game
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: EDIT CONSOLE */}
          <div className="lg:col-span-1">
            {!editingGameId ? (
              <div className="bg-[#003566]/50 border-2 border-dashed border-[#669bbc] p-12 text-center opacity-50">
                <p className="font-black italic uppercase text-[#669bbc]">Select a game to edit details</p>
              </div>
            ) : (
              <div className="bg-[#003566] border-2 border-[#fdf0d5] p-6 shadow-2xl animate-in slide-in-from-left duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black italic uppercase text-white">Edit Game #{editingGameId}</h2>
                  <button onClick={() => setEditingGameId(null)} className="text-[#c1121f] font-black hover:text-white">CANCEL</button>
                </div>
                
                <form onSubmit={handleUpdate} className="space-y-6">
                  <div className="space-y-4 bg-[#001d3d] border border-[#669bbc]/50 p-4">
                    <select value={awayTeamId} onChange={(e) => setAwayTeamId(e.target.value)} className="w-full bg-[#003566] border-2 border-[#669bbc] p-3 text-white font-bold uppercase">
                      {activeTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <div className="text-center font-black italic text-[#c1121f]">VS</div>
                    <select value={homeTeamId} onChange={(e) => setHomeTeamId(e.target.value)} className="w-full bg-[#003566] border-2 border-[#669bbc] p-3 text-white font-bold uppercase">
                      {activeTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <input type="date" value={gameDate} onChange={(e) => setGameDate(e.target.value)} className="bg-[#001d3d] border-2 border-[#669bbc] p-3 text-white font-bold [color-scheme:dark]" />
                    <select value={gameTime} onChange={(e) => setGameTime(e.target.value)} className="bg-[#001d3d] border-2 border-[#669bbc] p-3 text-white font-bold uppercase">
                      {timeSlots.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>

                  <button type="submit" className="w-full bg-[#c1121f] border-2 border-[#fdf0d5] py-4 font-black italic uppercase text-white hover:bg-white hover:text-[#c1121f] transition-all">
                    Update Game Details
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* RIGHT: LIVE SCHEDULE LIST */}
          <div className="lg:col-span-2 space-y-3">
            {games.map((game) => {
              const d = new Date(game.scheduledAt);
              const isActive = editingGameId === game.id;
              return (
                <div key={game.id} className={`bg-[#003566] border-2 transition-all ${isActive ? 'border-[#fdf0d5] translate-x-2' : 'border-[#669bbc]'} p-4 flex justify-between items-center group`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black italic uppercase text-white">{game.awayTeam?.name} @ {game.homeTeam?.name}</span>
                    </div>
                    <p className="text-[10px] font-bold uppercase text-[#669bbc]">{d.toLocaleDateString()} @ {d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button onClick={() => loadGameToEdit(game)} className="bg-[#669bbc] text-[#001d3d] px-4 py-2 text-[10px] font-black uppercase hover:bg-white transition-all">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(game.id)} className="border border-[#c1121f] text-[#c1121f] px-4 py-2 text-[10px] font-black uppercase hover:bg-[#c1121f] hover:text-white transition-all">
                      Del
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}