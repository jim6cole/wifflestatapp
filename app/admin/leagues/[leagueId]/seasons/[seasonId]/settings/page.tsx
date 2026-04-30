'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SeasonSettingsPage() {
  const { leagueId, seasonId } = useParams();
  const router = useRouter();

  const [formData, setFormData] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/seasons/${seasonId}`)
      .then(res => res.json())
      .then(data => {
        setFormData(data);
        setIsLoaded(true);
      })
      .catch(err => console.error("Failed to load season settings", err));
  }, [seasonId]);

  // Handlers for the custom inputs
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDropdownChange = (name: string, value: number) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleToggle = (name: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/seasons/${seasonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error("Failed to save");
      
      alert("Season Settings Updated Successfully!");
      router.push(`/admin/leagues/${leagueId}/seasons/${seasonId}`);
    } catch (err) {
      console.error(err);
      alert("Error saving settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) return <div className="min-h-screen bg-[#001d3d] text-white flex items-center justify-center font-black italic animate-pulse">LOADING SETTINGS...</div>;

  // UI Component Helpers
  const Dropdown = ({ label, name, value, options, subtext }: any) => (
    <div>
      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">{label}</label>
      <div className="relative">
        <select 
          name={name} 
          value={value} 
          onChange={(e) => handleDropdownChange(name, Number(e.target.value))}
          className="w-full bg-[#001d3d] border-2 border-white/10 p-4 rounded-xl text-white font-black uppercase appearance-none cursor-pointer hover:border-blue-500 focus:border-red-500 focus:outline-none transition-colors"
        >
          {options.map((opt: any) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
      {subtext && <p className="text-[9px] text-slate-500 mt-2 uppercase font-bold">{subtext}</p>}
    </div>
  );

  const Toggle = ({ label, name, checked }: any) => (
    <div 
      className={`flex items-center justify-between p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 ${checked ? 'bg-[#002D62] border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-[#001d3d] border-white/5 hover:border-white/20'}`}
      onClick={() => handleToggle(name)}
    >
      <span className={`text-xs font-black uppercase tracking-widest transition-colors ${checked ? 'text-white' : 'text-slate-400'}`}>{label}</span>
      <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${checked ? 'bg-red-600' : 'bg-slate-700'}`}>
        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#001d3d] text-white p-8 font-sans pb-24">
      <div className="max-w-3xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-10 text-center">
          <Link href={`/admin/leagues/${leagueId}/seasons/${seasonId}`} className="text-yellow-400 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors mb-4 inline-block">
            ← Back to Season Hub
          </Link>
          <h1 className="text-5xl font-black uppercase italic tracking-tighter text-white">Season Settings</h1>
          <p className="text-[#669bbc] font-bold uppercase text-xs tracking-widest mt-2">Configuration Wizard</p>
        </div>

        <div className="space-y-6">
          
          {/* CARD 1: GENERAL SPECS */}
          <div className="bg-[#002D62] p-8 rounded-2xl border border-white/10 shadow-xl">
            <h2 className="text-xl font-black text-red-500 uppercase italic border-b border-white/10 pb-4 mb-6">General Specs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Season Name</label>
                <input type="text" name="name" value={formData.name || ''} onChange={handleTextChange} className="w-full bg-[#001d3d] border-2 border-white/10 p-4 rounded-xl text-white font-black uppercase hover:border-blue-500 focus:border-red-500 focus:outline-none transition-colors" />
              </div>
              <Dropdown 
                label="Innings Per Game" 
                name="inningsPerGame" 
                value={formData.inningsPerGame} 
                options={[
                  { label: "3 Innings", value: 3 }, { label: "4 Innings", value: 4 }, { label: "5 Innings (Standard)", value: 5 },
                  { label: "6 Innings", value: 6 }, { label: "7 Innings", value: 7 }, { label: "9 Innings", value: 9 }
                ]}
              />
            </div>
          </div>

          {/* CARD 2: THE COUNT */}
          <div className="bg-[#002D62] p-8 rounded-2xl border border-white/10 shadow-xl">
            <h2 className="text-xl font-black text-red-500 uppercase italic border-b border-white/10 pb-4 mb-6">The Count</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Dropdown label="Balls for Walk" name="balls" value={formData.balls} options={[ { label: "3 Balls", value: 3 }, { label: "4 Balls (Standard)", value: 4 }, { label: "5 Balls", value: 5 }, { label: "6 Balls", value: 6 } ]} />
              <Dropdown label="Strikes for Out" name="strikes" value={formData.strikes} options={[ { label: "2 Strikes", value: 2 }, { label: "3 Strikes (Standard)", value: 3 }, { label: "4 Strikes", value: 4 } ]} />
              <Dropdown label="Outs Per Inning" name="outs" value={formData.outs} options={[ { label: "2 Outs", value: 2 }, { label: "3 Outs (Standard)", value: 3 }, { label: "4 Outs", value: 4 } ]} />
            </div>
          </div>

          {/* CARD 3: GAME LIMITS */}
          <div className="bg-[#002D62] p-8 rounded-2xl border border-white/10 shadow-xl">
            <h2 className="text-xl font-black text-red-500 uppercase italic border-b border-white/10 pb-4 mb-6">Game Limits</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Dropdown 
                label="Mercy Rule (Runs)" name="mercyRule" value={formData.mercyRule} 
                subtext="Run diff to end game"
                options={[ { label: "Off (Play Full Game)", value: 0 }, { label: "5 Runs", value: 5 }, { label: "10 Runs", value: 10 }, { label: "12 Runs", value: 12 }, { label: "15 Runs", value: 15 } ]} 
              />
              <Dropdown 
                label="Mercy Inning Trigger" name="mercyRuleInningApply" value={formData.mercyRuleInningApply} 
                subtext="When does mercy activate?"
                options={[ { label: "After 2 Innings", value: 2 }, { label: "After 3 Innings", value: 3 }, { label: "After 4 Innings", value: 4 }, { label: "After 5 Innings", value: 5 } ]} 
              />
              <Dropdown 
                label="Max Runs Per Inning" name="mercyRulePerInning" value={formData.mercyRulePerInning} 
                subtext="Inning run limit"
                options={[ { label: "Unlimited", value: 0 }, { label: "3 Runs", value: 3 }, { label: "5 Runs", value: 5 }, { label: "7 Runs", value: 7 }, { label: "10 Runs", value: 10 } ]} 
              />
            </div>
          </div>

          {/* CARD 4: GAMEPLAY MECHANICS */}
          <div className="bg-[#002D62] p-8 rounded-2xl border border-white/10 shadow-xl">
            <h2 className="text-xl font-black text-red-500 uppercase italic border-b border-white/10 pb-4 mb-6">Gameplay Mechanics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Toggle label="Live Baserunning / Tagging" name="isBaserunning" checked={formData.isBaserunning} />
               <Toggle label="Clean Hit Extra Bases" name="cleanHitRule" checked={formData.cleanHitRule} />
               <Toggle label="Ghost Runners (Extra Innings)" name="ghostRunner" checked={formData.ghostRunner} />
               <Toggle label="Unlimited Runs in Final Inning" name="unlimitedLastInning" checked={formData.unlimitedLastInning} />
            </div>
          </div>

          {/* CARD 5: PITCHING RULES */}
          <div className="bg-[#002D62] p-8 rounded-2xl border border-white/10 shadow-xl">
            <h2 className="text-xl font-black text-red-500 uppercase italic border-b border-white/10 pb-4 mb-6">Pitching & Defense</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Dropdown 
                label="ERA Calculation Standard" name="eraStandard" value={formData.eraStandard} 
                subtext="Innings used for ERA math"
                options={[ { label: "3 Innings", value: 3 }, { label: "4 Innings", value: 4 }, { label: "5 Innings", value: 5 }, { label: "6 Innings", value: 6 }, { label: "9 Innings", value: 9 } ]} 
              />
              <div className="pt-6">
                 <Toggle label="Allow Pitcher Re-Entry" name="allowPitcherReentry" checked={formData.allowPitcherReentry} />
              </div>
            </div>

            <div className="bg-[#001d3d] p-6 rounded-xl border-2 border-white/5 mt-4">
               <Toggle label="Enable Pitch Speed Limits" name="isSpeedRestricted" checked={formData.isSpeedRestricted} />
               
               {formData.isSpeedRestricted && (
                 <div className="mt-6 pt-6 border-t border-white/5">
                   <Dropdown 
                      label="Maximum Speed (MPH)" name="speedLimit" value={formData.speedLimit} 
                      options={[ { label: "40 MPH", value: 40 }, { label: "45 MPH", value: 45 }, { label: "50 MPH", value: 50 }, { label: "55 MPH", value: 55 }, { label: "60 MPH", value: 60 }, { label: "70 MPH", value: 70 } ]} 
                   />
                 </div>
               )}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-8">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={`w-full bg-red-600 text-white p-6 rounded-2xl font-black uppercase tracking-widest text-lg transition-all ${isSaving ? 'opacity-50' : 'hover:bg-white hover:text-red-600 shadow-[0_0_30px_rgba(220,38,38,0.4)]'}`}
            >
              {isSaving ? 'Saving Configurations...' : 'Save Season Rules'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}