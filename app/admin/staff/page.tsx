'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StaffApprovals() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // In a real app, this would fetch from /api/admin/users
  useEffect(() => {
    // Mocking pending and approved users
    const mockUsers = [
      { id: 101, name: "Derek V.", email: "derek@wiffle.com", roleLevel: 1, isApproved: false, requestedAt: "2026-03-15" },
      { id: 102, name: "Sarah K.", email: "sk@wiffle.com", roleLevel: 1, isApproved: true, requestedAt: "2026-03-10" },
    ];
    setUsers(mockUsers);
    setLoading(false);
  }, []);

  const toggleApproval = (id: number) => {
    setUsers(users.map(u => u.id === id ? { ...u, isApproved: !u.isApproved } : u));
    // Here you would call fetch('/api/admin/users/approve', { method: 'POST', ... })
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 md:p-16 font-sans">
      <div className="max-w-5xl mx-auto">
        
        <header className="mb-12 flex justify-between items-end">
          <div>
            <Link href="/admin/dashboard" className="text-[10px] font-black uppercase tracking-[.3em] text-slate-500 hover:text-red-500 transition-colors">
              ← Command Center
            </Link>
            <h1 className="text-6xl font-black italic uppercase tracking-tighter mt-4">Staff Manifest</h1>
            <p className="text-red-600 font-bold uppercase text-[10px] tracking-[.4em] mt-2">Personnel Authorization</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-black uppercase text-slate-500">Active Personnel</p>
            <p className="text-3xl font-black italic">{users.filter(u => u.isApproved).length}</p>
          </div>
        </header>

        {/* USERS TABLE */}
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Operator</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Level</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Status</th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-6">
                    <p className="font-bold text-lg leading-none">{user.name}</p>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase">{user.email}</p>
                  </td>
                  <td className="p-6">
                    <span className="bg-slate-800 text-slate-400 text-[9px] font-black px-3 py-1 rounded-md">
                      L{user.roleLevel}
                    </span>
                  </td>
                  <td className="p-6">
                    {user.isApproved ? (
                      <span className="text-green-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Authorized
                      </span>
                    ) : (
                      <span className="text-red-600 text-[10px] font-black uppercase tracking-widest">Pending</span>
                    )}
                  </td>
                  <td className="p-6 text-right">
                    <button 
                      onClick={() => toggleApproval(user.id)}
                      className={`px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest transition-all ${
                        user.isApproved 
                        ? 'border border-white/10 text-slate-500 hover:border-red-600 hover:text-red-600' 
                        : 'bg-red-600 text-white hover:bg-white hover:text-black'
                      }`}
                    >
                      {user.isApproved ? 'Revoke' : 'Authorize'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="mt-8">
          <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">
            Level 2 admins can only authorize Level 1 staff for their specific league.
          </p>
        </footer>
      </div>
    </div>
  );
}