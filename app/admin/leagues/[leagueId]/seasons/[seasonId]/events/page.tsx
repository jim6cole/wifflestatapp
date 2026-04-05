'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function TournamentManager({ params }: { params: Promise<{ leagueId: string, seasonId: string }> }) {
  const { leagueId, seasonId } = use(params);
  
  const [events, setEvents] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]); // NEW: Default to today

  useEffect(() => {
    fetchData();
  }, [seasonId]);

  async function fetchData() {
    try {
      const [eventsRes, teamsRes] = await Promise.all([
        fetch(`/api/admin/seasons/${seasonId}/events`),
        fetch(`/api/admin/seasons/${seasonId}/teams`)
      ]);
      if (eventsRes.ok) setEvents(await eventsRes.json());
      if (teamsRes.ok) setTeams(await teamsRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName) return;

    // Check if the selected date is in the future
    const selectedDate = new Date(newEventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to midnight for fair comparison
    
    // Auto-set to UPCOMING if the date is in the future
    const autoStatus = selectedDate > today ? 'UPCOMING' : 'ACTIVE';

    const res = await fetch(`/api/admin/seasons/${seasonId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: newEventName, 
        startDate: new Date(newEventDate).toISOString(), // Send as ISO
        status: autoStatus 
      })
    });

    if (res.ok) {
      setNewEventName('');
      setNewEventDate(new Date().toISOString().split('T')[0]); // Reset to today
      fetchData(); 
    }
  };

  const handleUpdate = async (eventId: number, field: string, value: string) => {
    // FIX: Corrected API path to match file structure
    const res = await fetch(`/api/admin/seasons/${seasonId}/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value })
    });

    if (res.ok) fetchData();
    else alert("Failed to update tournament.");
  };

  const handleDelete = async (eventId: number, name: string, gameCount: number) => {
    if (gameCount > 0) {
      return alert(`Cannot delete! There are ${gameCount} games attached to this tournament. Delete the games from the schedule first.`);
    }
    if (!confirm(`Are you sure you want to permanently delete the tournament: ${name}?`)) return;

    // FIX: Corrected API path to match file structure
    const res = await fetch(`/api/admin/seasons/${seasonId}/events/${eventId}`, { method: 'DELETE' });
    if (res.ok) setEvents(events.filter(e => e.id !== eventId));
    else alert("Failed to delete tournament.");
  };

  return (
    <div className="min-h-screen bg-[#001d3d] text-white p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-5xl mx-auto">
        
        <header className="mb-12 border-b-4 border-[#ffd60a] pb-6">
          <Link href={`/admin/leagues/${leagueId}/seasons/${seasonId}`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#ffd60a] transition-colors block mb-4">
            ← Back to Season Dugout
          </Link>
          <h1 className="text-6xl font-black italic uppercase tracking-tighter drop-shadow-[4px_4px_0px_#c1121f]">
            Tournament Manager
          </h1>
          <p className="text-[#669bbc] font-bold uppercase text-[10px] tracking-[0.4em] mt-2 italic">Sub-Events & Champion Tracking</p>
        </header>

        {/* CREATE NEW TOURNAMENT */}
        <div className="bg-white border-4 border-[#001d3d] p-8 shadow-[8px_8px_0px_#ffd60a] mb-12">
          <h2 className="text-2xl font-black italic uppercase text-[#001d3d] mb-4">Create Blank Tournament</h2>
          <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4">
            <input 
              type="text" 
              placeholder="e.g. 2026 Memorial Day Classic" 
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              className="flex-[2] bg-[#fdf0d5] border-4 border-[#001d3d] p-4 text-[#001d3d] font-black uppercase outline-none focus:border-[#c1121f]"
            />
            {/* NEW: Date Picker for Creation */}
            <input 
              type="date"
              value={newEventDate}
              onChange={(e) => setNewEventDate(e.target.value)}
              className="flex-1 bg-[#fdf0d5] border-4 border-[#001d3d] p-4 text-[#001d3d] font-black uppercase outline-none focus:border-[#c1121f] cursor-pointer"
            />
            <button type="submit" className="bg-[#c1121f] text-white px-8 py-4 font-black italic uppercase border-4 border-[#001d3d] hover:bg-[#ffd60a] hover:text-[#001d3d] transition-colors">
              Initialize
            </button>
          </form>
        </div>

        {/* TOURNAMENT LIST */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center font-black italic uppercase text-2xl animate-pulse">Scanning Archives...</div>
          ) : events.length === 0 ? (
            <div className="border-4 border-dashed border-[#669bbc]/50 p-12 text-center text-[#669bbc] font-black italic uppercase text-xl">
              No Tournaments Found In This Season
            </div>
          ) : (
            events.map(event => (
              <div key={event.id} className={`bg-white border-4 border-[#001d3d] p-6 shadow-[8px_8px_0px_#000] relative ${event.status === 'COMPLETED' ? 'opacity-80' : ''}`}>
                
                {/* Header */}
                <div className="flex justify-between items-start mb-6 border-b-2 border-[#001d3d]/10 pb-4">
                  <div>
                    <h3 className="text-3xl font-black italic uppercase text-[#001d3d] leading-none">{event.name}</h3>
                    <p className="text-[10px] font-bold uppercase text-[#669bbc] tracking-widest mt-2">Attached Games: {event._count.games}</p>
                  </div>
                  <button onClick={() => handleDelete(event.id, event.name, event._count.games)} className="bg-red-100 text-red-600 px-3 py-1 font-black uppercase text-sm border-2 border-red-200 hover:bg-red-600 hover:text-white transition-colors">X</button>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* NEW: Date Control */}
                  <div className="bg-[#fdf0d5] border-2 border-[#001d3d] p-4 shadow-inner">
                     <label className="block text-[10px] font-black uppercase text-[#001d3d] tracking-widest mb-2">Tournament Date</label>
                     <input 
                       type="date"
                       // Safely format the ISO string for the date picker (YYYY-MM-DD)
                       value={event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : ''}
                       onChange={(e) => handleUpdate(event.id, 'startDate', new Date(e.target.value).toISOString())}
                       className="w-full p-3 font-black uppercase border-2 border-[#001d3d] outline-none cursor-pointer bg-white text-[#001d3d]"
                     />
                  </div>

                  {/* Status Control */}
                  <div className="bg-[#fdf0d5] border-2 border-[#001d3d] p-4 shadow-inner">
                    <label className="block text-[10px] font-black uppercase text-[#c1121f] tracking-widest mb-2">Live Status</label>
                    <select 
                      value={event.status} 
                      onChange={(e) => handleUpdate(event.id, 'status', e.target.value)}
                      className={`w-full p-3 font-black uppercase border-2 border-[#001d3d] outline-none cursor-pointer ${
                        event.status === 'UPCOMING' ? 'bg-[#ffd60a] text-[#001d3d]' : 
                        event.status === 'ACTIVE' ? 'bg-green-500 text-white' : 
                        'bg-slate-300 text-slate-600'
                      }`}
                    >
                      <option value="UPCOMING">Planning (Upcoming)</option>
                      <option value="ACTIVE">Event Live (Active)</option>
                      <option value="COMPLETED">Event Concluded (Completed)</option>
                    </select>
                  </div>

                  {/* Champion Control */}
                  <div className={`border-2 p-4 transition-all ${event.status === 'COMPLETED' ? 'bg-[#ffd60a]/20 border-[#ffd60a]' : 'bg-slate-100 border-slate-300 opacity-50'}`}>
                    <label className="block text-[10px] font-black uppercase text-[#001d3d] tracking-widest mb-2">Crown Champion</label>
                    <select 
                      value={event.winnerId || ''} 
                      onChange={(e) => handleUpdate(event.id, 'winnerId', e.target.value)}
                      disabled={event.status !== 'COMPLETED'}
                      className="w-full bg-white p-3 font-black uppercase border-2 border-[#001d3d] text-[#001d3d] outline-none cursor-pointer disabled:cursor-not-allowed"
                    >
                      <option value="">-- No Champion Declared --</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>🏆 {t.name}</option>
                      ))}
                    </select>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}