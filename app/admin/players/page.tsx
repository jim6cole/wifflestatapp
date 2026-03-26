'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// THE UMPIRE'S LOGIC: Ensures names are always professional
const formatName = (name: string) => {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function MasterPlayerRegistry() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isGlobalAdmin = user?.isGlobalAdmin;
  const router = useRouter();

  const [players, setPlayers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Edit States
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  // Merge States
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [mergeSource, setMergeSource] = useState<any>(null); // The duplicate to delete
  const [mergeTarget, setMergeTarget] = useState<any>(null); // The survivor to keep

  useEffect(() => {
    fetchPlayers();
  }, []);

  async function fetchPlayers() {
    try {
      const res = await fetch('/api/admin/players'); 
      if (res.ok) {
        const data = await res.json();
        setPlayers(data);
      }
    } catch (e) { 
      console.error("Scouting report error:", e); 
    } finally { 
      setLoading(false); 
    }
  }

  const handleUpdateName = async (id: number) => {
    const cleanedName = formatName(editName);
    try {
      const res = await fetch(`/api/admin/players/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanedName }),
      });

      if (res.ok) {
        setPlayers(players.map(p => p.id === id ? { ...p, name: cleanedName } : p));
        setEditingId(null);
      }
    } catch (e) {
      alert("The Umpire called it: Name update failed.");
    }
  };

  const executeMerge = async () => {
    if (!isGlobalAdmin) {
      alert("Unauthorized: Only the Hall of Fame can consolidate rosters.");
      return;
    }

    if (!mergeSource || !mergeTarget) return;
    if (mergeSource.id === mergeTarget.id) return;

    if (!confirm(`Consolidate ${mergeSource.name} into ${mergeTarget.name}? History will be moved, duplicate will be retired.`)) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/players/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keepId: mergeTarget.id, deleteId: mergeSource.id })
      });

      if (res.ok) {
        setPlayers(players.filter(p => p.id !== mergeSource.id));
        setMergeSource(null);
        setMergeTarget(null);
        setIsMergeMode(false);
        alert("Rosters consolidated successfully.");
      } else {
        alert("Merge failed on the server.");
      }
    } catch (e) { 
      alert("Merge failed. Check connection."); 
    } finally { 
      setLoading(false); 
    }
  };

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && players.length === 0) {
    return (
      <div className="min-h-screen bg-[#001d3d] flex items-center justify-center border-[12px] border-[#c1121f]">
        <div className="text-white font-black italic uppercase animate-pulse text-4xl tracking-tighter">
          Scanning Scouting Reports...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#001d3d] p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <header className="mb-12 border-b-8 border-[#ffd60a] pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-6xl font-black italic uppercase text-white tracking-tighter leading-none">Master Roster</h1>
            <p className="text-[#fdf0d5] font-bold uppercase text-xs tracking-[0.3em] mt-2 italic text-white/60">Global Player Database</p>
          </div>
          <div className="flex gap-4">
            {isGlobalAdmin && (
              <button 
                onClick={() => {
                  setIsMergeMode(!isMergeMode);
                  setMergeSource(null);
                  setMergeTarget(null);
                }}
                className={`px-6 py-3 font-black uppercase italic text-sm border-4 transition-all ${isMergeMode ? 'bg-[#ffd60a] border-white text-[#001d3d]' : 'bg-[#c1121f] border-[#001d3d] text-white hover:bg-[#ffd60a] hover:text-[#001d3d]'}`}
              >
                {isMergeMode ? 'Cancel Merge' : 'Merge Mode'}
              </button>
            )}
            <button onClick={() => router.back()} className="bg-white text-[#001d3d] px-6 py-3 font-black uppercase text-sm border-4 border-[#001d3d] hover:bg-[#669bbc] hover:text-white transition-colors">
              Back
            </button>
          </div>
        </header>

        {/* Search Input */}
        {!isMergeMode && (
          <div className="relative mb-8">
            <input 
              type="text" 
              placeholder="Search Player Name..." 
              className="w-full bg-[#fdf0d5] border-4 border-[#001d3d] p-5 text-[#001d3d] font-black outline-none focus:border-[#c1121f] uppercase placeholder:opacity-40"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[#001d3d] font-black italic uppercase text-xs opacity-50">Filter Results</div>
          </div>
        )}

        {/* Merge Console */}
        {isMergeMode && isGlobalAdmin && (
          <div className="bg-white border-8 border-[#ffd60a] p-8 mb-8 shadow-[12px_12px_0px_#000]">
            <h2 className="text-[#001d3d] font-black italic uppercase text-2xl mb-4 text-center">Roster Consolidation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-[#001d3d]">
              <div 
                className={`p-6 border-4 border-dashed min-h-[100px] flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${mergeSource ? 'bg-[#c1121f]/10 border-[#c1121f]' : 'bg-slate-100 border-slate-300 hover:border-slate-500'}`}
                onClick={() => setMergeSource(null)}
              >
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Duplicate to Delete</p>
                {mergeSource ? <span className="font-black text-[#c1121f] text-xl uppercase italic tracking-tighter">{mergeSource.name}</span> : <span className="text-slate-300 italic font-bold uppercase">Select Player Below</span>}
              </div>

              <div 
                className={`p-6 border-4 border-dashed min-h-[100px] flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${mergeTarget ? 'bg-[#003566]/10 border-[#003566]' : 'bg-slate-100 border-slate-300 hover:border-slate-500'}`}
                onClick={() => setMergeTarget(null)}
              >
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Survivor to Keep</p>
                {mergeTarget ? <span className="font-black text-[#003566] text-xl uppercase italic tracking-tighter">{mergeTarget.name}</span> : <span className="text-slate-300 italic font-bold uppercase">Select Player Below</span>}
              </div>
            </div>

            {mergeSource && mergeTarget && mergeSource.id !== mergeTarget.id && (
              <button 
                onClick={executeMerge}
                className="w-full mt-6 bg-[#001d3d] text-white py-4 font-black uppercase italic tracking-widest text-xl hover:bg-[#c1121f] transition-colors shadow-[6px_6px_0px_#ffd60a]"
              >
                Confirm Merge
              </button>
            )}
          </div>
        )}

        {/* Player List */}
        <div className="grid gap-4">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map(player => (
              <div 
                key={player.id} 
                onClick={() => {
                  if (isMergeMode && isGlobalAdmin) {
                    if (!mergeSource) setMergeSource(player);
                    else if (!mergeTarget && player.id !== mergeSource.id) setMergeTarget(player);
                  }
                }}
                className={`bg-white border-4 border-[#001d3d] p-5 flex justify-between items-center shadow-[6px_6px_0px_#000] transition-all 
                  ${isMergeMode ? 'cursor-pointer hover:border-[#ffd60a] hover:translate-x-1' : ''} 
                  ${mergeSource?.id === player.id ? 'bg-red-50 border-[#c1121f] !translate-x-2' : ''}
                  ${mergeTarget?.id === player.id ? 'bg-blue-50 border-[#003566] !translate-x-2' : ''}`}
              >
                <div className="flex-1">
                  {editingId === player.id ? (
                    <div className="flex gap-2">
                      <input 
                        autoFocus
                        className="bg-[#fdf0d5] border-2 border-[#001d3d] p-2 font-black uppercase text-sm w-full md:w-80 outline-none text-[#001d3d]"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                      <button onClick={() => handleUpdateName(player.id)} className="bg-[#001d3d] text-white px-4 font-black text-[10px] uppercase hover:bg-green-600 transition-colors">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-slate-400 px-3 font-black text-[10px] uppercase hover:text-red-600">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-2xl font-black uppercase italic text-[#001d3d] flex items-center gap-3 leading-none tracking-tight">
                        {formatName(player.name)}
                        {mergeSource?.id === player.id && <span className="text-[9px] bg-[#c1121f] text-white px-2 py-0.5 not-italic tracking-widest uppercase">DUPLICATE</span>}
                        {mergeTarget?.id === player.id && <span className="text-[9px] bg-[#003566] text-white px-2 py-0.5 not-italic tracking-widest uppercase">SURVIVOR</span>}
                      </h3>
                      <div className="flex gap-4 mt-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">System ID: {player.id}</span>
                      </div>
                    </>
                  )}
                </div>

                {!isMergeMode && editingId !== player.id && (
                  <button 
                    onClick={() => { setEditingId(player.id); setEditName(player.name); }}
                    className="bg-[#c1121f] text-white px-4 py-2 text-[10px] font-black uppercase italic transition-all hover:bg-[#ffd60a] hover:text-[#001d3d] shadow-md active:translate-y-1 active:shadow-none"
                  >
                    Edit Identity
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="bg-[#003566] border-4 border-dashed border-[#669bbc] p-12 text-center opacity-50 uppercase">
              <p className="font-black italic text-white text-xl">No Matching Players</p>
              <p className="text-[10px] font-bold text-[#669bbc] tracking-widest mt-2 underline italic">Try a broader search term</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}