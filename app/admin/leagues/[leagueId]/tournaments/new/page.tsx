'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function TournamentWizard() {
  const router = useRouter();
  const { leagueId } = useParams();
  const [loading, setLoading] = useState(false);

  const [rules, setRules] = useState({
    name: '',
    leagueId: 0,
    status: 'UPCOMING',
    isTournament: true, 
    inningsPerGame: 4,  
    playoffInnings: 5,  
    balls: 4,
    strikes: 3,
    outs: 3,
    isSpeedRestricted: false,
    speedLimit: 60,
    isBaserunning: false,
    cleanHitRule: true,
    ghostRunner: true,
    mercyRule: 10,
    mercyRulePerInning: 0,
    mercyRuleInningApply: 3,
    unlimitedLastInning: false,
    dpWithoutRunners: false,
    dpKeepsRunners: false,
    maxDh: 1,
    minBatters: 0      
  });

  useEffect(() => {
    if (leagueId) {
      setRules(prev => ({ ...prev, leagueId: parseInt(leagueId as string) }));
    }
  }, [leagueId]);

  const handleCreate = async () => {
    if (!rules.name) return alert("Please name this tournament!");
    
    setLoading(true);
    try {
      const res = await fetch('/api/admin/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rules),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/admin/leagues/${leagueId}`);
        router.refresh();
      } else {
        alert(`LAUNCH FAILED: ${data.error || 'Unknown Server Error'}`);
      }
    } catch (err) { 
      console.error(err);
      alert("Network Error: Could not connect to the server.");
    } finally { 
      setLoading(false); 
    }
  };

  if (!leagueId) return <div className="min-h-screen bg-[#fdf0d5] flex items-center justify-center font-black text-[#001d3d] italic text-4xl animate-bounce">LOADING...</div>;

  return (
    <div className="min-h-screen bg-[#fdf0d5] text-[#001d3d] border-[16px] border-[#001d3d] p-8 md:p-12">
      <div className="max-w-4xl mx-auto">
        
        <header className="mb-12 border-b-8 border-[#c1121f] pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-6xl font-black italic uppercase tracking-tighter text-[#001d3d] drop-shadow-[4px_4px_0px_#ffd60a]">Standalone Event</h1>
            <p className="text-[#c1121f] font-bold uppercase text-[10px] tracking-[0.4em] mt-2 italic">WIFF+ // One-Off Tournament Setup</p>
          </div>
          <Link href={`/admin/leagues/${leagueId}`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#c1121f] transition-colors block mb-4">
            ← Cancel
          </Link>
        </header>

        <div className="bg-white border-4 border-[#001d3d] p-8 shadow-[12px_12px_0px_#c1121f] space-y-10">
          
          <section>
            <label className="block text-[10px] font-black uppercase text-[#669bbc] mb-2 tracking-widest">Tournament Name</label>
            <input 
              className="w-full bg-white border-4 border-[#001d3d] p-5 text-4xl font-black italic uppercase text-[#001d3d] outline-none focus:border-[#c1121f] placeholder:opacity-20 shadow-inner"
              placeholder="e.g. 2026 SATURDAY SHOOTOUT"
              value={rules.name}
              onChange={(e) => setRules(prev => ({...prev, name: e.target.value.toUpperCase()}))}
            />

            <div className="mt-6 flex gap-4">
              <button 
                type="button"
                onClick={() => setRules(prev => ({...prev, status: 'UPCOMING'}))} 
                className={`flex-1 p-4 font-black italic uppercase text-sm border-4 transition-all ${rules.status === 'UPCOMING' ? 'bg-[#ffd60a] text-[#001d3d] border-[#001d3d] shadow-[4px_4px_0px_#001d3d]' : 'bg-white text-slate-400 border-slate-200 hover:border-[#ffd60a]'}`}
              >
                Planning (Draft)
              </button>
              <button 
                type="button"
                onClick={() => setRules(prev => ({...prev, status: 'ACTIVE'}))} 
                className={`flex-1 p-4 font-black italic uppercase text-sm border-4 transition-all ${rules.status === 'ACTIVE' ? 'bg-[#22c55e] text-white border-[#001d3d] shadow-[4px_4px_0px_#001d3d]' : 'bg-white text-slate-400 border-slate-200 hover:border-[#22c55e]'}`}
              >
                Event Live
              </button>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t-4 border-[#001d3d]/10 pt-10">
            {/* STRUCTURE */}
            <div className="space-y-6">
              <h3 className="text-xl font-black italic uppercase text-[#001d3d] border-b-4 border-[#ffd60a] pb-2 text-center">Structure</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <WizardSelect label="Pool Play Innings" val={rules.inningsPerGame} options={[3,4,5,6,7]} onChange={(v: number) => setRules(p => ({...p, inningsPerGame: v}))} />
                <WizardSelect label="Bracket Innings" val={rules.playoffInnings} options={[3,4,5,6,7]} onChange={(v: number) => setRules(p => ({...p, playoffInnings: v}))} />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t-4 border-[#001d3d]/10">
                <WizardSelect label="Outs/Inn" val={rules.outs} options={[2,3,4]} onChange={(v: number) => setRules(p => ({...p, outs: v}))} />
                <WizardSelect label="Balls" val={rules.balls} options={[3,4,5,6]} onChange={(v: number) => setRules(p => ({...p, balls: v}))} />
                <WizardSelect label="Strikes" val={rules.strikes} options={[2,3,4]} onChange={(v: number) => setRules(p => ({...p, strikes: v}))} />
              </div>

              {/* NEW: LINEUP RESTRICTIONS */}
              <div className="pt-4 border-t-4 border-[#001d3d]/10 space-y-4">
                <h4 className="text-[10px] font-black uppercase text-[#c1121f] tracking-widest text-center">Lineup Restrictions</h4>
                <div className="grid grid-cols-2 gap-4">
                  <WizardSelect label="Max DH" val={rules.maxDh} options={[0, 1, 2, 3, 4]} onChange={(v: number) => setRules(p => ({...p, maxDh: v}))} />
                  <WizardSelect label="Min Batters" val={rules.minBatters} options={[0, 3, 4, 5, 6, 7, 8, 9]} onChange={(v: number) => setRules(p => ({...p, minBatters: v}))} />
                </div>
              </div>
            </div>

            {/* CUSTOM RULES */}
            <div className="space-y-4">
              <h3 className="text-xl font-black italic uppercase text-[#001d3d] border-b-4 border-[#ffd60a] pb-2 text-center">Rule Variations</h3>
              
              <div className="space-y-2">
                <BinaryToggle label="Physical Baserunning" active={rules.isBaserunning} onToggle={(v: boolean) => setRules(p => ({...p, isBaserunning: v}))} />
                <Toggle label="Ghost Runner in Extras" active={rules.ghostRunner} onToggle={() => setRules(p => ({...p, ghostRunner: !p.ghostRunner}))} />
              </div>

              {!rules.isBaserunning && (
                <div className="space-y-2 p-4 bg-[#fdf0d5] border-2 border-[#001d3d] shadow-inner">
                  <Toggle label="Clean Hit Rule" active={rules.cleanHitRule} onToggle={() => setRules(p => ({...p, cleanHitRule: !p.cleanHitRule}))} />
                  <Toggle label="DP Without Runners" active={rules.dpWithoutRunners} onToggle={() => setRules(p => ({...p, dpWithoutRunners: !p.dpWithoutRunners}))} />
                  <Toggle label="DP Keeps Runners" active={rules.dpKeepsRunners} onToggle={() => setRules(p => ({...p, dpKeepsRunners: !p.dpKeepsRunners}))} />
                </div>
              )}

              <div className="pt-4 border-t-4 border-[#001d3d]/10 space-y-4">
                <Toggle 
                  label="Speed Restricted" 
                  active={rules.isSpeedRestricted} 
                  onToggle={() => setRules(p => ({...p, isSpeedRestricted: !p.isSpeedRestricted}))} 
                />
                
                {rules.isSpeedRestricted && (
                  <div className="animate-in zoom-in-95 duration-200 pl-4 border-l-4 border-[#c1121f]">
                    <WizardSelect 
                      label="Speed Limit (MPH)" 
                      val={rules.speedLimit} 
                      options={Array.from({length: 21}, (_, i) => i + 60)} 
                      onChange={(v: number) => setRules(p => ({...p, speedLimit: v}))} 
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MERCY PARAMETERS */}
          <div className="border-t-4 border-[#001d3d]/10 pt-8 space-y-4">
            <h3 className="text-xl font-black italic uppercase text-[#001d3d] border-b-4 border-[#ffd60a] pb-2 text-center mb-6">Mercy Parameters</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="flex items-center justify-between p-5 bg-[#fdf0d5] border-2 border-[#001d3d] shadow-inner">
                <div>
                  <p className="font-black italic uppercase text-sm text-[#001d3d]">Mercy Rule (Game)</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">End game if lead exceeds amount</p>
                </div>
                <select value={rules.mercyRule} onChange={e => setRules(p => ({...p, mercyRule: parseInt(e.target.value)}))} className="bg-white text-[#001d3d] p-3 border-2 border-[#001d3d] font-black text-xs outline-none cursor-pointer">
                  {[0, 10, 12, 15, 20].map(n => <option key={n} value={n}>{n === 0 ? 'Off' : n + ' Runs'}</option>)}
                </select>
              </div>

              {rules.mercyRule > 0 && (
                <div className="flex items-center justify-between p-5 bg-[#c1121f] border-2 border-[#001d3d] shadow-[4px_4px_0px_#001d3d] animate-in fade-in zoom-in-95 duration-200">
                  <div>
                    <p className="font-black italic uppercase text-sm text-white">Applies After</p>
                    <p className="text-[9px] text-[#fdf0d5] font-bold uppercase mt-1">Inning game mercy takes effect</p>
                  </div>
                  <select value={rules.mercyRuleInningApply} onChange={e => setRules(p => ({...p, mercyRuleInningApply: parseInt(e.target.value)}))} className="bg-white text-[#c1121f] p-3 border-2 border-[#001d3d] font-black text-xs outline-none cursor-pointer">
                    {[2, 3, 4, 5].map(n => <option key={n} value={n}>Inning {n}</option>)}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between p-5 bg-[#fdf0d5] border-2 border-[#001d3d] shadow-inner">
                <div>
                  <p className="font-black italic uppercase text-sm text-[#001d3d]">Run Limit (Inning)</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">End half-inning if runs hit amount</p>
                </div>
                <select value={rules.mercyRulePerInning} onChange={e => setRules(p => ({...p, mercyRulePerInning: parseInt(e.target.value)}))} className="bg-white text-[#001d3d] p-3 border-2 border-[#001d3d] font-black text-xs outline-none cursor-pointer">
                  {[0, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n === 0 ? 'Off' : n + ' Runs'}</option>)}
                </select>
              </div>

              <div className="md:col-span-2 mt-2">
                <Toggle 
                  label="Unlimited Final Inning" 
                  active={rules.unlimitedLastInning} 
                  onToggle={() => setRules(p => ({...p, unlimitedLastInning: !p.unlimitedLastInning}))} 
                />
              </div>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-[#c1121f] border-4 border-[#001d3d] py-6 text-3xl font-black italic uppercase tracking-widest text-white hover:bg-white hover:text-[#c1121f] transition-all shadow-[8px_8px_0px_#001d3d] disabled:opacity-50 mt-8"
          >
            {loading ? 'BUILDING...' : 'Launch Tournament'}
          </button>
        </div>
      </div>
    </div>
  );
}

function WizardSelect({ label, val, options, onChange }: any) {
  return (
    <div className="bg-[#fdf0d5] p-3 border-2 border-[#001d3d] shadow-inner">
      <p className="text-[9px] font-black uppercase text-[#669bbc] mb-1">{label}</p>
      <select 
        value={val}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="bg-transparent text-2xl font-black italic text-[#001d3d] w-full outline-none cursor-pointer"
      >
        {options.map((opt: number) => <option key={opt} value={opt}>{opt === 0 ? 'Off' : opt}</option>)}
      </select>
    </div>
  );
}

function BinaryToggle({ label, active, onToggle }: { label: string, active: boolean, onToggle: (v: boolean) => void }) {
  return (
    <div className="flex justify-between items-center p-3 bg-white border-2 border-[#001d3d]">
      <span className="text-xs font-black uppercase italic text-[#001d3d]">{label}</span>
      <div className="flex gap-1">
        <button type="button" onClick={() => onToggle(true)} className={`px-4 py-1 text-[10px] font-black uppercase transition-colors border-2 ${active ? 'bg-[#c1121f] text-white border-[#001d3d]' : 'bg-white text-slate-400 border-slate-200'}`}>On</button>
        <button type="button" onClick={() => onToggle(false)} className={`px-4 py-1 text-[10px] font-black uppercase transition-colors border-2 ${!active ? 'bg-[#c1121f] text-white border-[#001d3d]' : 'bg-white text-slate-400 border-slate-200'}`}>Off</button>
      </div>
    </div>
  );
}

function Toggle({ label, active, onToggle }: any) {
  return (
    <button type="button" onClick={onToggle} className="w-full text-left p-3 bg-white border-2 border-[#001d3d] flex justify-between items-center hover:border-[#c1121f] transition-colors">
      <span className="text-[10px] font-black uppercase italic text-[#001d3d] pr-4">{label}</span>
      <div className={`w-8 h-4 border-2 flex items-center p-0.5 transition-colors flex-shrink-0 ${active ? 'bg-[#c1121f] border-[#001d3d]' : 'bg-slate-200 border-slate-400'}`}>
        <div className={`w-2 h-2 bg-[#001d3d] transition-transform ${active ? 'translate-x-3' : 'translate-x-0'}`}></div>
      </div>
    </button>
  );
}