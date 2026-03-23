'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function UserRegistry() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        setUsers(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  const toggleAdmin = async (userId: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isGlobalAdmin: !currentStatus })
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, isGlobalAdmin: !currentStatus } : u));
      }
    } catch (err) { alert("Couldn't update that MVP status!"); }
  };

  const deleteUser = async (userId: number, name: string) => {
    if (!window.confirm(`Whoa! Delete ${name} for good? This cuts them from the whole Wiff+ roster.`)) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (res.ok) setUsers(users.filter(u => u.id !== userId));
    } catch (err) { alert("Failed to cut the player."); }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black uppercase text-white animate-bounce text-2xl italic">Opening the Clubhouse...</div>;

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] font-sans p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-12 border-b-4 border-[#669bbc] pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <Link href="/admin/dashboard" className="text-[10px] font-black uppercase text-[#ffd60a] tracking-widest hover:text-white transition-colors block mb-4">
              ← Back to Home Base
            </Link>
            <h1 className="text-6xl md:text-9xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f] leading-none">
              The Roster
            </h1>
            <p className="text-[#ffd60a] font-black uppercase text-xs tracking-[0.4em] mt-3 italic">Everyone in the Wiff+ Universe</p>
          </div>
          
          <div className="w-full md:w-80">
            <input 
              type="text" 
              placeholder="Find a teammate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#003566] border-4 border-[#ffd60a] p-4 font-black uppercase italic text-white outline-none focus:bg-[#c1121f] transition-all placeholder:opacity-40"
            />
          </div>
        </header>

        <div className="bg-[#003566] border-4 border-[#669bbc] shadow-[12px_12px_0px_#000] overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/30 text-[#ffd60a]">
                <th className="p-6 font-black uppercase italic tracking-widest text-xs border-r border-white/5">Player Identity</th>
                <th className="p-6 font-black uppercase italic tracking-widest text-xs border-r border-white/5">Active Leagues</th>
                <th className="p-6 font-black uppercase italic tracking-widest text-xs border-r border-white/5">Pro Access</th>
                <th className="p-6 font-black uppercase italic tracking-widest text-xs">Manage</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                  <td className="p-6 border-r border-white/5">
                    <p className="font-black text-2xl uppercase italic leading-none text-white">{u.name || 'Rookie'}</p>
                    <p className="text-[10px] font-bold text-[#669bbc] uppercase tracking-widest mt-1">{u.email}</p>
                    <p className="text-[8px] font-black text-white/20 uppercase mt-2">ID: {u.id} // Joined {new Date(u.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="p-6 border-r border-white/5">
                    <div className="flex flex-wrap gap-2">
                      {u.memberships.length === 0 ? (
                        <span className="text-[10px] font-black text-white/20 uppercase italic">Free Agent</span>
                      ) : (
                        u.memberships.map((m: any) => (
                          <span key={m.id} className={`text-[9px] font-black uppercase px-2 py-1 border-2 ${m.isApproved ? 'bg-[#ffd60a] text-[#001d3d] border-white' : 'bg-black/40 text-[#669bbc] border-white/10 opacity-50'}`}>
                            {m.league.name} {m.roleLevel === 2 ? '🏆' : ''}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="p-6 border-r border-white/5">
                    <button 
                      onClick={() => toggleAdmin(u.id, u.isGlobalAdmin)}
                      className={`px-4 py-2 font-black italic uppercase text-[10px] border-4 transition-all ${u.isGlobalAdmin ? 'bg-[#ffd60a] text-[#001d3d] border-white shadow-[4px_4px_0px_#c1121f]' : 'bg-transparent text-white/30 border-white/10 hover:border-[#ffd60a] hover:text-[#ffd60a]'}`}
                    >
                      {u.isGlobalAdmin ? 'Global MVP' : 'Standard'}
                    </button>
                  </td>
                  <td className="p-6">
                    <button 
                      onClick={() => deleteUser(u.id, u.name)}
                      className="text-[10px] font-black uppercase tracking-widest text-[#c1121f] hover:text-white hover:bg-[#c1121f] border-2 border-[#c1121f] px-4 py-2 transition-all"
                    >
                      Cut Player
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}