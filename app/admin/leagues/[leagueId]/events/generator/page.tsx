'use client';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function GeneratorForm() {
  const { leagueId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSeasonId = searchParams.get('seasonId');
  
  const [teams, setTeams] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  
  // Form State
  const [selectedSeason, setSelectedSeason] = useState(urlSeasonId || '');
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  
  // --- EVENT SELECTION STATE ---
  const [creationMode, setCreationMode] = useState<'new' | 'existing'>('existing');
  const [existingEvents, setExistingEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eventName, setEventName] = useState('');
  
  // --- SCHEDULE CONTROLS ---
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]); 
  const [startTime, setStartTime] = useState('09:00'); 
  const [numFields, setNumFields] = useState(1);       
  const [gameDuration, setGameDuration] = useState(60); 
  const [gamesPerTeam, setGamesPerTeam] = useState(3);  
  
  const [previewSchedule, setPreviewSchedule] = useState<any[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- DROPDOWN OPTION GENERATORS ---
  const timeOptions = useMemo(() => {
    const times = [];
    for (let h = 6; h <= 22; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hour = h.toString().padStart(2, '0');
        const min = m.toString().padStart(2, '0');
        const timeValue = `${hour}:${min}`;
        const displayHour = h % 12 || 12;
        const ampm = h < 12 ? 'AM' : 'PM';
        const displayStr = `${displayHour}:${min} ${ampm}`;
        times.push({ value: timeValue, display: displayStr });
      }
    }
    return times;
  }, []);

  const fieldOptions = Array.from({ length: 20 }, (_, i) => i + 1);
  const durationOptions = Array.from({ length: 24 }, (_, i) => 15 + (i * 5)); 
  const gamesOptions = Array.from({ length: 15 }, (_, i) => i + 1);

  // 1. Initial Load (Teams & Seasons)
  useEffect(() => {
    fetch('/api/teams')
      .then(res => res.json())
      .then(data => setTeams(data.filter((t: any) => t.leagueId === parseInt(leagueId as string))));
      
    fetch(`/api/admin/seasons`) 
      .then(res => res.json())
      .then(data => setSeasons(data.filter((s: any) => s.leagueId === parseInt(leagueId as string))));
  }, [leagueId]);

  // 2. Fetch Events dynamically when Season is selected
  useEffect(() => {
    if (selectedSeason) {
      fetch(`/api/admin/seasons/${selectedSeason}/events`)
        .then(res => res.json())
        .then(data => {
           setExistingEvents(data);
           // If there are no existing events, force mode to 'new'
           if (data.length === 0) setCreationMode('new');
        })
        .catch(console.error);
    } else {
      setExistingEvents([]);
    }
  }, [selectedSeason]);

  // 3. Auto-fill date/time when an existing event is selected
  useEffect(() => {
    if (creationMode === 'existing' && selectedEventId) {
      const targetEvent = existingEvents.find(e => String(e.id) === String(selectedEventId));
      if (targetEvent && targetEvent.startDate) {
        const d = new Date(targetEvent.startDate);
        setStartDate(d.toISOString().split('T')[0]);
        
        let h = d.getHours();
        let m = Math.round(d.getMinutes() / 15) * 15;
        if (m === 60) {
          h = (h + 1) % 24;
          m = 0;
        }
        setStartTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
  }, [selectedEventId, creationMode, existingEvents]);

  const toggleTeam = (id: number) => {
    setSelectedTeams(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const generateRoundRobin = () => {
    if (selectedTeams.length < 2) return alert("Select at least 2 teams!");

    let teamsToSchedule = [...teams.filter(t => selectedTeams.includes(t.id))]
      .sort(() => Math.random() - 0.5);
    
    if (teamsToSchedule.length % 2 !== 0) {
      teamsToSchedule.push({ id: 'BYE', name: '* BYE WEEK *' });
    }

    const gamesPerRound = teamsToSchedule.length / 2;
    const schedule: any[] = [];

    const homeCounts: Record<string, number> = {};
    const gamesPlayed: Record<string, number> = {}; // TRACKER: Count games for every real team

    teamsToSchedule.filter(t => t.id !== 'BYE').forEach(t => { 
      homeCounts[t.id] = 0; 
      gamesPlayed[t.id] = 0;
    });

    const [year, month, day] = startDate.split('-').map(Number);
    const [hour, minute] = startTime.split(':').map(Number);
    let currentTime = new Date(year, month - 1, day, hour, minute);

    let round = 0;

    // ALGORITHM FIX: Spin the wheel until EVERY team hits the minimum requested games
    while (Math.min(...Object.values(gamesPlayed)) < gamesPerTeam) {
      let currentRoundGames: any[] = []; 

      for (let i = 0; i < gamesPerRound; i++) {
        const t1 = teamsToSchedule[i];
        const t2 = teamsToSchedule[teamsToSchedule.length - 1 - i];

        if (t1.id !== 'BYE' && t2.id !== 'BYE') {
          let home, away;
          if (homeCounts[t1.id] < homeCounts[t2.id]) {
            home = t1; away = t2;
          } else if (homeCounts[t2.id] < homeCounts[t1.id]) {
            home = t2; away = t1;
          } else {
            if (Math.random() > 0.5) { home = t1; away = t2; } 
            else { home = t2; away = t1; }
          }

          homeCounts[home.id]++; 
          gamesPlayed[t1.id]++;
          gamesPlayed[t2.id]++;

          currentRoundGames.push({
            id: Math.random().toString(), 
            round: round + 1,
            homeTeamId: home.id,
            awayTeamId: away.id,
            homeTeamName: home.name,
            awayTeamName: away.name,
          });
        }
      }

      let fieldCounter = 1;
      currentRoundGames.forEach(game => {
        game.fieldNumber = fieldCounter;
        game.scheduledAt = new Date(currentTime).toISOString(); 
        game.timeDisplay = new Date(currentTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

        fieldCounter++;
        
        if (fieldCounter > numFields) {
          fieldCounter = 1;
          currentTime.setMinutes(currentTime.getMinutes() + gameDuration);
        }
      });

      schedule.push(...currentRoundGames);

      if (fieldCounter > 1) {
         currentTime.setMinutes(currentTime.getMinutes() + gameDuration);
      }

      // Circle Method Rotation
      teamsToSchedule.splice(1, 0, teamsToSchedule.pop());
      
      round++;
      
      // Failsafe to prevent browser crashing if user enters a wildly high number
      if (round > 50) break;
    }

    setPreviewSchedule(schedule);
  };

  const saveTournament = async () => {
    if (!selectedSeason || !previewSchedule) return alert("Missing required info!");
    if (creationMode === 'new' && !eventName) return alert("Please provide a name for the new event.");
    if (creationMode === 'existing' && !selectedEventId) return alert("Please select a target event.");

    setIsSaving(true);

    const res = await fetch('/api/admin/events/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: creationMode === 'existing' ? selectedEventId : undefined,
        eventName: creationMode === 'new' ? eventName : undefined,
        seasonId: selectedSeason,
        schedule: previewSchedule
      })
    });

    if (res.ok) {
      if (urlSeasonId) {
        router.push(`/admin/leagues/${leagueId}/seasons/${urlSeasonId}`);
      } else {
        router.push(`/admin/leagues/${leagueId}`); 
      }
    } else {
      alert("Failed to save schedule.");
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#001d3d] text-white p-8 md:p-12 border-[16px] border-[#c1121f]">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-12 border-b-4 border-[#ffd60a] pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-6xl font-black italic uppercase tracking-tighter">Event Generator</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#669bbc] mt-2">Automated Round-Robin Scheduling</p>
          </div>
          <Link href={urlSeasonId ? `/admin/leagues/${leagueId}/seasons/${urlSeasonId}` : `/admin/leagues/${leagueId}`} className="text-xs font-bold uppercase text-[#ffd60a] hover:underline">
            Cancel
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-4 space-y-8">
            
            <div className="bg-white/5 p-6 border-2 border-white/10">
              <label className="block text-xs font-black uppercase tracking-widest text-[#ffd60a] mb-2">Attached Circuit</label>
              <select 
                value={selectedSeason} 
                onChange={e => setSelectedSeason(e.target.value)} 
                disabled={!!urlSeasonId}
                className="w-full bg-black/50 border border-white/20 p-3 font-bold text-white outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <option value="">-- Select Circuit --</option>
                {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className={`bg-white/5 p-6 border-2 border-white/10 transition-opacity ${!selectedSeason ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-black uppercase tracking-widest text-[#ffd60a]">Target Event</label>
                <div className="flex gap-2 bg-black/50 p-1 border border-white/10">
                  <button 
                    onClick={() => setCreationMode('existing')} 
                    className={`px-3 py-1 text-[10px] font-black uppercase transition-colors ${creationMode === 'existing' ? 'bg-[#ffd60a] text-[#001d3d]' : 'text-slate-400 hover:text-white'}`}
                  >
                    Existing
                  </button>
                  <button 
                    onClick={() => setCreationMode('new')} 
                    className={`px-3 py-1 text-[10px] font-black uppercase transition-colors ${creationMode === 'new' ? 'bg-[#ffd60a] text-[#001d3d]' : 'text-slate-400 hover:text-white'}`}
                  >
                    New
                  </button>
                </div>
              </div>
              
              {creationMode === 'existing' ? (
                <select 
                  value={selectedEventId} 
                  onChange={e => setSelectedEventId(e.target.value)} 
                  className="w-full bg-black/50 border border-white/20 p-3 font-bold text-white outline-none focus:border-[#ffd60a] cursor-pointer"
                >
                  <option value="">-- Select Event to Populate --</option>
                  {existingEvents.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              ) : (
                <input 
                  type="text" 
                  value={eventName} 
                  onChange={e => setEventName(e.target.value)} 
                  placeholder="e.g., ADK Summer Shootout" 
                  className="w-full bg-black/50 border border-white/20 p-3 font-bold text-white outline-none focus:border-[#ffd60a]" 
                />
              )}
            </div>

            <div className="bg-white/5 p-6 border-2 border-white/10">
              <label className="block text-xs font-black uppercase tracking-widest text-[#ffd60a] mb-4">Select Participating Teams</label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {teams.map(team => (
                  <button key={team.id} onClick={() => toggleTeam(team.id)} className={`w-full text-left p-3 font-bold uppercase text-sm border-2 transition-all ${selectedTeams.includes(team.id) ? 'bg-[#c1121f] border-[#c1121f] text-white' : 'bg-transparent border-white/20 text-slate-400 hover:border-white/50'}`}>
                    {team.name}
                  </button>
                ))}
                {teams.length === 0 && <p className="text-slate-500 italic text-sm">No teams found in this league.</p>}
              </div>
            </div>

            <div className="bg-white/5 p-6 border-2 border-white/10">
               <label className="block text-xs font-black uppercase tracking-widest text-[#ffd60a] mb-2">Tournament Date</label>
               <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-black/50 border border-white/20 p-3 font-bold text-white outline-none cursor-pointer hover:border-[#ffd60a] transition-colors" />
            </div>

            <div className="bg-white/5 p-6 border-2 border-white/10">
               <label className="block text-xs font-black uppercase tracking-widest text-[#ffd60a] mb-2">First Pitch (Start Time)</label>
               <select value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-black/50 border border-white/20 p-3 font-bold text-white outline-none cursor-pointer hover:border-[#ffd60a] transition-colors">
                 {timeOptions.map((t) => (
                   <option key={t.value} value={t.value}>{t.display}</option>
                 ))}
               </select>
            </div>

            <div className="bg-white/5 p-6 border-2 border-white/10">
               <label className="block text-xs font-black uppercase tracking-widest text-[#ffd60a] mb-2">Available Fields</label>
               <select value={numFields} onChange={e => setNumFields(parseInt(e.target.value))} className="w-full bg-black/50 border border-white/20 p-3 font-bold text-white outline-none cursor-pointer hover:border-[#ffd60a] transition-colors">
                 {fieldOptions.map(n => (
                   <option key={n} value={n}>{n} {n === 1 ? 'Field' : 'Fields'}</option>
                 ))}
               </select>
            </div>

            <div className="bg-white/5 p-6 border-2 border-white/10">
               <label className="block text-xs font-black uppercase tracking-widest text-[#ffd60a] mb-2">Minutes Per Game</label>
               <select value={gameDuration} onChange={e => setGameDuration(parseInt(e.target.value))} className="w-full bg-black/50 border border-white/20 p-3 font-bold text-white outline-none cursor-pointer hover:border-[#ffd60a] transition-colors">
                 {durationOptions.map(n => (
                   <option key={n} value={n}>{n} Minutes</option>
                 ))}
               </select>
            </div>

            <div className="bg-white/5 p-6 border-2 border-white/10">
               <label className="block text-xs font-black uppercase tracking-widest text-[#ffd60a] mb-2">Game Guarantee (Per Team)</label>
               <select value={gamesPerTeam} onChange={e => setGamesPerTeam(parseInt(e.target.value))} className="w-full bg-black/50 border border-white/20 p-3 font-bold text-white outline-none cursor-pointer hover:border-[#ffd60a] transition-colors">
                 {gamesOptions.map(n => (
                   <option key={n} value={n}>{n} {n === 1 ? 'Game' : 'Games'}</option>
                 ))}
               </select>
            </div>

            <button onClick={generateRoundRobin} className="w-full bg-[#ffd60a] text-[#001d3d] p-6 font-black italic uppercase text-2xl hover:bg-white transition-colors">
              Generate Schedule
            </button>
          </div>

          <div className="lg:col-span-8">
             {previewSchedule ? (
               <div className="bg-black/20 p-8 border-4 border-[#669bbc] min-h-full flex flex-col">
                 <div className="flex justify-between items-center mb-8 border-b-2 border-white/10 pb-4">
                   <h2 className="text-2xl font-black italic uppercase text-[#669bbc]">Schedule Preview</h2>
                   <p className="text-sm font-bold bg-[#669bbc] text-[#001d3d] px-3 py-1">
                     {new Date(`${startDate}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • {previewSchedule.length} Games
                   </p>
                 </div>

                 <div className="space-y-3 mb-8 flex-1 overflow-y-auto pr-4 min-h-[400px] custom-scrollbar">
                   {previewSchedule.map((game) => (
                     <div key={game.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/5 p-4 border-l-4 border-[#ffd60a] hover:bg-white/10 gap-4">
                       <div className="flex items-center gap-6">
                         <span className="text-xl font-black italic text-slate-500 w-24">{game.timeDisplay}</span>
                         <span className="text-xl font-black italic uppercase">
                           {game.awayTeamName} <span className="text-[#669bbc] mx-2 text-sm">@</span> {game.homeTeamName}
                         </span>
                       </div>
                       <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-[#669bbc]">
                         <span>Round {game.round}</span>
                         <span>Field {game.fieldNumber}</span>
                       </div>
                     </div>
                   ))}
                 </div>

                 <button onClick={saveTournament} disabled={isSaving} className="w-full bg-[#c1121f] text-white p-6 font-black italic uppercase text-2xl border-4 border-[#001d3d] shadow-[8px_8px_0px_#ffd60a] hover:translate-y-1 hover:shadow-[4px_4px_0px_#ffd60a] transition-all disabled:opacity-50 mt-auto">
                    {isSaving ? 'Deploying to Gameday Board...' : 'Confirm & Save Event'}
                 </button>
               </div>
             ) : (
               <div className="h-full border-4 border-dashed border-white/10 flex items-center justify-center flex-col text-slate-500 p-12 text-center min-h-[500px]">
                 <p className="text-2xl font-black italic uppercase mb-2">Awaiting Parameters</p>
                 <p className="text-sm font-bold uppercase tracking-widest">Select teams and hit Generate to preview the matchups.</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TournamentGeneratorWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#001d3d] text-white flex items-center justify-center font-black italic text-4xl animate-pulse">BOOTING GENERATOR...</div>}>
      <GeneratorForm />
    </Suspense>
  );
}