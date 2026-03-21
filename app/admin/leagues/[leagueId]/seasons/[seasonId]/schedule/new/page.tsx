'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function GameScheduler({ params }: { params: Promise<{ leagueId: string, seasonId: string }> }) {
  const { leagueId, seasonId } = use(params);
  
  const [activeTeams, setActiveTeams] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [gameDate, setGameDate] = useState('');
  const [gameTime, setGameTime] = useState('');

  // 1. GENERATE 15-MINUTE TIME SLOTS
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 15) {
        const h = hour.toString().padStart(2, '0');
        const m = min.toString().padStart(2, '0');
        const value = `${h}:${m}`;
        
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        const label = `${displayHour}:${m} ${period}`;
        
        slots.push({ value, label });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  useEffect(() => {
    async function fetchScheduleData() {
      try {
        const teamsRes = await fetch(`/api/admin/seasons/${seasonId}/teams`);
        if (teamsRes.ok) {
          const allTeams = await teamsRes.json();
          setActiveTeams(allTeams.filter((t: any) => t.seasonId === parseInt(seasonId)));
        }

        const gamesRes = await fetch(`/api/admin/seasons/${seasonId}/games`);
        if (gamesRes.ok) {
          setGames(await gamesRes.json());
        }
      } catch (error) {
        console.error("Failed to fetch schedule data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchScheduleData();
  }, [seasonId]);

  const handleScheduleGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTeamId || !awayTeamId || !gameDate || !gameTime) return;

    if (homeTeamId === awayTeamId) {
      alert("A team cannot play itself!");
      return;
    }

    const scheduledAt = new Date(`${gameDate}T${gameTime}`).toISOString();

    try {
      const res = await fetch(`/api/admin/seasons/${seasonId}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeTeamId, awayTeamId, scheduledAt }),
      });

      if (res.ok) {
        const newGame = await res.json();
        setGames([...games, newGame].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()));
        
        setHomeTeamId('');
        setAwayTeamId('');
        setGameTime(''); // Reset time after scheduling
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) {
      console.error("Scheduling error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] font-sans p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-6xl mx-auto">
        
        {/* BREADCRUMB / NAV */}
        <div className="mb-12 border-b-4 border-[#669bbc] pb-6">
          <Link href={`/admin/leagues/${leagueId}/seasons`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white transition-colors">
            ← Back to Season Archive
          </Link>
          <h1 className="text-6xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f] mt-2">
            Matchup Generator
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: SCHEDULER FORM */}
          <div className="lg:col-span-1 h-fit bg-[#003566] border-2 border-[#669bbc] p-6 shadow-xl">
            <h2 className="text-2xl font-black italic uppercase mb-6 text-white drop-shadow-[2px_2px_0px_#c1121f]">Schedule Game</h2>
            
            {activeTeams.length < 2 ? (
              <div className="bg-[#c1121f]/20 border-2 border-[#c1121f] p-4 text-center">
                <p className="font-bold text-[#fdf0d5] uppercase text-xs">Not enough active teams!</p>
                <p className="text-[10px] text-white/70 mt-1">Activate at least two franchises in the Team Architect first.</p>
              </div>
            ) : (
              <form onSubmit={handleScheduleGame} className="space-y-6">
                
                {/* MATCHUP ROW */}
                <div className="space-y-4 bg-[#001d3d] border border-[#669bbc]/50 p-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#669bbc] tracking-widest mb-1">Away Team</label>
                    <select 
                      value={awayTeamId} 
                      onChange={(e) => setAwayTeamId(e.target.value)}
                      className="w-full bg-[#003566] border-2 border-[#669bbc] p-3 text-white font-bold uppercase outline-none focus:border-[#fdf0d5]"
                      required
                    >
                      <option value="">Select Away...</option>
                      {activeTeams.map(t => <option key={`away-${t.id}`} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>

                  <div className="text-center font-black italic text-[#c1121f] text-xl">@</div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#669bbc] tracking-widest mb-1">Home Team</label>
                    <select 
                      value={homeTeamId} 
                      onChange={(e) => setHomeTeamId(e.target.value)}
                      className="w-full bg-[#003566] border-2 border-[#669bbc] p-3 text-white font-bold uppercase outline-none focus:border-[#fdf0d5]"
                      required
                    >
                      <option value="">Select Home...</option>
                      {activeTeams.map(t => <option key={`home-${t.id}`} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* DATE & TIME ROW */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#669bbc] tracking-widest mb-1">Date</label>
                    <input 
                      type="date" 
                      value={gameDate}
                      onChange={(e) => setGameDate(e.target.value)}
                      className="w-full bg-[#001d3d] border-2 border-[#669bbc] p-3 text-white font-bold uppercase outline-none focus:border-[#fdf0d5] [color-scheme:dark]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#669bbc] tracking-widest mb-1">Time</label>
                    {/* UPDATED TIME SELECT */}
                    <select 
                      value={gameTime}
                      onChange={(e) => setGameTime(e.target.value)}
                      className="w-full bg-[#001d3d] border-2 border-[#669bbc] p-3 text-white font-bold uppercase outline-none focus:border-[#fdf0d5] cursor-pointer"
                      required
                    >
                      <option value="">Select...</option>
                      {timeSlots.map((slot) => (
                        <option key={slot.value} value={slot.value}>
                          {slot.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-[#c1121f] border-2 border-[#fdf0d5] px-4 py-4 font-black italic uppercase tracking-widest hover:bg-white hover:text-[#c1121f] transition-all shadow-lg active:scale-95"
                >
                  + Add to Calendar
                </button>
              </form>
            )}
          </div>

          {/* RIGHT COLUMN: SEASON SCHEDULE */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-3xl font-black italic uppercase text-white drop-shadow-[2px_2px_0px_#669bbc] mb-6">Upcoming Matches</h2>
            
            {loading ? (
              <div className="bg-[#003566] border-2 border-[#669bbc] p-12 text-center">
                <p className="text-2xl font-black italic uppercase animate-pulse">Scanning Calendar...</p>
              </div>
            ) : games.length === 0 ? (
              <div className="bg-[#003566] border-2 border-[#669bbc] p-12 text-center">
                <p className="text-2xl font-black italic uppercase opacity-50">Schedule is Empty</p>
                <p className="text-[10px] font-bold uppercase text-[#669bbc] mt-2">Generate your first matchup using the console.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {games.map((game) => {
                  const gameDateObj = new Date(game.scheduledAt);
                  return (
                    <div key={game.id} className="bg-[#003566] border-l-8 border-[#c1121f] border-y-2 border-r-2 border-[#669bbc] p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-[#001d3d] transition-colors gap-4">
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-black italic uppercase text-[#fdf0d5]">{game.awayTeam?.name}</span>
                          <span className="text-[10px] font-black text-[#c1121f]">@</span>
                          <span className="text-xl font-black italic uppercase text-white">{game.homeTeam?.name}</span>
                        </div>
                        <p className="text-[10px] font-bold uppercase text-[#669bbc] tracking-widest mt-1">
                          Game ID: {game.id} | Status: {game.status}
                        </p>
                      </div>

                      <div className="bg-[#001d3d] border border-[#669bbc]/50 px-4 py-2 text-right min-w-[140px]">
                        <p className="font-bold text-sm text-white">
                          {gameDateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-[10px] font-black text-[#c1121f] tracking-widest uppercase mt-0.5">
                          {gameDateObj.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}