'use client';
import { useState, useEffect } from 'react';

export default function SchedulePage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [homeId, setHomeId] = useState('');
  const [awayId, setAwayId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('18:00'); // Default to 6:00 PM
  const [loading, setLoading] = useState(true);

  // Generate 10-minute increments for the dropdown
  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 10) {
      const h = hour.toString().padStart(2, '0');
      const m = min.toString().padStart(2, '0');
      const displayHour = hour % 12 || 12;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      timeOptions.push({ value: `${h}:${m}`, label: `${displayHour}:${m} ${ampm}` });
    }
  }

  useEffect(() => {
    fetch('/api/teams').then(res => res.json()).then(data => {
      setTeams(data);
      setLoading(false);
    });
  }, []);

  const scheduleGame = async () => {
    if (!homeId || !awayId || !selectedDate || !selectedTime) {
      return alert("Please fill out all fields!");
    }

    // Merge Date and Time strings
    const combinedDateTime = new Date(`${selectedDate}T${selectedTime}`);

    const res = await fetch('/api/games', {
      method: 'POST',
      body: JSON.stringify({
        homeTeamId: homeId,
        awayTeamId: awayId,
        scheduledAt: combinedDateTime.toISOString()
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (res.ok) alert("Game Scheduled!");
  };

  return (
    <div className="p-8 max-w-md mx-auto bg-slate-900 text-white rounded-xl shadow-2xl mt-10">
      <h1 className="text-2xl font-black mb-6 border-b border-slate-700 pb-2">SCHEDULE MAKER</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1">VISITOR</label>
          <select className="w-full bg-slate-800 p-3 rounded border border-slate-700" onChange={(e) => setAwayId(e.target.value)}>
            <option value="">Select Team</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1">HOME</label>
          <select className="w-full bg-slate-800 p-3 rounded border border-slate-700" onChange={(e) => setHomeId(e.target.value)}>
            <option value="">Select Team</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">DATE</label>
            <input 
              type="date" 
              className="w-full bg-slate-800 p-3 rounded border border-slate-700 text-white"
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">START TIME</label>
            <select 
              className="w-full bg-slate-800 p-3 rounded border border-slate-700 text-white"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
            >
              {timeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          onClick={scheduleGame} 
          className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded font-black text-lg transition-all mt-4"
        >
          CONFIRM MATCHUP
        </button>
      </div>
    </div>
  );
}