'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function SeasonWizard() {
  const router = useRouter();
  const { leagueId } = useParams();
  const [loading, setLoading] = useState(false);

  const [rules, setRules] = useState({
    name: '',
    year: new Date().getFullYear(), // ADDED
    status: 'UPCOMING',
    inningsPerGame: 5,
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

  const handleCreate = async () => {
    if (!rules.name) return alert("Please name this season!");
    setLoading(true);
    
    try {
      const payload = {
        ...rules,
        leagueId: parseInt(leagueId as string) 
      };

      const res = await fetch('/api/admin/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push(`/admin/leagues/${leagueId}`);
        router.refresh();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to create season");
      }
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  if (!leagueId) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black text-white italic text-4xl">LOADING...</div>;

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] border-[12px] border-[#c1121f] p-8 md:p-12">
      <div className="max-w-4xl mx-auto">
        
        <header className="mb-12 border-b-4 border-[#669bbc] pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-6xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f]">Season Wizard</h1>
            <p className="text-[#669bbc] font-bold uppercase text-[10px] tracking-[0.4em] mt-2 italic">Affiliate Profile #{leagueId}</p>
          </div>
          <Link href={`/admin/leagues/${leagueId}`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white transition-colors block mb-4">
            ← Back to League Hub
          </Link>
        </header>

        <div className="bg-[#003566] border-2 border-[#669bbc] p-8 shadow-2xl space-y-10">
          
          <section>
            <label className="block text-[10px] font-black uppercase text-[#669bbc] mb-2 tracking-widest">Season Label</label>
            <input 
              className="w-full bg-[#001d3d] border-2 border-[#fdf0d5] p-5 text-4xl font-black italic uppercase text-white outline-none focus:border-[#c1121f] placeholder:opacity-20"
              placeholder="e.g. 2026 ADK OPENER"
              onChange={(e) => setRules({...rules, name: e.target.value.toUpperCase()})}
            />

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-[#669bbc] mb-2 tracking-widest">Championship Year</label>
                <select 
                  value={rules.year}
                  onChange={(e) => setRules({...rules, year: parseInt(e.target.value)})}
                  className="w-full bg-[#001d3d] border-2 border-[#fdf0d5] p-4 text-xl font-black italic uppercase text-white outline-none focus:border-[#c1121f] cursor-pointer"
                >
                  {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-[#669bbc] mb-2 tracking-widest">Status</label>
                <div className="flex gap-2 h-[64px]">
                  <button 
                    onClick={() => setRules({...rules, status: 'UPCOMING'})} 
                    className={`flex-1 font-black italic uppercase text-xs border-2 transition-all ${rules.status === 'UPCOMING' ? 'bg-[#ffd60a] text-[#001d3d] border-[#ffd60a] shadow-[4px_4px_0px_#001d3d]' : 'bg-[#001d3d] text-white border-white/20 hover:border-[#ffd60a]'}`}
                  >
                    Upcoming
                  </button>
                  <button 
                    onClick={() => setRules({...rules, status: 'ACTIVE'})} 
                    className={`flex-1 font-black italic uppercase text-xs border-2 transition-all ${rules.status === 'ACTIVE' ? 'bg-green-600 text-white border-green-400 shadow-[4px_4px_0px_#001d3d]' : 'bg-[#001d3d] text-white border-white/20 hover:border-green-400'}`}
                  >
                    Active
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-white/10 pt-10">
            {/* COLUMN 1: STRUCTURE */}
            <div className="space-y-6">
              <h3 className="text-xl font-black italic uppercase text-white border-b border-[#c1121f] pb-2 text-center">Standard Play</h3>
              <div className="grid grid-cols-2 gap-4">
                <WizardSelect label="Innings" val={rules.inningsPerGame} options={[3,4,5,6,7,9]} onChange={(v: number) => setRules({...rules, inningsPerGame: v})} />
                <WizardSelect label="Outs/Inn" val={rules.outs} options={[2,3,4]} onChange={(v: number) => setRules({...rules, outs: v})} />
                <WizardSelect label="Balls" val={rules.balls} options={[3,4,5,6]} onChange={(v: number) => setRules({...rules, balls: v})} />
                <WizardSelect label="Strikes" val={rules.strikes} options={[2,3,4]} onChange={(v: number) => setRules({...rules, strikes: v})} />
              </div>

              {/* LINEUP RESTRICTIONS */}
              <div className="pt-4 border-t border-white/5 space-y-4">
                <h4 className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest text-center">Lineup Restrictions</h4>
                <div className="grid grid-cols-2 gap-4">
                  <WizardSelect label="Max DH" val={rules.maxDh} options={[0, 1, 2, 3, 4]} onChange={(v: number) => setRules({...rules, maxDh: v})} />
                  <WizardSelect label="Min Batters" val={rules.minBatters} options={[0, 3, 4, 5, 6, 7, 8, 9]} onChange={(v: number) => setRules({...rules, minBatters: v})} />
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/5 space-y-4">
                <BinaryToggle label="Baserunning" active={rules.isBaserunning} onToggle={(v: boolean) => setRules({...rules, isBaserunning: v})} />
                <Toggle label='Ghost Runner in Extras' active={rules.ghostRunner} onToggle={() => setRules({...rules, ghostRunner: !rules.ghostRunner})} />
              </div>
            </div>

            {/* COLUMN 2: CUSTOM RULES */}
            <div className="space-y-4">
              {!rules.isBaserunning ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <Toggle 
                    label="Clean Hit Rule" 
                    active={rules.cleanHitRule} 
                    onToggle={() => setRules({...rules, cleanHitRule: !rules.cleanHitRule})} 
                  />
                  <Toggle 
                    label="DP Without Runners" 
                    active={rules.dpWithoutRunners} 
                    onToggle={() => setRules({...rules, dpWithoutRunners: !rules.dpWithoutRunners})} 
                  />
                  <Toggle 
                    label="DP Keeps Baserunners" 
                    active={rules.dpKeepsRunners} 
                    onToggle={() => setRules({...rules, dpKeepsRunners: !rules.dpKeepsRunners})} 
                  />
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed border-[#669bbc] opacity-50 flex items-center justify-center text-center">
                  <p className="text-[10px] font-black uppercase text-[#669bbc]">Special Ghost logic hidden for physical baserunning.</p>
                </div>
              )}

              <div className="pt-6 border-t border-white/5 space-y-4">
                <Toggle 
                  label="Speed Restricted" 
                  active={rules.isSpeedRestricted} 
                  onToggle={() => setRules({...rules, isSpeedRestricted: !rules.isSpeedRestricted})} 
                />
                
                {rules.isSpeedRestricted && (
                  <div className="animate-in zoom-in-95 duration-200">
                    <WizardSelect 
                      label="Speed Limit" 
                      val={rules.speedLimit} 
                      options={Array.from({length: 26}, (_, i) => i + 55)} 
                      onChange={(v: number) => setRules({...rules, speedLimit: v})} 
                    />
                    <p className="text-[9px] font-bold text-[#c1121f] uppercase mt-1 px-1 italic">Maximum velocity permitted (MPH)</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 space-y-4">
            <h3 className="text-xl font-black italic uppercase text-white border-b border-[#c1121f] pb-2 text-center mb-6">Mercy Parameters</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="flex items-center justify-between p-5 bg-[#001d3d] rounded-2xl border border-white/5 shadow-inner">
                <div>
                  <p className="font-black italic uppercase text-sm">Mercy Rule (Game)</p>
                  <p className="text-[10px] text-[#669bbc] font-bold uppercase mt-1">End game if lead exceeds amount</p>
                </div>
                <select value={rules.mercyRule} onChange={e => setRules({...rules, mercyRule: parseInt(e.target.value)})} className="bg-[#003566] text-white p-3 rounded-lg font-black text-xs outline-none cursor-pointer border border-[#669bbc]">
                  {[0, 10, 12, 15, 20].map(n => <option key={n} value={n}>{n === 0 ? 'Off' : n + ' Runs'}</option>)}
                </select>
              </div>

              {rules.mercyRule > 0 && (
                <div className="flex items-center justify-between p-5 bg-[#001d3d] rounded-2xl border border-[#c1121f]/50 shadow-inner animate-in fade-in zoom-in-95 duration-200">
                  <div>
                    <p className="font-black italic uppercase text-sm">Applies After</p>
                    <p className="text-[10px] text-[#669bbc] font-bold uppercase mt-1">Inning game mercy takes effect</p>
                  </div>
                  <select value={rules.mercyRuleInningApply} onChange={e => setRules({...rules, mercyRuleInningApply: parseInt(e.target.value)})} className="bg-[#c1121f] text-white p-3 rounded-lg font-black text-xs outline-none cursor-pointer border border-[#fdf0d5]">
                    {[2, 3, 4, 5].map(n => <option key={n} value={n}>Inning {n}</option>)}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between p-5 bg-[#001d3d] rounded-2xl border border-white/5 shadow-inner">
                <div>
                  <p className="font-black italic uppercase text-sm">Run Limit (Inning)</p>
                  <p className="text-[10px] text-[#669bbc] font-bold uppercase mt-1">End half-inning if runs hit amount</p>
                </div>
                <select value={rules.mercyRulePerInning} onChange={e => setRules({...rules, mercyRulePerInning: parseInt(e.target.value)})} className="bg-[#003566] text-white p-3 rounded-lg font-black text-xs outline-none cursor-pointer border border-[#669bbc]">
                  {[0, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n === 0 ? 'Off' : n + ' Runs'}</option>)}
                </select>
              </div>

              <div className="md:col-span-2 mt-2">
                <Toggle 
                  label="Unlimited Final Inning" 
                  active={rules.unlimitedLastInning} 
                  onToggle={() => setRules({...rules, unlimitedLastInning: !rules.unlimitedLastInning})} 
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-[#c1121f] border-2 border-[#fdf0d5] py-6 text-3xl font-black italic uppercase tracking-widest text-white hover:bg-white hover:text-[#c1121f] transition-all shadow-[6px_6px_0px_#001d3d] disabled:opacity-50 mt-8"
          >
            {loading ? 'INITIALIZING...' : 'Establish Season Identity'}
          </button>
        </div>
      </div>
    </div>
  );
}

function WizardSelect({ label, val, options, onChange }: any) {
  return (
    <div className="bg-[#001d3d] p-3 border border-white/10 shadow-inner">
      <p className="text-[10px] font-black uppercase text-[#669bbc] mb-2">{label}</p>
      <select 
        value={val}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="bg-transparent text-2xl font-black italic text-white w-full outline-none cursor-pointer"
      >
        {options.map((opt: number) => <option key={opt} value={opt} className="bg-[#001d3d]">{opt === 0 ? 'Off' : opt}</option>)}
      </select>
    </div>
  );
}

function BinaryToggle({ label, active, onToggle }: { label: string, active: boolean, onToggle: (v: boolean) => void }) {
  return (
    <div className="flex justify-between items-center p-3 bg-black/20 border border-white/10">
      <span className="text-xs font-black uppercase italic text-[#fdf0d5]">{label}</span>
      <div className="flex gap-1">
        <button onClick={() => onToggle(true)} className={`px-4 py-1 text-[10px] font-black uppercase transition-colors ${active ? 'bg-[#c1121f] text-white' : 'bg-white/5 text-[#669bbc]'}`}>On</button>
        <button onClick={() => onToggle(false)} className={`px-4 py-1 text-[10px] font-black uppercase transition-colors ${!active ? 'bg-[#c1121f] text-white' : 'bg-white/5 text-[#669bbc]'}`}>Off</button>
      </div>
    </div>
  );
}

function Toggle({ label, active, onToggle }: any) {
  return (
    <button onClick={onToggle} className="w-full text-left p-3 bg-black/20 border border-white/5 group hover:border-[#fdf0d5] transition-all">
      <div className="flex justify-between items-center">
        <span className="text-xs font-black uppercase italic text-[#fdf0d5] leading-tight">{label}</span>
        <div className={`w-8 h-4 border flex items-center p-1 transition-colors flex-shrink-0 ml-4 ${active ? 'bg-[#c1121f] border-white' : 'bg-transparent border-[#669bbc]'}`}>
          <div className={`w-2 h-2 transition-transform ${active ? 'translate-x-3 bg-white' : 'translate-x-0 bg-[#669bbc]'}`}></div>
        </div>
      </div>
    </button>
  );
}