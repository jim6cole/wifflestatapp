'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function StaffManager({ params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = use(params);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaff();
  }, [leagueId]);

  const fetchStaff = async () => {
    try {
      const res = await fetch(`/api/admin/leagues/${leagueId}/staff`, { cache: 'no-store' });
      if (res.ok) setStaff(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApproval = async (membershipId: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/leagues/${leagueId}/staff`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId, isApproved: !currentStatus })
      });
      if (res.ok) fetchStaff(); // Refresh the list
    } catch (error) {
      alert("Failed to update status.");
    }
  };

  const handleRoleChange = async (membershipId: number, newRole: number) => {
    try {
      const res = await fetch(`/api/admin/leagues/${leagueId}/staff`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipId, roleLevel: newRole })
      });
      if (res.ok) fetchStaff();
    } catch (error) {
      alert("Failed to update role.");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black uppercase text-white animate-pulse italic text-2xl">Loading Personnel...</div>;

  const pending = staff.filter(s => !s.isApproved);
  const active = staff.filter(s => s.isApproved);

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] font-sans p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-5xl mx-auto">
        
        <header className="mb-12 border-b-4 border-[#669bbc] pb-6 flex justify-between items-end">
          <div>
            <Link href={`/admin/leagues/${leagueId}`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white transition-colors mb-4 block">
              ← Back to League Hub
            </Link>
            <h1 className="text-6xl md:text-7xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f] mt-2">
              User Access
            </h1>
            <p className="text-[#669bbc] font-bold uppercase text-xs tracking-[0.4em] mt-2 italic">League Personnel Authorization</p>
          </div>
        </header>

        {/* PENDING REQUESTS */}
        {pending.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-black italic uppercase text-[#ffd60a] mb-4 drop-shadow-[2px_2px_0px_#003566] flex items-center gap-3">
              <span className="w-3 h-3 bg-[#ffd60a] rounded-full animate-pulse"></span>
              Pending Requests ({pending.length})
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {pending.map((member) => (
                <StaffRow 
                  key={member.id} 
                  member={member} 
                  onToggle={() => handleToggleApproval(member.id, member.isApproved)} 
                  onChangeRole={(role) => handleRoleChange(member.id, role)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ACTIVE STAFF */}
        <div>
          <h2 className="text-2xl font-black italic uppercase text-white mb-4 border-b border-[#669bbc]/30 pb-2">Active Personnel ({active.length})</h2>
          {active.length === 0 ? (
            <p className="text-sm font-bold text-[#669bbc] uppercase tracking-widest">No active staff members.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {active.map((member) => (
                <StaffRow 
                  key={member.id} 
                  member={member} 
                  onToggle={() => handleToggleApproval(member.id, member.isApproved)} 
                  onChangeRole={(role) => handleRoleChange(member.id, role)}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function StaffRow({ member, onToggle, onChangeRole }: any) {
  const isApproved = member.isApproved;

  return (
    <div className={`bg-[#003566] border-2 ${isApproved ? 'border-[#669bbc]' : 'border-[#ffd60a]'} p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all shadow-lg`}>
      
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-2xl font-black italic uppercase text-white">{member.user.name}</h3>
          {!isApproved && <span className="bg-[#ffd60a] text-[#001d3d] text-[9px] font-black px-2 py-1 uppercase tracking-widest">Pending</span>}
        </div>
        <p className="text-[10px] font-bold text-[#669bbc] uppercase tracking-widest">{member.user.email}</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
        <select 
          value={member.roleLevel} 
          onChange={(e) => onChangeRole(parseInt(e.target.value))}
          className="bg-[#001d3d] border border-[#669bbc] text-white p-3 font-bold uppercase text-[10px] tracking-widest outline-none focus:border-white cursor-pointer w-full sm:w-auto"
        >
          <option value="1">Lvl 1: Scorekeeper</option>
          <option value="2">Lvl 2: Commish</option>
        </select>

        <button 
          onClick={onToggle}
          className={`w-full sm:w-auto px-6 py-3 font-black uppercase italic text-xs tracking-widest transition-all border-2 ${
            isApproved 
              ? 'border-[#c1121f] text-[#c1121f] hover:bg-[#c1121f] hover:text-white' 
              : 'bg-green-600 border-green-400 text-white hover:bg-white hover:text-green-600 shadow-[4px_4px_0px_#001d3d]'
          }`}
        >
          {isApproved ? 'Revoke Access' : 'Approve'}
        </button>
      </div>

    </div>
  );
}