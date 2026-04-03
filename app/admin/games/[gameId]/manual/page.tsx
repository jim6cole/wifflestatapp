'use client';
import { useState, useEffect, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Link from 'next/link';

type StatLine = {
  playerId: number;
  name: string;
  position: 'P' | 'F' | 'DH' | 'EH';
  ab: number; h: number; r: number; hr: number; d2b: number; d3b: number; rbi: number; bb: number; k: number;
  ip: number; pk: number; per: number; pbb: number; ph: number; pr: number;
  phr: number;
  win: boolean;  // ADDED
  loss: boolean; // ADDED
  save: boolean; // ADDED
};

const statOptions = Array.from({ length: 41 }, (_, i) => i); 
const ipOptions = [0, 0.1, 0.2, 1.0, 1.1, 1.2, 2.0, 2.1, 2.2, 3.0, 3.1, 3.2, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0];

export default function ManualBoxScore({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params);
  const router = useRouter();
  
  const [game, setGame] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'away' | 'home'>('away');
  
  const [awayBench, setAwayBench] = useState<any[]>([]);
  const [homeBench, setHomeBench] = useState<any[]>([]);
  const [awayLineup, setAwayLineup] = useState<StatLine[]>([]);
  const [homeLineup, setHomeLineup] = useState<StatLine[]>([]);
  const [loading, setLoading] = useState(true);

  const [showGuestSearch, setShowGuestSearch] = useState(false);
  const [guestQuery, setGuestQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (!gameId) return;
    async function fetchGameData() {
      try {
        const res = await fetch(`/api/admin/games/${gameId}/prep-manual`);
        if (res.ok) {
          const data = await res.json();
          setGame(data.game);
          setAwayBench(data.awayRoster || []);
          setHomeBench(data.homeRoster || []);
        }
      } catch (err) {
        console.error("Failed to fetch scorecard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchGameData();
  }, [gameId]);

  useEffect(() => {
    if (guestQuery.length < 2) { setSearchResults([]); return; }
    const delayDebounceFn = setTimeout(async () => {
      const res = await fetch(`/api/admin/players?search=${encodeURIComponent(guestQuery)}`);
      if (res.ok) setSearchResults(await res.json());
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [guestQuery]);

  const addGuestToDugout = (player: any) => {
    if (activeTab === 'away') setAwayBench([...awayBench, player]);
    else setHomeBench([...homeBench, player]);
    setShowGuestSearch(false);
    setGuestQuery('');
  };

  const createAndAddGuest = async () => {
    const res = await fetch('/api/admin/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: guestQuery })
    });
    if (res.ok) {
      const newPlayer = await res.json();
      addGuestToDugout(newPlayer);
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    const isAway = activeTab === 'away';

    // 1. Reordering within the SAME list
    if (source.droppableId === destination.droppableId) {
      if (source.droppableId === 'lineup') {
        const list = isAway ? Array.from(awayLineup) : Array.from(homeLineup);
        const [reorderedItem] = list.splice(source.index, 1);
        list.splice(destination.index, 0, reorderedItem);
        if (isAway) setAwayLineup(list); else setHomeLineup(list);
      } else if (source.droppableId === 'bench') {
        const list = isAway ? Array.from(awayBench) : Array.from(homeBench);
        const [reorderedItem] = list.splice(source.index, 1);
        list.splice(destination.index, 0, reorderedItem);
        if (isAway) setAwayBench(list); else setHomeBench(list);
      }
      return;
    }

    // 2. Moving BETWEEN lists
    let sourceList = source.droppableId === 'bench' 
      ? (isAway ? Array.from(awayBench) : Array.from(homeBench)) 
      : (isAway ? Array.from(awayLineup) : Array.from(homeLineup));

    let destList = destination.droppableId === 'bench' 
      ? (isAway ? Array.from(awayBench) : Array.from(homeBench)) 
      : (isAway ? Array.from(awayLineup) : Array.from(homeLineup));

    const [removed] = sourceList.splice(source.index, 1);

    if (source.droppableId === 'bench' && destination.droppableId === 'lineup') {
      const newEntry: StatLine = { 
        playerId: removed.id, name: removed.name, position: 'F', 
        ab: 0, h: 0, r: 0, hr: 0, d2b: 0, d3b: 0, rbi: 0, bb: 0, k: 0,
        ip: 0, pk: 0, per: 0, pbb: 0, ph: 0, pr: 0, phr: 0,
        win: false, loss: false, save: false
      };
      destList.splice(destination.index, 0, newEntry);
    } else if (source.droppableId === 'lineup' && destination.droppableId === 'bench') {
      // Revert from StatLine object back to simple Player object for the bench
      destList.splice(destination.index, 0, { id: (removed as StatLine).playerId, name: (removed as StatLine).name });
    }

    if (isAway) {
      if (source.droppableId === 'bench') setAwayBench(sourceList); else setAwayLineup(sourceList as StatLine[]);
      if (destination.droppableId === 'bench') setAwayBench(destList); else setAwayLineup(destList as StatLine[]);
    } else {
      if (source.droppableId === 'bench') setHomeBench(sourceList); else setHomeLineup(sourceList as StatLine[]);
      if (destination.droppableId === 'bench') setHomeBench(destList); else setHomeLineup(destList as StatLine[]);
    }
  };

  // UPDATED: Now handles booleans for the checkboxes
  const updateStat = (index: number, field: keyof StatLine, value: any) => {
    const isAway = activeTab === 'away';
    const list = isAway ? [...awayLineup] : [...homeLineup];
    
    if (field === 'position') {
      (list[index] as any)[field] = value;
    } else if (field === 'win' || field === 'loss' || field === 'save') {
      (list[index] as any)[field] = value; // Assign true/false directly
    } else {
      (list[index] as any)[field] = parseFloat(value) || 0;
    }
    
    if (isAway) setAwayLineup(list); else setHomeLineup(list);
  };

  const autoPopulatePitching = () => {
    const isAway = activeTab === 'away';
    const opponentLineup = isAway ? homeLineup : awayLineup;
    const teamLineup = isAway ? awayLineup : homeLineup;
    const pitcher = teamLineup.find(p => p.position === 'P');

    if (!pitcher) return;

    const totals = opponentLineup.reduce((acc, p) => ({
      h: acc.h + p.h, r: acc.r + p.r, bb: acc.bb + p.bb, k: acc.k + p.k, hr: acc.hr + p.hr
    }), { h: 0, r: 0, bb: 0, k: 0, hr: 0 });

    const pitcherIdx = teamLineup.findIndex(lp => lp.playerId === pitcher.playerId);
    
    updateStat(pitcherIdx, 'ph', totals.h.toString());
    updateStat(pitcherIdx, 'pr', totals.r.toString());
    updateStat(pitcherIdx, 'per', totals.r.toString());
    updateStat(pitcherIdx, 'pbb', totals.bb.toString());
    updateStat(pitcherIdx, 'pk', totals.k.toString());
    updateStat(pitcherIdx, 'phr', totals.hr.toString());
  };

  const handleSave = async () => {
    const res = await fetch(`/api/admin/games/${gameId}/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        awayStats: awayLineup, 
        homeStats: homeLineup,
        awayTeamId: game.awayTeamId,
        homeTeamId: game.homeTeamId 
      }),
    });
    if (res.ok) router.push(`/admin/leagues/${game.leagueId}/seasons/${game.seasonId}/manual-scores`);
  };

  if (loading) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black italic text-[#ffd60a] text-4xl animate-pulse">BOOTING SCORECARD...</div>;

  const currentLineup = activeTab === 'away' ? awayLineup : homeLineup;
  const currentBench = activeTab === 'away' ? awayBench : homeBench;
  const pitchersInLineup = currentLineup.filter(p => p.position === 'P');

  return (
    <div className="min-h-screen bg-[#001d3d] text-white p-4 md:p-8 border-[6px] md:border-[12px] border-[#c1121f]">
      <div className="max-w-[1600px] mx-auto">
        
        <header className="mb-6 flex justify-between items-center border-b-4 border-[#ffd60a] pb-4">
          <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter">SCORECARD</h1>
          <button onClick={handleSave} className="bg-[#c1121f] px-8 py-3 font-black uppercase italic border-2 border-white shadow-[6px_6px_0px_#000] hover:bg-white hover:text-[#c1121f] transition-all">SAVE BOX SCORE</button>
        </header>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* DUGOUT AREA */}
            <div className="w-full lg:w-80 shrink-0">
              <div className="flex justify-between items-end mb-2">
                <h2 className="text-[#ffd60a] font-black uppercase italic text-sm">🧢 Dugout</h2>
                <button onClick={() => setShowGuestSearch(!showGuestSearch)} className="text-[9px] font-black bg-white text-[#001d3d] px-2 py-1 uppercase italic border border-[#001d3d]">Draft Guest</button>
              </div>

              {showGuestSearch && (
                <div className="bg-white p-3 mb-4 border-4 border-[#ffd60a] shadow-[10px_10px_0px_#000] relative z-20">
                  <input autoFocus placeholder="Last Name..." className="w-full p-2 text-[#001d3d] font-black uppercase text-xs border-2 border-slate-200 outline-none focus:border-[#c1121f]" value={guestQuery} onChange={e => setGuestQuery(e.target.value)} />
                  <div className="mt-2 flex flex-col gap-1 max-h-48 overflow-y-auto">
                    {searchResults.map(p => (
                      <button key={p.id} onClick={() => addGuestToDugout(p)} className="text-left p-2 bg-slate-100 text-[#001d3d] font-black text-[10px] uppercase hover:bg-[#ffd60a] border-b border-white flex justify-between">
                        {p.name} <span className="opacity-40 italic">PICK</span>
                      </button>
                    ))}
                    <button onClick={createAndAddGuest} className="p-2 mt-2 bg-[#c1121f] text-white font-black uppercase text-[10px] border-2 border-[#001d3d]">Create: "{guestQuery}"</button>
                  </div>
                </div>
              )}

              <Droppable droppableId="bench">
                {(provided, snapshot) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className={`p-2 border-2 transition-all min-h-[100px] ${snapshot.isDraggingOver ? 'bg-white/10 border-[#ffd60a]' : 'bg-black/20 border-white/10'}`}>
                    <div className="flex flex-wrap lg:flex-col gap-2">
                      {currentBench.map((p, idx) => (
                        <Draggable key={p.id.toString()} draggableId={p.id.toString()} index={idx}>
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="bg-white text-[#001d3d] p-3 font-black uppercase italic text-xs border-2 border-transparent hover:border-[#ffd60a] shadow-[4px_4px_0px_#000] flex justify-between">
                              {p.name} <span className="opacity-20 font-mono">:::</span>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* SCORECARD AREA */}
            <div className="flex-1 min-w-0">
              <div className="flex gap-1 mb-4">
                <button onClick={() => setActiveTab('away')} className={`flex-1 py-4 font-black uppercase italic text-sm border-4 transition-all ${activeTab === 'away' ? 'bg-[#ffd60a] text-[#001d3d] border-[#001d3d]' : 'bg-[#001d3d] text-white border-white/20'}`}>
                  {game?.awayTeam?.name || 'AWAY TEAM'}
                </button>
                <button onClick={() => setActiveTab('home')} className={`flex-1 py-4 font-black uppercase italic text-sm border-4 transition-all ${activeTab === 'home' ? 'bg-[#ffd60a] text-[#001d3d] border-[#001d3d]' : 'bg-[#001d3d] text-white border-white/20'}`}>
                  {game?.homeTeam?.name || 'HOME TEAM'}
                </button>
              </div>

              <Droppable droppableId="lineup">
                {(provided, snapshot) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className={`bg-white text-[#001d3d] border-4 border-[#001d3d] shadow-[12px_12px_0px_#000] min-h-[200px] transition-all ${snapshot.isDraggingOver ? 'bg-yellow-50 border-[#ffd60a]' : ''}`}>
                    {currentLineup.map((player, idx) => (
                      <Draggable key={player.playerId.toString()} draggableId={player.playerId.toString()} index={idx}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="border-b-2 border-slate-100 p-4 bg-white flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[#669bbc] font-black italic text-sm w-6">{idx + 1}.</span>
                              <h3 className="font-black uppercase italic text-xl truncate max-w-[200px]">{player.name}</h3>
                              <select value={player.position} onChange={(e) => updateStat(idx, 'position', e.target.value)} className="bg-[#001d3d] text-white font-black p-1 text-[10px] uppercase ml-2 px-2">
                                {['P', 'F', 'DH', 'EH'].map(pos => <option key={pos} value={pos}>{pos}</option>)}
                              </select>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                              {['AB', 'R', 'H', '2B', '3B', 'HR', 'RBI', 'BB', 'K'].map((label) => (
                                <StatSelect 
                                  key={label} 
                                  label={label} 
                                  value={(player as any)[label === '2B' ? 'd2b' : label === '3B' ? 'd3b' : label.toLowerCase()]} 
                                  onChange={(v) => updateStat(idx, (label === '2B' ? 'd2b' : label === '3B' ? 'd3b' : label.toLowerCase()) as any, v)} 
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {/* THE BULLPEN */}
              <div className="mt-12">
                <div className="flex justify-between items-end mb-4">
                  <h2 className="text-[#c1121f] font-black uppercase italic text-2xl tracking-tighter">2. The Bullpen</h2>
                  {pitchersInLineup.length === 1 && (
                    <button onClick={autoPopulatePitching} className="bg-white border-2 border-[#001d3d] text-[#001d3d] px-4 py-1.5 font-black uppercase italic text-[10px] shadow-[4px_4px_0px_#ffd60a] hover:bg-[#ffd60a] transition-all">⚡ Auto-Fill from Opponent</button>
                  )}
                </div>
                <div className="bg-[#001d3d] p-1 shadow-[12px_12px_0px_#ffd60a] border-2 border-white overflow-x-auto">
                  <div className="bg-white text-[#001d3d] min-w-[800px]">
                    <table className="w-full text-[11px] font-black uppercase">
                      <thead className="bg-[#001d3d] text-white text-center">
                        <tr>
                          <th className="p-3 text-left">Pitcher</th>
                          <th className="p-3 text-[#669bbc]">W</th>
                          <th className="p-3 text-[#c1121f]">L</th>
                          <th className="p-3 text-[#ffd60a]">SV</th>
                          <th className="p-3">IP</th><th className="p-3">H</th><th className="p-3">R</th><th className="p-3">ER</th><th className="p-3">BB</th><th className="p-3">K</th>
                          <th className="p-3 text-[#c1121f]">HR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pitchersInLineup.length > 0 ? (
                          pitchersInLineup.map((p) => {
                            const realIdx = currentLineup.findIndex(lp => lp.playerId === p.playerId);
                            return (
                              <tr key={p.playerId} className="text-center hover:bg-slate-50">
                                <td className="p-3 text-left italic font-bold">{p.name}</td>
                                
                                {/* W/L/S CHECKBOXES */}
                                <td className="p-2">
                                  <input type="checkbox" checked={p.win} onChange={(e) => updateStat(realIdx, 'win', e.target.checked)} className="w-5 h-5 accent-[#669bbc] cursor-pointer" />
                                </td>
                                <td className="p-2">
                                  <input type="checkbox" checked={p.loss} onChange={(e) => updateStat(realIdx, 'loss', e.target.checked)} className="w-5 h-5 accent-[#c1121f] cursor-pointer" />
                                </td>
                                <td className="p-2">
                                  <input type="checkbox" checked={p.save} onChange={(e) => updateStat(realIdx, 'save', e.target.checked)} className="w-5 h-5 accent-[#ffd60a] cursor-pointer" />
                                </td>

                                <td className="p-2">
                                  <select value={p.ip} onChange={(e) => updateStat(realIdx, 'ip', e.target.value)} className="w-16 bg-slate-100 border-2 border-slate-200 p-1.5 font-black text-center outline-none">
                                    {ipOptions.map(n => <option key={n} value={n.toString()}>{n}</option>)}
                                  </select>
                                </td>
                                {['ph', 'pr', 'per', 'pbb', 'pk', 'phr'].map(field => (
                                  <td key={field} className="p-2">
                                    <select value={(p as any)[field]} onChange={(e) => updateStat(realIdx, field as any, e.target.value)} className={`w-12 border-2 p-1.5 font-black text-center outline-none ${field === 'phr' ? 'bg-[#c1121f]/5 border-[#c1121f]/20 text-[#c1121f]' : 'bg-slate-100 border-slate-200'}`}>
                                      {statOptions.map(n => <option key={n} value={n.toString()}>{n}</option>)}
                                    </select>
                                  </td>
                                ))}
                              </tr>
                            );
                          })
                        ) : (
                          <tr><td colSpan={11} className="p-12 text-center text-slate-300 italic font-medium uppercase tracking-widest">No Pitchers Assigned to Lineup</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}

function StatSelect({ label, value, onChange }: { label: string, value: number, onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[8px] font-black text-[#669bbc] mb-1 uppercase tracking-tighter">{label}</span>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-10 bg-slate-100 border-2 border-slate-200 p-1 font-black text-center text-xs outline-none focus:border-[#ffd60a] text-[#001d3d] hover:bg-slate-200 transition-colors"
      >
        {statOptions.map(n => <option key={n} value={n.toString()}>{n}</option>)}
      </select>
    </div>
  );
}