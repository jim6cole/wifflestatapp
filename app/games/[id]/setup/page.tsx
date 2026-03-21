'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function GameSetup() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allPlayers, setAllPlayers] = useState<any[]>([]); 

  // Lineup and Bench States
  const [homeActive, setHomeActive] = useState<any[]>([]);
  const [homeBench, setHomeBench] = useState<any[]>([]);
  const [awayActive, setAwayActive] = useState<any[]>([]);
  const [awayBench, setAwayBench] = useState<any[]>([]);

  const [homePitcher, setHomePitcher] = useState('');
  const [awayPitcher, setAwayPitcher] = useState('');

  useEffect(() => {
    async function init() {
      if (!id) return;
      try {
        const [gRes, pRes] = await Promise.all([
          fetch(`/api/games/${id}`),
          fetch(`/api/players`)
        ]);
        
        const gData = await gRes.json();
        const pData = await pRes.json();
        setGame(gData);
        setAllPlayers(pData);

        const [hRes, aRes] = await Promise.all([
          fetch(`/api/teams/${gData.homeTeamId}/players`),
          fetch(`/api/teams/${gData.awayTeamId}/players`)
        ]);

        const hPlayers = await hRes.json();
        const aPlayers = await aRes.json();

        setHomeBench(Array.isArray(hPlayers) ? hPlayers : []);
        setAwayBench(Array.isArray(aPlayers) ? aPlayers : []);
      } catch (e) { 
        console.error("Initialization Error:", e); 
      } finally { 
        setLoading(false); 
      }
    }
    init();
  }, [id]);

  // --- DRAG AND DROP LOGIC ---
  const onDragStart = (e: any, player: any, fromList: string) => {
    e.dataTransfer.setData("player", JSON.stringify(player));
    e.dataTransfer.setData("fromList", fromList);
  };

  const onDrop = (e: any, toList: string) => {
    e.preventDefault();
    const player = JSON.parse(e.dataTransfer.getData("player"));
    const fromList = e.dataTransfer.getData("fromList");

    const remove = (list: any[]) => list.filter(p => p.id !== player.id);

    // CASE 1: Reordering within the same Active List
    if (fromList === toList && toList.endsWith('Active')) {
      const currentList = toList === 'homeActive' ? [...homeActive] : [...awayActive];
      const oldIndex = currentList.findIndex(p => p.id === player.id);
      
      const targetId = e.target.closest('[data-player-id]')?.getAttribute('data-player-id');
      if (!targetId || Number(targetId) === player.id) return;

      const newIndex = currentList.findIndex(p => p.id === Number(targetId));
      
      currentList.splice(oldIndex, 1);
      currentList.splice(newIndex, 0, player);

      if (toList === 'homeActive') setHomeActive(currentList);
      else setAwayActive(currentList);
      return;
    }

    // CASE 2: Moving between lists
    if (fromList === toList) return;

    if (fromList === 'homeActive') setHomeActive(remove);
    if (fromList === 'homeBench') setHomeBench(remove);
    if (fromList === 'awayActive') setAwayActive(remove);
    if (fromList === 'awayBench') setAwayBench(remove);

    if (toList === 'homeActive') setHomeActive(prev => [...prev, player]);
    if (toList === 'homeBench') setHomeBench(prev => [...prev, player]);
    if (toList === 'awayActive') setAwayActive(prev => [...prev, player]);
    if (toList === 'awayBench') setAwayBench(prev => [...prev, player]);
  };

  const startGame = async () => {
    if (!homePitcher || !awayPitcher) return alert("Select a starting pitcher for both teams!");
    if (homeActive.length === 0 || awayActive.length === 0) return alert("Both teams need at least one batter!");

    const payload = {
      homePitcherId: Number(homePitcher),
      awayPitcherId: Number(awayPitcher),
      homeLineup: homeActive.map((p, index) => ({ id: p.id, order: index + 1 })),
      awayLineup: awayActive.map((p, index) => ({ id: p.id, order: index + 1 })),
    };

    const res = await fetch(`/api/games/${id}/lineup`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' }
    });

    if (res.ok) {
      router.push(`/games/${id}/live`);
    } else {
      alert("Failed to save lineup.");
    }
  };

  if (loading || !game) return <div className="p-10 text-white font-black animate-pulse bg-slate-950 min-h-screen">CONNECTING TO FIELD...</div>;

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto bg-slate-950 min-h-screen text-white">
      <div className="flex justify-between items-center mb-8 border-b-4 border-blue-600 pb-4">
        <div>
          <h1 className="text-3xl font-black italic uppercase">Game Setup</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
            {game.awayTeam.name} @ {game.homeTeam.name}
          </p>
        </div>
        <button onClick={startGame} className="bg-blue-600 px-8 py-3 rounded-full font-black text-lg hover:bg-blue-500 transition uppercase italic">
          Play Ball
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {['away', 'home'].map((side) => {
          const isHome = side === 'home';
          const active = isHome ? homeActive : awayActive;
          const bench = isHome ? homeBench : awayBench;
          const teamName = isHome ? game.homeTeam.name : game.awayTeam.name;
          const pitcher = isHome ? homePitcher : awayPitcher;
          const setPitcher = isHome ? setHomePitcher : setAwayPitcher;

          return (
            <div key={side} className="space-y-4">
              <h2 className={`text-xl font-black uppercase ${isHome ? 'text-green-500' : 'text-blue-400'}`}>
                {teamName} {isHome ? '(Home)' : '(Away)'}
              </h2>
              
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Starting Pitcher</label>
                <select 
                  className="w-full bg-slate-800 p-2 rounded border border-slate-700 font-bold outline-none"
                  value={pitcher} onChange={(e) => setPitcher(e.target.value)}
                >
                  <option value="">Choose Pitcher...</option>
                  {[...active, ...bench].map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, `${side}Active`)}
                className="bg-slate-900 p-4 rounded-xl border-2 border-dashed border-slate-800 min-h-[250px]"
              >
                <h3 className="text-[10px] font-black text-slate-500 mb-3 uppercase">Batting Order (Drag to Reorder)</h3>
                {active.map((p, i) => (
                  <div 
                    key={p.id} draggable data-player-id={p.id}
                    onDragStart={(e) => onDragStart(e, p, `${side}Active`)}
                    className="bg-slate-800 p-3 mb-2 rounded border-l-4 border-blue-500 flex justify-between items-center cursor-grab active:cursor-grabbing hover:bg-slate-700"
                  >
                    <span className="flex items-center gap-2 pointer-events-none">
                        <span className="text-blue-500 text-xs">#{i + 1}</span>
                        {p.name}
                    </span>
                    <span className="text-slate-600 pointer-events-none text-xs">☰</span>
                  </div>
                ))}
              </div>

              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, `${side}Bench`)}
                className="bg-black/20 p-4 rounded-xl border border-slate-900"
              >
                <h3 className="text-[10px] font-black text-slate-600 mb-3 uppercase">Available Bench</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                    {bench.map(p => (
                    <div 
                        key={p.id} draggable onDragStart={(e) => onDragStart(e, p, `${side}Bench`)}
                        className="bg-slate-900 px-3 py-1 rounded-full text-xs font-bold text-slate-400 border border-slate-800 cursor-grab"
                    >
                        {p.name}
                    </div>
                    ))}
                </div>
                
                <select 
                    className="w-full bg-transparent text-slate-700 text-[10px] font-bold uppercase tracking-widest border-t border-slate-900 pt-2"
                    onChange={(e) => {
                        const p = allPlayers.find(ap => ap.id === Number(e.target.value));
                        if(p) isHome ? setHomeBench([...homeBench, p]) : setAwayBench([...awayBench, p]);
                    }}
                >
                    <option value="">+ ADD REGISTERED PLAYER</option>
                    {allPlayers.filter(ap => !active.find(x => x.id === ap.id) && !bench.find(x => x.id === ap.id))
                        .map(ap => <option key={ap.id} value={ap.id}>{ap.name}</option>)}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}