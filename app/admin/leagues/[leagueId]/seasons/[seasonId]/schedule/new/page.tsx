'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ⚡ HELPERS: Generate standard dropdown options
const generateTimeOptions = () => {
  const options = [];
  for (let h = 6; h <= 23; h++) {
    for (let m = 0; m < 60; m += 30) {
      const val = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
      const label = `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
      options.push({ val, label });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();
const FIELD_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; 
const SPEED_OPTIONS = Array.from({ length: 26 }, (_, i) => i + 55); 

export default function ScheduleNewGamePage({ params }: { params: Promise<{ leagueId: string, seasonId: string }> }) {
  const { leagueId, seasonId } = use(params);
  const router = useRouter();

  const [season, setSeason] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<any[]>([]);
  const [savedFields, setSavedFields] = useState<string[]>([]); // ⚡ State for remembered fields

  // Tracking if we are editing an existing game
  const [editingGameId, setEditingGameId] = useState<number | null>(null);

  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [eventId, setEventId] = useState('');
  
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  const [location, setLocation] = useState('');
  const [fieldNumber, setFieldNumber] = useState('1'); 
  const [isPlayoff, setIsPlayoff] = useState(false);
  
  const [overrideSpeed, setOverrideSpeed] = useState(false);
  const [isSpeedRestricted, setIsSpeedRestricted] = useState(false);
  const [speedLimit, setSpeedLimit] = useState(60); 

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchSchedule = async () => {
    try {
      const t = new Date().getTime();
      const res = await fetch(`/api/admin/seasons/${seasonId}/schedule?t=${t}`);
      
      if (res.ok) {
        const games = await res.json();
        setUpcomingGames(games.filter((g: any) => g.status === 'SCHEDULED' || g.status === 'UPCOMING'));
      }
    } catch (err) {
      console.error("Failed to load schedule", err);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const t = new Date().getTime();
        // ⚡ FIX: Fetch fields simultaneously with the other season data
        const [seasonRes, teamsRes, eventsRes, fieldsRes] = await Promise.all([
          fetch(`/api/admin/seasons/${seasonId}?t=${t}`),
          fetch(`/api/admin/seasons/${seasonId}/teams?t=${t}`),
          fetch(`/api/admin/seasons/${seasonId}/events?t=${t}`),
          fetch(`/api/admin/leagues/${leagueId}/fields?t=${t}`)
        ]);

        if (!seasonRes.ok) throw new Error("Failed to load season");
        
        const sData = await seasonRes.json();
        setSeason(sData);
        setTeams(await teamsRes.json());
        setEvents(await eventsRes.json());
        
        if (fieldsRes.ok) {
           setSavedFields(await fieldsRes.json());
        }

        setIsSpeedRestricted(sData.isSpeedRestricted || false);
        setSpeedLimit(sData.speedLimit || 60);

        await fetchSchedule();
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    }
    load();
  }, [seasonId, leagueId]);

  // SMART WATCHER: Automatically set 5PM for Weekdays, 9AM for Weekends (Only if NOT editing)
  useEffect(() => {
    if (scheduledDate && !editingGameId) {
      const [year, month, day] = scheduledDate.split('-');
      const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
      const dayOfWeek = dateObj.getDay(); 
      
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        setScheduledTime('09:00'); 
      } else {
        setScheduledTime('17:00'); 
      }
    }
  }, [scheduledDate, editingGameId]);

  // Load a game into the form for editing
  const handleEditClick = (game: any) => {
    setEditingGameId(game.id);
    setHomeTeamId(game.homeTeamId?.toString() || '');
    setAwayTeamId(game.awayTeamId?.toString() || '');
    setEventId(game.eventId?.toString() || '');
    setLocation(game.location || '');
    setFieldNumber(game.fieldNumber?.toString() || '');
    setIsPlayoff(game.isPlayoff || false);
    
    // Check if this game had specific speed overrides
    if (game.isSpeedRestricted !== null) {
        setOverrideSpeed(true);
        setIsSpeedRestricted(game.isSpeedRestricted);
        setSpeedLimit(game.speedLimit || 60);
    } else {
        setOverrideSpeed(false);
    }

    // Parse the date
    const d = new Date(game.scheduledAt);
    setScheduledDate(d.toISOString().split('T')[0]);
    setScheduledTime(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel editing mode
  const cancelEdit = () => {
      setEditingGameId(null);
      setHomeTeamId('');
      setAwayTeamId('');
      setOverrideSpeed(false);
      setIsPlayoff(false);
  };

  // Delete a game
  const handleDeleteClick = async (gameId: number) => {
      if (!window.confirm("Permanently delete this scheduled game?")) return;
      
      try {
          const res = await fetch(`/api/admin/games/${gameId}`, { method: 'DELETE' });
          if (res.ok) {
              setUpcomingGames(prev => prev.filter(g => g.id !== gameId));
              if (editingGameId === gameId) cancelEdit();
          } else {
              throw new Error("Failed to delete game");
          }
      } catch (err: any) {
          setError(err.message);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTeamId || !awayTeamId || !scheduledDate || !scheduledTime) return setError("Please fill in all required fields (Teams, Date & Time).");
    if (homeTeamId === awayTeamId) return setError("A team cannot play itself.");

    setSaving(true);
    setError('');

    const combinedDateTime = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

    const payload = {
        homeTeamId: parseInt(homeTeamId),
        awayTeamId: parseInt(awayTeamId),
        eventId: eventId ? parseInt(eventId) : null,
        scheduledAt: combinedDateTime,
        location: location || null,
        fieldNumber: fieldNumber ? parseInt(fieldNumber) : null,
        isPlayoff,
        status: 'SCHEDULED',
        isSpeedRestricted: overrideSpeed ? isSpeedRestricted : null,
        speedLimit: overrideSpeed && isSpeedRestricted ? speedLimit : null
    };

    try {
      let res;
      // If editing, use PATCH to the specific game. If not, use POST to create new.
      if (editingGameId) {
          res = await fetch(`/api/admin/games/${editingGameId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
      } else {
          res = await fetch(`/api/admin/seasons/${seasonId}/games`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
      }

      if (!res.ok) throw new Error((await res.json()).error || "Failed to save game");
      
      if (editingGameId) {
          cancelEdit();
      } else {
          setAwayTeamId('');
          setHomeTeamId('');
      }

      setSaving(false);
      await fetchSchedule(); 
      
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center text-[#ffd60a] font-black italic text-2xl md:text-4xl animate-pulse">Warming up the Bullpen...</div>;

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] p-3 md:p-8 font-sans border-[8px] md:border-[16px] border-[#c1121f]">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-6 md:mb-8 border-b-4 border-[#c1121f] pb-4">
          <Link href={`/admin/leagues/${leagueId}/seasons/${seasonId}`} className="text-[10px] md:text-xs font-black uppercase text-[#669bbc] hover:text-[#ffd60a] tracking-widest mb-3 inline-block transition-colors">
            ← Return to Season Hub
          </Link>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black italic uppercase text-[#ffd60a] tracking-tighter drop-shadow-[2px_2px_0px_#c1121f] md:drop-shadow-[4px_4px_0px_#c1121f] leading-none mb-2">
            Schedule Maker
          </h1>
          <p className="text-[#669bbc] font-bold uppercase text-[10px] md:text-xs tracking-widest">
            {season?.league?.name} // {season?.name}
          </p>
        </div>

        {error && (
          <div className="bg-[#c1121f] text-white p-3 md:p-4 mb-6 border-2 md:border-4 border-[#001d3d] shadow-[4px_4px_0px_#000] md:shadow-[8px_8px_0px_#000]">
            <p className="text-[10px] font-black uppercase tracking-widest">Error: {error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
          
          {/* LEFT: THE SCHEDULING FORM */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            <form onSubmit={handleSubmit} className={`bg-white text-[#001d3d] p-4 md:p-6 border-4 shadow-[8px_8px_0px_#c1121f] md:shadow-[12px_12px_0px_#c1121f] space-y-6 transition-all ${editingGameId ? 'border-[#22c55e] shadow-[#22c55e]' : 'border-[#001d3d]'}`}>
              
              {/* Visual Indicator for Edit Mode */}
              {editingGameId && (
                <div className="bg-[#22c55e] text-[#001d3d] -mx-4 md:-mx-6 -mt-4 md:-mt-6 mb-6 p-3 flex justify-between items-center font-black uppercase italic tracking-widest">
                   <span>Editing Game #{editingGameId}</span>
                   <button type="button" onClick={cancelEdit} className="text-white hover:text-red-900 bg-black/20 px-3 py-1 text-xs">Cancel Edit</button>
                </div>
              )}

              {/* TEAM SELECTION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#fdf0d5] p-4 border-2 border-[#001d3d]">
                <div className="flex flex-col">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#c1121f] mb-1.5">Away Team (Visitor)</label>
                  <select 
                    value={awayTeamId} 
                    onChange={(e) => setAwayTeamId(e.target.value)}
                    className="w-full bg-white border-2 border-[#001d3d] p-3 font-black uppercase text-sm md:text-base outline-none focus:border-[#669bbc] cursor-pointer"
                    required
                  >
                    <option value="">-- Select Away --</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#001d3d] mb-1.5">Home Team</label>
                  <select 
                    value={homeTeamId} 
                    onChange={(e) => setHomeTeamId(e.target.value)}
                    className="w-full bg-white border-2 border-[#001d3d] p-3 font-black uppercase text-sm md:text-base outline-none focus:border-[#669bbc] cursor-pointer"
                    required
                  >
                    <option value="">-- Select Home --</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              {/* GAME DETAILS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="flex flex-col sm:flex-row gap-4 sm:col-span-2">
                  <div className="flex flex-col flex-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#669bbc] mb-1.5">Date</label>
                    <input 
                      type="date" 
                      value={scheduledDate} 
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full bg-[#fdf0d5] border-2 border-[#001d3d] p-2.5 font-bold outline-none focus:border-[#c1121f] text-sm cursor-pointer"
                      required
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#669bbc] mb-1.5">Time</label>
                    <select 
                      value={scheduledTime} 
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full bg-[#fdf0d5] border-2 border-[#001d3d] p-2.5 font-bold outline-none focus:border-[#c1121f] text-sm cursor-pointer"
                      required
                    >
                      <option value="">-- Select Time --</option>
                      {TIME_OPTIONS.map(t => (
                        <option key={t.val} value={t.val}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#669bbc] mb-1.5">Event (Optional)</label>
                  <select 
                    value={eventId} 
                    onChange={(e) => setEventId(e.target.value)}
                    className="w-full bg-[#fdf0d5] border-2 border-[#001d3d] p-2.5 font-bold uppercase text-xs outline-none focus:border-[#c1121f] cursor-pointer truncate"
                  >
                    <option value="">-- Standalone Game --</option>
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#669bbc] mb-1.5">Location / Stadium</label>
                  {/* ⚡ THE DATALIST FOR REMEMBERED FIELDS */}
                  <input 
                    type="text" 
                    list="saved-fields-list"
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Fenway Park"
                    className="w-full bg-[#fdf0d5] border-2 border-[#001d3d] p-2.5 font-bold uppercase text-xs outline-none focus:border-[#c1121f]"
                  />
                  <datalist id="saved-fields-list">
                     {savedFields.map(f => <option key={f} value={f} />)}
                  </datalist>
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#669bbc] mb-1.5">Field Number</label>
                  <select 
                    value={fieldNumber} 
                    onChange={(e) => setFieldNumber(e.target.value)}
                    className="w-full bg-[#fdf0d5] border-2 border-[#001d3d] p-2.5 font-bold text-xs outline-none focus:border-[#c1121f] cursor-pointer"
                  >
                    <option value="">-- TBD --</option>
                    {FIELD_OPTIONS.map(num => (
                      <option key={num} value={num}>Field {num}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-[#fdf0d5] p-3 border-2 border-[#001d3d]">
                <input 
                  type="checkbox" 
                  id="isPlayoff"
                  checked={isPlayoff}
                  onChange={(e) => setIsPlayoff(e.target.checked)}
                  className="w-5 h-5 accent-[#c1121f] cursor-pointer shrink-0"
                />
                <label htmlFor="isPlayoff" className="text-xs md:text-sm font-black uppercase tracking-widest cursor-pointer mt-0.5 select-none">
                  This is a Playoff/Tournament Game
                </label>
              </div>

              {/* PITCHING OVERRIDE */}
              <div className="border-2 border-[#001d3d] bg-slate-50">
                <label className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-100 transition-colors select-none">
                  <div className="pr-4">
                    <h3 className="text-xs md:text-sm font-black uppercase text-[#001d3d]">Pitching Style Override</h3>
                    <p className="text-[9px] font-bold uppercase text-[#669bbc] tracking-widest mt-0.5">
                      Default: {season?.isSpeedRestricted ? `Medium Pitch (${season.speedLimit}mph)` : 'Fast Pitch (No Limit)'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#c1121f]">Override?</span>
                    <input 
                      type="checkbox" 
                      checked={overrideSpeed}
                      onChange={(e) => setOverrideSpeed(e.target.checked)}
                      className="w-5 h-5 accent-[#c1121f] cursor-pointer"
                    />
                  </div>
                </label>

                {overrideSpeed && (
                  <div className="border-t-2 border-slate-200 p-3 bg-white grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex flex-col">
                       <label className="text-[9px] font-black uppercase tracking-widest text-[#001d3d] mb-1">Game Style</label>
                       <select
                         value={isSpeedRestricted ? 'true' : 'false'}
                         onChange={(e) => setIsSpeedRestricted(e.target.value === 'true')}
                         className="w-full bg-[#fdf0d5] border-2 border-[#001d3d] p-2 font-bold uppercase text-xs outline-none focus:border-[#c1121f] cursor-pointer"
                       >
                         <option value="false">Fast Pitch</option>
                         <option value="true">Medium Pitch</option>
                       </select>
                    </div>
                    {isSpeedRestricted && (
                      <div className="flex flex-col">
                         <label className="text-[9px] font-black uppercase tracking-widest text-[#c1121f] mb-1">Speed Limit</label>
                         <select
                           value={speedLimit}
                           onChange={(e) => setSpeedLimit(parseInt(e.target.value))}
                           className="w-full bg-[#fdf0d5] border-2 border-[#c1121f] p-2 font-bold text-xs outline-none focus:border-[#001d3d] cursor-pointer"
                         >
                           {SPEED_OPTIONS.map(speed => (
                             <option key={speed} value={speed}>{speed} MPH</option>
                           ))}
                         </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={saving}
                className={`w-full text-white py-4 md:py-5 font-black italic uppercase tracking-[0.2em] text-lg border-4 transition-all shadow-[4px_4px_0px_#000] md:shadow-[6px_6px_0px_#000] active:translate-y-1 active:shadow-none disabled:opacity-50 ${editingGameId ? 'bg-[#22c55e] border-[#001d3d] text-[#001d3d] hover:bg-white hover:text-[#22c55e]' : 'bg-[#c1121f] border-[#001d3d] hover:bg-[#ffd60a] hover:text-[#001d3d]'}`}
              >
                {saving ? 'Processing...' : editingGameId ? '✓ Update Game' : '+ Add to Schedule'}
              </button>

            </form>
          </div>

          {/* RIGHT: UPCOMING MATCHUPS LIST */}
          <div className="lg:col-span-1 border-4 border-[#001d3d] bg-[#fdf0d5] flex flex-col h-full max-h-[800px] shadow-[8px_8px_0px_#000]">
            <div className="bg-[#001d3d] text-white p-4 border-b-4 border-[#c1121f]">
              <h2 className="text-xl font-black italic uppercase tracking-widest">Upcoming Matchups</h2>
              <p className="text-[9px] font-bold text-[#669bbc] uppercase tracking-[0.3em]">Scheduled Games Only</p>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-white">
              {upcomingGames.length === 0 ? (
                <div className="text-center p-6 border-2 border-dashed border-[#001d3d] bg-slate-50">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">No upcoming games scheduled.</p>
                </div>
              ) : (
                upcomingGames.map((game: any) => {
                  const gameDate = new Date(game.scheduledAt);
                  const isToday = new Date().toDateString() === gameDate.toDateString();
                  const isCurrentlyEditing = editingGameId === game.id;

                  return (
                    <div key={game.id} className={`border-2 transition-all p-3 shadow-[2px_2px_0px_#c1121f] hover:bg-slate-50 ${isCurrentlyEditing ? 'border-[#22c55e] bg-green-50 translate-x-2' : 'border-[#001d3d]'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 ${isToday ? 'bg-[#c1121f] text-white' : 'bg-[#001d3d] text-white'}`}>
                          {isToday ? 'TODAY' : gameDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-[9px] font-bold text-[#669bbc] uppercase tracking-widest">
                          {gameDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-1 text-sm font-black uppercase tracking-tighter text-[#001d3d]">
                        <div className="flex justify-between items-center">
                          <span className="truncate">{game.awayTeam?.name}</span>
                          <span className="text-[8px] text-slate-400 tracking-widest">(A)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#c1121f] text-[10px]">@</span>
                          <span className="truncate">{game.homeTeam?.name}</span>
                        </div>
                      </div>

                      {(game.location || game.fieldNumber) && (
                        <div className="mt-2 pt-2 border-t border-slate-200 text-[8px] font-bold uppercase text-slate-500 tracking-widest flex gap-2">
                          {game.location && <span>📍 {game.location}</span>}
                          {game.fieldNumber && <span>FIELD {game.fieldNumber}</span>}
                        </div>
                      )}

                      {/* Edit & Delete Action Buttons */}
                      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3">
                         <button onClick={() => handleEditClick(game)} className="bg-[#669bbc]/10 text-[#001d3d] border border-[#669bbc]/30 text-[9px] font-black uppercase py-1.5 hover:bg-[#669bbc] hover:text-white transition-all">
                             Edit
                         </button>
                         <button onClick={() => handleDeleteClick(game.id)} className="bg-[#c1121f]/5 text-[#c1121f] border border-[#c1121f]/20 text-[9px] font-black uppercase py-1.5 hover:bg-[#c1121f] hover:text-white transition-all">
                             Delete
                         </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}