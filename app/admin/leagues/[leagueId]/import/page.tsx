'use client';
import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HistoricImportWizard({ params }: { params: Promise<{ leagueId: string }> }) {
  // Resilient params handling
  const resolvedParams = use(params);
  const leagueId = resolvedParams?.leagueId;
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [createdSeasonId, setCreatedSeasonId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // 1. Initialize State with Defaults
  const [config, setConfig] = useState({
    name: '',
    year: 2026,
    balls: 4,
    strikes: 3,
    outs: 3,
    inningsPerGame: 4,
    eraStandard: 4,
    isSpeedRestricted: false,
    speedLimit: 60
  });

  // 2. Data Lists (Moved inside to prevent scope errors)
  const years = Array.from({ length: 40 }, (_, i) => 2026 - i);
  const counts = [1, 2, 3, 4, 5, 6];
  const strikes = [1, 2, 3, 4];
  const outs = [1, 2, 3];
  const innings = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const speeds = Array.from({ length: 26 }, (_, i) => 55 + i);

  // 3. Mapping State
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [mappingState, setMappingState] = useState<{
    players: { name: string, resolvedId: number | 'NEW' | null }[],
    teams: { name: string, resolvedId: number | 'NEW' | null }[]
  }>({ players: [], teams: [] });

  const [dbPlayers, setDbPlayers] = useState<any[]>([]);
  const [dbTeams, setDbTeams] = useState<any[]>([]);

  // Load DB refs when we hit the mapping step
  useEffect(() => {
    if (step === 4 && leagueId) {
      Promise.all([
        fetch('/api/admin/players').then(res => res.json()),
        fetch(`/api/admin/leagues/${leagueId}/teams`).then(res => res.json())
      ]).then(([players, teams]) => {
        setDbPlayers(Array.isArray(players) ? players : []);
        setDbTeams(Array.isArray(teams) ? teams : []);
      }).catch(err => console.error("Registry fetch failed", err));
    }
  }, [step, leagueId]);

  // --- FUNCTIONS ---

  const createHistoricSeason = async () => {
    if (!config.name || !leagueId) return;
    try {
      const res = await fetch(`/api/admin/leagues/${leagueId}/seasons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, status: 'HISTORIC' })
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedSeasonId(data.id);
        setStep(2);
      }
    } catch (err) {
      alert("Season Creation Error: Connection lost.");
    }
  };

  const downloadTemplate = () => {
    const headers = ["playerName", "teamName", "ab", "h", "d2b", "d3b", "hr", "rbi", "r", "bb", "k", "ip", "er", "pk", "win", "loss", "save"];
    const example = "\nJim Smith,AWA Red,100,35,5,1,12,30,25,10,15,40.1,12,55,5,2,1";
    const blob = new Blob([headers.join(",") + example], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: "legacy_template.csv" });
    a.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').filter(r => r.trim() !== '').slice(1);
        
        const rowsData = rows.map(row => {
          const c = row.split(',').map(val => val.trim());
          return {
            playerName: c[0], teamName: c[1],
            ab: parseInt(c[2] || '0'), h: parseInt(c[3] || '0'), d2b: parseInt(c[4] || '0'),
            d3b: parseInt(c[5] || '0'), hr: parseInt(c[6] || '0'), rbi: parseInt(c[7] || '0'),
            r: parseInt(c[8] || '0'), bb: parseInt(c[9] || '0'), k: parseInt(c[10] || '0'),
            ip: parseFloat(c[11] || '0'), er: parseInt(c[12] || '0'), pk: parseInt(c[13] || '0'),
            winCount: parseInt(c[14] || '0'), lossCount: parseInt(c[15] || '0'), saveCount: parseInt(c[16] || '0')
          };
        });

        const uniquePlayers = Array.from(new Set(rowsData.map(r => r.playerName)));
        const uniqueTeams = Array.from(new Set(rowsData.map(r => r.teamName)));

        setParsedData(rowsData);
        setMappingState({
          players: uniquePlayers.map(name => ({ name, resolvedId: null })),
          teams: uniqueTeams.map(name => ({ name, resolvedId: null }))
        });
        setStep(4);
      } catch (err) {
        alert("Parsing error. Check your CSV structure.");
      }
    };
    reader.readAsText(file);
  };

  const finalizeImport = async () => {
    setUploading(true);
    try {
      const resolveRes = await fetch(`/api/admin/leagues/${leagueId}/import/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapping: mappingState, seasonId: createdSeasonId })
      });
      
      const { playerMap, teamMap, dummyGameId } = await resolveRes.json();

      const finalStats = parsedData.map(row => ({
        ...row,
        gameId: dummyGameId,
        playerId: playerMap[row.playerName],
        teamId: teamMap[row.playerName] // Fixed mapping key
      }));

      const res = await fetch(`/api/admin/seasons/${createdSeasonId}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalStats)
      });

      if (res.ok) router.push(`/admin/leagues/${leagueId}/seasons/${createdSeasonId}`);
    } catch (err) {
      alert("Finalization error. Check logs.");
    } finally {
      setUploading(false);
    }
  };

  // --- RENDER ---
  if (!leagueId) return <div className="p-20 text-white font-black italic uppercase">Loading League Context...</div>;

  return (
    <div className="min-h-screen bg-[#001d3d] text-white p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 border-b-8 border-[#ffd60a] pb-6 flex justify-between items-end">
          <div>
            <Link href={`/admin/leagues/${leagueId}`} className="text-[10px] font-black uppercase text-[#669bbc] mb-4 block hover:text-white transition-colors">← Back to Hub</Link>
            <h1 className="text-6xl font-black italic uppercase tracking-tighter leading-none">Legacy Archive Wizard</h1>
          </div>
          <div className="text-[#ffd60a] font-black text-2xl uppercase italic tracking-tighter">Step {step}/4</div>
        </header>

        {step === 1 && (
          <div className="bg-white p-8 border-4 border-[#001d3d] shadow-[12px_12px_0px_#ffd60a] text-[#001d3d]">
            <h2 className="text-2xl font-black italic uppercase mb-6 border-b-4 border-[#c1121f] pb-2">1. Season Configuration</h2>
            <div className="grid grid-cols-1 gap-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Season Name</label>
                  <input type="text" value={config.name} onChange={e => setConfig({...config, name: e.target.value})} className="w-full border-4 border-[#001d3d] p-4 font-bold uppercase outline-none focus:border-[#c1121f]" placeholder="Enter Name..." />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Year</label>
                  <select value={config.year} onChange={e => setConfig({...config, year: parseInt(e.target.value)})} className="w-full border-4 border-[#001d3d] p-4 font-bold outline-none cursor-pointer">
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="bg-slate-50 p-8 border-4 border-[#001d3d]">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 items-end">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Balls</label>
                    <select value={config.balls} onChange={e => setConfig({...config, balls: parseInt(e.target.value)})} className="w-full border-2 border-[#001d3d] p-3 font-bold">
                      {counts.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Strikes</label>
                    <select value={config.strikes} onChange={e => setConfig({...config, strikes: parseInt(e.target.value)})} className="w-full border-2 border-[#001d3d] p-3 font-bold">
                      {strikes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Outs</label>
                    <select value={config.outs} onChange={e => setConfig({...config, outs: parseInt(e.target.value)})} className="w-full border-2 border-[#001d3d] p-3 font-bold">
                      {outs.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Innings</label>
                    <select value={config.inningsPerGame} onChange={e => setConfig({...config, inningsPerGame: parseInt(e.target.value), eraStandard: parseInt(e.target.value)})} className="w-full border-2 border-[#001d3d] p-3 font-bold">
                      {innings.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-3 h-[52px]">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" checked={config.isSpeedRestricted} onChange={e => setConfig({...config, isSpeedRestricted: e.target.checked})} className="w-6 h-6 border-4 border-[#001d3d] cursor-pointer accent-[#c1121f]" />
                      <span className="font-black uppercase italic text-[10px] leading-tight group-hover:text-[#c1121f]">Speed Limit?</span>
                    </label>
                  </div>
                  {config.isSpeedRestricted && (
                    <div className="animate-in fade-in slide-in-from-left-2 duration-200">
                      <label className="text-[10px] font-black uppercase text-[#c1121f] block mb-2">MPH</label>
                      <select value={config.speedLimit} onChange={e => setConfig({...config, speedLimit: parseInt(e.target.value)})} className="w-full border-2 border-[#c1121f] p-3 font-bold bg-red-50">
                        {speeds.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button onClick={createHistoricSeason} disabled={!config.name} className="w-full mt-12 bg-[#c1121f] text-white py-6 font-black uppercase italic text-2xl hover:bg-[#001d3d] transition-all shadow-[8px_8px_0px_#ffd60a] disabled:opacity-50">
              Lock Historic Record →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white p-12 border-4 border-[#001d3d] shadow-[12px_12px_0px_#ffd60a] text-[#001d3d] text-center">
            <h2 className="text-3xl font-black italic uppercase mb-2">2. Prepare Your Data</h2>
            <p className="text-[#669bbc] font-bold uppercase text-xs mb-10 tracking-[0.2em]">Download template for {config.name}</p>
            <button onClick={downloadTemplate} className="bg-[#001d3d] text-[#ffd60a] px-12 py-6 font-black uppercase italic text-2xl border-4 border-[#ffd60a] hover:bg-[#c1121f] transition-all shadow-[8px_8px_0px_#000]">
              Download Template CSV
            </button>
            <button onClick={() => setStep(3)} className="block w-full mt-12 text-[#c1121f] font-black uppercase text-sm hover:underline italic">I have my file ready →</button>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white p-12 border-4 border-[#001d3d] shadow-[12px_12px_0px_#ffd60a] text-[#001d3d] text-center">
            <h2 className="text-3xl font-black italic uppercase mb-10">3. Synchronize Archives</h2>
            <label className="block bg-[#22c55e] text-white p-16 border-4 border-dashed border-white cursor-pointer hover:bg-[#16a34a] transition-all">
              <span className="text-4xl font-black uppercase italic">{uploading ? "SYNCING..." : "Select & Upload CSV"}</span>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
        )}

        {/* Step 4: Mapping Review code... */}
      </div>
    </div>
  );
}