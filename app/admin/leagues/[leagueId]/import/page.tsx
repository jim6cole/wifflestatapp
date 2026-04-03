'use client';
import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HistoricImportWizard({ params }: { params: Promise<{ leagueId: string }> }) {
  const resolvedParams = use(params);
  const leagueId = resolvedParams?.leagueId;
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [createdSeasonId, setCreatedSeasonId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Data State
  const [hittingData, setHittingData] = useState<any[]>([]);
  const [pitchingData, setPitchingData] = useState<any[]>([]);
  
  // Mapping State
  const [mappingState, setMappingState] = useState<{
    players: { name: string, resolvedId: number | 'NEW' | null }[],
    teams: { name: string, resolvedId: number | 'NEW' | null }[]
  }>({ players: [], teams: [] });

  const [dbPlayers, setDbPlayers] = useState<any[]>([]);
  const [dbTeams, setDbTeams] = useState<any[]>([]);

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

  const years = Array.from({ length: 40 }, (_, i) => 2026 - i);
  const counts = [1, 2, 3, 4, 5, 6];
  const innings = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const speeds = Array.from({ length: 26 }, (_, i) => 55 + i);

  useEffect(() => {
    if (step === 4 && leagueId) {
      Promise.all([
        fetch('/api/admin/players').then(res => res.json()),
        fetch(`/api/admin/leagues/${leagueId}/teams`).then(res => res.json())
      ]).then(([players, teams]) => {
        setDbPlayers(Array.isArray(players) ? players : []);
        setDbTeams(Array.isArray(teams) ? teams : []);
      });
    }
  }, [step, leagueId]);

  // --- STEP 1: CREATE SEASON ---
  const createHistoricSeason = async () => {
    if (!config.name || !leagueId) return;
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
  };

  // --- STEP 2: TEMPLATES ---
  const downloadHittingTemplate = () => {
    const headers = ["playerName", "teamName", "gp", "ab", "h", "2b", "3b", "hr", "rbi", "r", "bb", "k"];
    const example = "\nJim Smith,AWA Red,12,100,35,5,1,12,30,25,10,15";
    const blob = new Blob([headers.join(",") + example], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: "hitting_template.csv" });
    a.click();
  };

  const downloadPitchingTemplate = () => {
    const headers = ["playerName", "teamName", "ip", "h_allowed", "bb_allowed", "er", "hr_allowed", "k", "winCount", "lossCount", "saveCount"];
    const example = "\nJim Smith,AWA Red,40.1,22,10,12,4,55,5,2,1";
    const blob = new Blob([headers.join(",") + example], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: "pitching_template.csv" });
    a.click();
  };

  // --- STEP 3: UPLOADS ---
  const handleHittingUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').filter(r => r.trim() !== '').slice(1);
      setHittingData(rows.map(row => {
        const c = row.split(',').map(v => v.trim());
        return { playerName: c[0], teamName: c[1], gp: c[2], ab: c[3], h: c[4], d2b: c[5], d3b: c[6], hr: c[7], rbi: c[8], r: c[9], bb: c[10], k: c[11] };
      }));
    };
    reader.readAsText(file);
  };

  const handlePitchingUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').filter(r => r.trim() !== '').slice(1);
      setPitchingData(rows.map(row => {
        const c = row.split(',').map(v => v.trim());
        return { playerName: c[0], teamName: c[1], ip: c[2], ph: c[3], pbb: c[4], per: c[5], phr: c[6], pk: c[7], winCount: c[8], lossCount: c[9], saveCount: c[10] };
      }));
    };
    reader.readAsText(file);
  };

  const proceedToMapping = () => {
    const allPlayerNames = Array.from(new Set([...hittingData.map(d => d.playerName), ...pitchingData.map(d => d.playerName)]));
    const allTeamNames = Array.from(new Set([...hittingData.map(d => d.teamName), ...pitchingData.map(d => d.teamName)]));
    setMappingState({
      players: allPlayerNames.map(name => ({ name, resolvedId: null })),
      teams: allTeamNames.map(name => ({ name, resolvedId: null }))
    });
    setStep(4);
  };

  // --- STEP 4: FINALIZE ---
  const finalizeImport = async () => {
    setUploading(true);
    try {
      const resolveRes = await fetch(`/api/admin/leagues/${leagueId}/import/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapping: mappingState, seasonId: createdSeasonId })
      });
      const { playerMap, teamMap, dummyGameId } = await resolveRes.json();

      const combinedStats: any[] = [];
      const combos = Array.from(new Set([
        ...hittingData.map(d => `${d.playerName}|${d.teamName}`), 
        ...pitchingData.map(d => `${d.playerName}|${d.teamName}`)
      ]));

      combos.forEach(combo => {
        const [pName, tName] = combo.split('|');
        const h = hittingData.find(d => d.playerName === pName && d.teamName === tName) || {};
        const p = pitchingData.find(d => d.playerName === pName && d.teamName === tName) || {};
        
        combinedStats.push({
          gameId: dummyGameId,
          playerId: playerMap[pName],
          teamId: teamMap[tName],
          gp: parseInt(h.gp || 0),
          ab: parseInt(h.ab || 0), h: parseInt(h.h || 0), d2b: parseInt(h.d2b || 0), d3b: parseInt(h.d3b || 0), hr: parseInt(h.hr || 0),
          rbi: parseInt(h.rbi || 0), r: parseInt(h.r || 0), bb: parseInt(h.bb || 0), k: parseInt(h.k || 0),
          ip: parseFloat(p.ip || 0), ph: parseInt(p.ph || 0), pbb: parseInt(p.pbb || 0), per: parseInt(p.per || 0), phr: parseInt(p.phr || 0), pk: parseInt(p.pk || 0),
          winCount: parseInt(p.winCount || 0), lossCount: parseInt(p.lossCount || 0), saveCount: parseInt(p.saveCount || 0)
        });
      });

      const res = await fetch(`/api/admin/seasons/${createdSeasonId}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(combinedStats)
      });

      if (res.ok) router.push(`/admin/leagues/${leagueId}/seasons/${createdSeasonId}`);
    } catch (err) {
      alert("Sync failed. Check console.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#001d3d] text-white p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 border-b-8 border-[#ffd60a] pb-6 flex justify-between items-end">
          <div>
            <Link href={`/admin/leagues/${leagueId}`} className="text-[10px] font-black uppercase text-[#669bbc] mb-4 block hover:text-white transition-colors">← Back to Hub</Link>
            <h1 className="text-6xl font-black italic uppercase tracking-tighter leading-none">Legacy Archive Wizard</h1>
          </div>
          <div className="text-[#ffd60a] font-black text-2xl uppercase italic">Step {step}/4</div>
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
              <div className="bg-slate-50 p-8 border-4 border-[#001d3d] grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 items-end">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Balls</label>
                  <select value={config.balls} onChange={e => setConfig({...config, balls: parseInt(e.target.value)})} className="w-full border-2 border-[#001d3d] p-3 font-bold">
                    {counts.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Strikes</label>
                  <select value={config.strikes} onChange={e => setConfig({...config, strikes: parseInt(e.target.value)})} className="w-full border-2 border-[#001d3d] p-3 font-bold">
                    {[1, 2, 3, 4].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Outs</label>
                  <select value={config.outs} onChange={e => setConfig({...config, outs: parseInt(e.target.value)})} className="w-full border-2 border-[#001d3d] p-3 font-bold">
                    {[1, 2, 3].map(c => <option key={c} value={c}>{c}</option>)}
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
                    <input type="checkbox" checked={config.isSpeedRestricted} onChange={e => setConfig({...config, isSpeedRestricted: e.target.checked})} className="w-6 h-6 border-4 border-[#001d3d] cursor-pointer" />
                    <span className="font-black uppercase italic text-[10px] leading-tight">Speed Limit?</span>
                  </label>
                </div>
                {config.isSpeedRestricted && (
                  <div>
                    <label className="text-[10px] font-black uppercase text-[#c1121f] block mb-2">MPH</label>
                    <select value={config.speedLimit} onChange={e => setConfig({...config, speedLimit: parseInt(e.target.value)})} className="w-full border-2 border-[#c1121f] p-3 font-bold bg-red-50">
                      {speeds.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
            <button onClick={createHistoricSeason} disabled={!config.name} className="w-full mt-12 bg-[#c1121f] text-white py-6 font-black uppercase italic text-2xl hover:bg-[#001d3d] transition-all shadow-[8px_8px_0px_#ffd60a] disabled:opacity-50">Lock Record →</button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white p-12 border-4 border-[#001d3d] shadow-[12px_12px_0px_#ffd60a] text-[#001d3d] text-center">
            <h2 className="text-3xl font-black italic uppercase mb-8">2. Download Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button onClick={downloadHittingTemplate} className="bg-[#001d3d] text-white p-6 font-black uppercase italic border-4 border-[#c1121f] hover:bg-[#c1121f] transition-all">Hitting Template</button>
              <button onClick={downloadPitchingTemplate} className="bg-[#001d3d] text-white p-6 font-black uppercase italic border-4 border-[#669bbc] hover:bg-[#669bbc] transition-all">Pitching Template</button>
            </div>
            <button onClick={() => setStep(3)} className="mt-12 text-[#c1121f] font-black uppercase text-sm hover:underline italic block w-full">Templates are ready →</button>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white p-12 border-4 border-[#001d3d] shadow-[12px_12px_0px_#ffd60a] text-[#001d3d] text-center">
            <h2 className="text-3xl font-black italic uppercase mb-8">3. Upload Data</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <label className={`p-8 border-4 border-dashed cursor-pointer transition-all ${hittingData.length ? 'bg-green-50 border-green-500 text-green-700' : 'bg-slate-50 border-slate-300'}`}>
                <span className="font-black uppercase italic block mb-2 tracking-tighter text-xl">{hittingData.length ? '✅ HITTING LOADED' : 'Upload Hitting CSV'}</span>
                <input type="file" accept=".csv" onChange={handleHittingUpload} className="hidden" />
              </label>
              <label className={`p-8 border-4 border-dashed cursor-pointer transition-all ${pitchingData.length ? 'bg-green-50 border-green-500 text-green-700' : 'bg-slate-50 border-slate-300'}`}>
                <span className="font-black uppercase italic block mb-2 tracking-tighter text-xl">{pitchingData.length ? '✅ PITCHING LOADED' : 'Upload Pitching CSV'}</span>
                <input type="file" accept=".csv" onChange={handlePitchingUpload} className="hidden" />
              </label>
            </div>
            <button onClick={proceedToMapping} disabled={!hittingData.length && !pitchingData.length} className="w-full bg-[#c1121f] text-white py-6 font-black uppercase italic text-2xl hover:bg-[#001d3d] transition-all disabled:opacity-50 shadow-[8px_8px_0px_#001d3d]">Merge & Review Mapping →</button>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white p-8 border-4 border-[#001d3d] shadow-[12px_12px_0px_#ffd60a] text-[#001d3d]">
            <h2 className="text-3xl font-black italic uppercase mb-8 border-b-4 border-[#c1121f] pb-2">4. Mapping Review</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
              <section>
                <h3 className="font-black uppercase text-[#c1121f] mb-4 text-xl italic tracking-tighter">Players ({mappingState.players.length})</h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {mappingState.players.map((p, idx) => (
                    <div key={idx} className="border-2 border-slate-100 p-4 bg-slate-50">
                      <p className="font-black uppercase text-xs text-slate-400 mb-2">{p.name}</p>
                      <select 
                        className="w-full border-2 border-[#001d3d] p-2 font-bold"
                        value={p.resolvedId || ''}
                        onChange={(e) => {
                          const val = e.target.value === 'NEW' ? 'NEW' : parseInt(e.target.value);
                          const newPlayers = [...mappingState.players];
                          newPlayers[idx].resolvedId = val as any;
                          setMappingState({ ...mappingState, players: newPlayers });
                        }}
                      >
                        <option value="">-- Select Match --</option>
                        <option value="NEW" className="text-[#c1121f] font-black">✨ CREATE AS NEW PLAYER</option>
                        {dbPlayers.map(dbp => <option key={dbp.id} value={dbp.id}>{dbp.name}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <h3 className="font-black uppercase text-[#001d3d] mb-4 text-xl italic tracking-tighter">Teams ({mappingState.teams.length})</h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {mappingState.teams.map((t, idx) => (
                    <div key={idx} className="border-2 border-slate-100 p-4 bg-slate-50">
                      <p className="font-black uppercase text-xs text-slate-400 mb-2">{t.name}</p>
                      <select 
                        className="w-full border-2 border-[#001d3d] p-2 font-bold"
                        value={t.resolvedId || ''}
                        onChange={(e) => {
                          const val = e.target.value === 'NEW' ? 'NEW' : parseInt(e.target.value);
                          const newTeams = [...mappingState.teams];
                          newTeams[idx].resolvedId = val as any;
                          setMappingState({ ...mappingState, teams: newTeams });
                        }}
                      >
                        <option value="">-- Select Match --</option>
                        <option value="NEW" className="text-[#c1121f] font-black">✨ CREATE AS NEW TEAM</option>
                        {dbTeams.map(dbt => <option key={dbt.id} value={dbt.id}>{dbt.name}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <button onClick={finalizeImport} disabled={uploading || mappingState.players.some(p => !p.resolvedId) || mappingState.teams.some(t => !t.resolvedId)} className="w-full bg-[#c1121f] text-white py-6 font-black uppercase italic text-2xl hover:bg-[#22c55e] transition-all shadow-[8px_8px_0px_#001d3d] disabled:opacity-50">
              {uploading ? "SYNCHRONIZING..." : "Complete Import →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}