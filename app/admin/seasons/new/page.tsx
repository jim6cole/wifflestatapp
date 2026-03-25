'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewSeasonWizard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState({
    name: '',
    inningsPerGame: 5,
    balls: 4,
    strikes: 3,
    outs: 3,
    isSpeedRestricted: false,
    isBaserunning: true,
    cleanHitRule: false,
    ghostRunner: true,
    mercyRule: 10,
    dpWithoutRunners: false, 
    dpKeepsRunners: false,
    // NEW LINEUP LOGIC
    maxDh: 1,
    minBatters: 0
  });

  const handleCreate = async () => {
    if (!rules.name) return alert("Please name this season first!");
    setLoading(true);
    try {
      const res = await fetch('/api/admin/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rules),
      });
      if (res.ok) {
        alert("Season Initialized successfully!");
        router.push('/admin/dashboard');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-12 bg-slate-950 min-h-screen text-white font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="border-b border-white/10 pb-6">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">Season Setup</h1>
          <p className="text-blue-400 font-bold uppercase text-[10px] tracking-widest mt-1">League Commissioner Portal</p>
        </header>

        <div className="space-y-6 bg-slate-900/50 p-8 rounded-3xl border border-white/5 shadow-2xl">
          {/* SEASON NAME */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Season Name</label>
            <input 
              className="w-full bg-slate-950 p-4 rounded-xl border border-white/10 focus:border-red-600 outline-none font-black italic uppercase transition-all"
              onChange={e => setRules({...rules, name: e.target.value})}
              placeholder="e.g. 2026 AWAA SUMMER"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Innings Per Game</label>
              <select value={rules.inningsPerGame} onChange={e => setRules({...rules, inningsPerGame: parseInt(e.target.value)})} className="w-full bg-slate-950 p-4 rounded-xl border border-white/10 font-black outline-none appearance-none">
                {[3, 4, 5, 6, 7, 9].map(n => <option key={n} value={n}>{n} Innings</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Pitching Speed</label>
              <select onChange={e => setRules({...rules, isSpeedRestricted: e.target.value === 'true'})} className="w-full bg-slate-950 p-4 rounded-xl border border-white/10 font-black outline-none">
                <option value="false">Unlimited (Fastpitch)</option>
                <option value="true">Restricted (Slow/Medium)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <label className="text-[9px] font-black uppercase text-slate-600 mb-2 block">Balls (Walk)</label>
              <select value={rules.balls} onChange={e => setRules({...rules, balls: parseInt(e.target.value)})} className="w-full bg-slate-950 p-3 rounded-lg border border-white/5 font-black text-center text-sm">
                {[3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="text-center">
              <label className="text-[9px] font-black uppercase text-slate-600 mb-2 block">Strikes (K)</label>
              <select value={rules.strikes} onChange={e => setRules({...rules, strikes: parseInt(e.target.value)})} className="w-full bg-slate-950 p-3 rounded-lg border border-white/5 font-black text-center text-sm">
                {[2, 3].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="text-center">
              <label className="text-[9px] font-black uppercase text-slate-600 mb-2 block">Outs / Inn</label>
              <select value={rules.outs} onChange={e => setRules({...rules, outs: parseInt(e.target.value)})} className="w-full bg-slate-950 p-3 rounded-lg border border-white/5 font-black text-center text-red-500 text-sm">
                {[2, 3].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          {/* NEW: LINEUP RESTRICTIONS */}
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Max DH Spots</label>
              <select value={rules.maxDh} onChange={e => setRules({...rules, maxDh: parseInt(e.target.value)})} className="w-full bg-slate-950 p-4 rounded-xl border border-white/10 font-black outline-none appearance-none">
                {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Min Batters</label>
              <select value={rules.minBatters} onChange={e => setRules({...rules, minBatters: parseInt(e.target.value)})} className="w-full bg-slate-950 p-4 rounded-xl border border-white/10 font-black outline-none appearance-none text-blue-400">
                <option value={0}>Off</option>
                {[3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <hr className="border-white/5" />

          {/* BASERUNNING SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-5 bg-slate-950 rounded-2xl border border-white/5">
              <div className="max-w-[70%]">
                <p className="font-black italic uppercase text-sm">Baserunning League?</p>
                <p className="text-[10px] text-slate-600 font-bold uppercase mt-1">Are players physically running bases?</p>
              </div>
              <select 
                value={rules.isBaserunning ? 'true' : 'false'}
                onChange={e => setRules({...rules, isBaserunning: e.target.value === 'true'})}
                className="bg-slate-900 p-3 rounded-xl font-black text-xs uppercase border border-white/10 outline-none"
              >
                <option value="true">Yes</option>
                <option value="false">No (Ghost Bases)</option>
              </select>
            </div>

            {/* GHOST BASE SPECIFIC RULES */}
            {!rules.isBaserunning && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center justify-between p-5 bg-yellow-600/5 rounded-2xl border border-yellow-600/20">
                  <div className="max-w-[75%]">
                    <p className="font-black italic uppercase text-sm text-yellow-500">Enable Clean Hit Rule?</p>
                    <p className="text-[10px] text-yellow-700/60 font-bold uppercase mt-1">Untouched hits move runners extra bases</p>
                  </div>
                  <input type="checkbox" checked={rules.cleanHitRule} onChange={e => setRules({...rules, cleanHitRule: e.target.checked})} className="w-6 h-6 accent-yellow-600" />
                </div>

                <div className="flex items-center justify-between p-5 bg-blue-600/5 rounded-2xl border border-blue-600/20">
                  <div className="max-w-[75%]">
                    <p className="font-black italic uppercase text-sm text-blue-400">DPs Without Baserunners?</p>
                    <p className="text-[10px] text-blue-700/60 font-bold uppercase mt-1">Record 2 outs even if bases are empty</p>
                  </div>
                  <input type="checkbox" checked={rules.dpWithoutRunners} onChange={e => setRules({...rules, dpWithoutRunners: e.target.checked})} className="w-6 h-6 accent-blue-600" />
                </div>

                <div className="flex items-center justify-between p-5 bg-blue-600/5 rounded-2xl border border-blue-600/20">
                  <div className="max-w-[75%]">
                    <p className="font-black italic uppercase text-sm text-blue-400">DPs Keep Runners On?</p>
                    <p className="text-[10px] text-blue-700/60 font-bold uppercase mt-1">2 outs occur without removal of the baserunners</p>
                  </div>
                  <input type="checkbox" checked={rules.dpKeepsRunners} onChange={e => setRules({...rules, dpKeepsRunners: e.target.checked})} className="w-6 h-6 accent-blue-600" />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-5 bg-slate-950/50 rounded-2xl border border-white/5">
            <div>
              <p className="font-black italic uppercase text-sm">Ghost Runner in Extras?</p>
              <p className="text-[10px] text-slate-600 font-bold uppercase mt-1">Start extra innings with runner on 2nd</p>
            </div>
            <input type="checkbox" checked={rules.ghostRunner} onChange={e => setRules({...rules, ghostRunner: e.target.checked})} className="w-6 h-6 accent-red-600" />
          </div>

          <div className="flex items-center justify-between p-5 bg-slate-950/50 rounded-2xl border border-white/5">
            <div>
              <p className="font-black italic uppercase text-sm">Mercy Rule (Runs)</p>
              <p className="text-[10px] text-slate-600 font-bold uppercase mt-1">End game if lead exceeds this amount</p>
            </div>
            <select value={rules.mercyRule} onChange={e => setRules({...rules, mercyRule: parseInt(e.target.value)})} className="bg-slate-900 p-2 rounded-lg font-black text-xs">
              {[0, 10, 12, 15].map(n => <option key={n} value={n}>{n === 0 ? 'Off' : n + ' Runs'}</option>)}
            </select>
          </div>

          <button 
            onClick={handleCreate}
            disabled={loading}
            className={`w-full ${loading ? 'bg-slate-800' : 'bg-red-600 hover:bg-white hover:text-black'} p-6 rounded-2xl font-black uppercase italic tracking-widest transition-all shadow-xl group`}
          >
            {loading ? 'INITIALIZING...' : 'Finalize Season & Rules →'}
          </button>
        </div>
      </div>
    </div>
  );
}