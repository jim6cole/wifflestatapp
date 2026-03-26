'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MasterPlayerRegistry() {
  const [players, setPlayers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    const res = await fetch('/api/admin/players/all');
    if (res.ok) setPlayers(await res.json());
    setLoading(false);
  };

  const formatName = (input: string) => {
    return input.toLowerCase().trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const handleSaveName = async (id: number) => {
    const cleanedName = formatName(editName);
    const res = await fetch(`/api/admin/players/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cleanedName }),
    });

    if (res.ok) {
      setPlayers(players.map(p => p.id === id ? { ...p, name: cleanedName } : p));
      setEditingId(null);
    }
  };

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#001d3d] p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 border-b-8 border-[#ffd60a] pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-6xl font-black italic uppercase text-white tracking-tighter leading-none">Master Roster</h1>
            <p className="text-[#fdf0d5] font-bold uppercase text-xs tracking-[0.3em] mt-2 italic">Wiff+ // Global Player Registry</p>
          </div>
          <Link href="/admin/dashboard" className="bg-white text-[#001d3d] px-4 py-2 font-black uppercase text-[10px] border-4 border-[#001d3d] hover:bg-[#ffd60a]">Back to Clubhouse</Link>
        </header>

        <input 
          type="text" 
          placeholder="Search all players..." 
          className="w-full bg-[#fdf0d5] border-4 border-[#001d3d] p-5 text-[#001d3d] font-black outline-none focus:border-[#ffd60a] mb-8 uppercase"
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="space-y-4">
          {filteredPlayers.map(player => (
            <div key={player.id} className="bg-white border-4 border-[#001d3d] p-4 flex justify-between items-center shadow-[6px_6px_0px_#000]">
              {editingId === player.id ? (
                <div className="flex gap-2 flex-1 mr-4">
                  <input 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 border-2 border-[#001d3d] p-2 font-bold uppercase text-[#001d3d]"
                  />
                  <button onClick={() => handleSaveName(player.id)} className="bg-green-600 text-white px-4 font-bold uppercase text-xs">Save</button>
                  <button onClick={() => setEditingId(null)} className="bg-slate-400 text-white px-4 font-bold uppercase text-xs">Cancel</button>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-xl font-black uppercase italic text-[#001d3d]">{player.name}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">System ID: {player.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setEditingId(player.id); setEditName(player.name); }}
                      className="border-2 border-[#001d3d] px-3 py-1 text-[10px] font-black uppercase hover:bg-[#001d3d] hover:text-white transition-colors"
                    >
                      Edit Name
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}