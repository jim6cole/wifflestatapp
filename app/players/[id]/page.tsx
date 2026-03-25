'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function PlayerCard() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toggle between Batting and Pitching views
  const [activeTab, setActiveTab] = useState<'batting' | 'pitching'>('batting');

  useEffect(() => {
    if (!id) return;
    
    fetch(`/api/public/players/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Player not found");
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#001d3d] flex items-center justify-center">
        <div className="text-[#ffd60a] font-black italic animate-pulse text-4xl uppercase tracking-tighter">
          Pulling Player File...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#001d3d] flex flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-black italic uppercase text-[#c1121f] mb-4">Error 404</h1>
        <p className="text-white font-bold">{error || "Could not load player data."}</p>
        <Link href="/stats/global" className="mt-8 bg-white text-[#001d3d] px-6 py-3 font-black uppercase tracking-widest hover:bg-[#ffd60a] transition-colors">
          Return to Leaderboard
        </Link>
      </div>
    );
  }

  const { player, career, splits } = data;
  const hasPitchingStats = career.pitching.faced > 0;

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] border-[16px] border-[#001d3d] md:p-8 p-4 relative">
      <div className="max-w-6xl mx-auto">
        
        {/* --- NAVIGATION BREADCRUMB --- */}
        <Link href="/stats/global" className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#ffd60a] transition-colors mb-6 inline-block">
          ← Back to Global Stats
        </Link>

        {/* --- HERO SECTION (THE "CARD" FRONT) --- */}
        <div className="bg-white p-6 md:p-10 border-4 border-[#001d3d] shadow-[12px_12px_0px_#c1121f] mb-12 relative overflow-hidden">
          
          {/* Watermark/Background Accent */}
          <div className="absolute -right-10 -top-10 text-[#001d3d] opacity-5 font-black text-[200px] leading-none italic pointer-events-none select-none">
            {player.id}
          </div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6 border-b-8 border-[#c1121f] pb-6">
            <div>
              <p className="text-[#c1121f] font-black uppercase tracking-[0.4em] text-xs mb-2">AWAA Official Player Profile</p>
              <h1 className="text-6xl md:text-8xl font-black italic uppercase text-[#001d3d] tracking-tighter leading-none">
                {player.name}
              </h1>
            </div>

            <div className="flex flex-wrap gap-2 md:max-w-xs justify-end">
              {player.teams.map((team: string) => (
                <span key={team} className="bg-[#001d3d] text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-[#001d3d]">
                  {team}
                </span>
              ))}
            </div>
          </div>

          {/* CAREER QUICK STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <StatBlock label="Career AVG" value={career.rates.avg} />
            <StatBlock label="Career HR" value={career.batting.hr} />
            <StatBlock label="Career OPS" value={career.rates.ops} />
            <StatBlock label="Career RBI" value={career.batting.rbi} highlight />
            
            {hasPitchingStats && (
              <>
                <StatBlock label="Career ERA" value={career.rates.era} isPitching />
                <StatBlock label="Innings Pitched" value={career.rates.ip} isPitching />
                <StatBlock label="Strikeouts" value={career.pitching.k} isPitching />
                <StatBlock label="Career WHIP" value={career.rates.whip} isPitching />
              </>
            )}
          </div>
        </div>

        {/* --- TAB TOGGLES --- */}
        {hasPitchingStats && (
          <div className="flex gap-4 mb-6">
            <button 
              onClick={() => setActiveTab('batting')}
              className={`px-8 py-4 font-black italic uppercase text-xl transition-all border-4 ${activeTab === 'batting' ? 'bg-[#ffd60a] text-[#001d3d] border-[#ffd60a] shadow-[6px_6px_0px_#c1121f]' : 'bg-[#003566] text-[#669bbc] border-[#003566] hover:border-[#ffd60a]'}`}
            >
              Batting Splits
            </button>
            <button 
              onClick={() => setActiveTab('pitching')}
              className={`px-8 py-4 font-black italic uppercase text-xl transition-all border-4 ${activeTab === 'pitching' ? 'bg-[#ffd60a] text-[#001d3d] border-[#ffd60a] shadow-[6px_6px_0px_#c1121f]' : 'bg-[#003566] text-[#669bbc] border-[#003566] hover:border-[#ffd60a]'}`}
            >
              Pitching Splits
            </button>
          </div>
        )}

        {/* --- YEARLY SPLITS TABLE --- */}
        <div className="bg-[#0f172a] rounded-xl overflow-hidden shadow-2xl border border-slate-800">
          <div className="p-4 border-b border-slate-800 bg-[#1e293b]">
            <h2 className="font-black text-lg uppercase tracking-wider text-[#ffd60a]">
              Yearly {activeTab === 'batting' ? 'Offensive' : 'Defensive'} Breakdown
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-slate-500 uppercase text-[10px] bg-[#0f172a] tracking-widest border-b border-slate-800">
                <tr>
                  <th className="px-4 py-4">Season</th>
                  <th className="px-4 py-4">League</th>
                  <th className="px-4 py-4">Style</th>
                  
                  {activeTab === 'batting' ? (
                    <>
                      <th className="px-2 py-4 text-center">AB</th>
                      <th className="px-2 py-4 text-center">H</th>
                      <th className="px-2 py-4 text-center">2B</th>
                      <th className="px-2 py-4 text-center">3B</th>
                      <th className="px-2 py-4 text-center">HR</th>
                      <th className="px-2 py-4 text-center">RBI</th>
                      <th className="px-2 py-4 text-center">BB</th>
                      <th className="px-2 py-4 text-center">K</th>
                      <th className="px-2 py-4 text-center text-[#ffd60a]">AVG</th>
                      <th className="px-2 py-4 text-center text-[#c1121f]">OPS</th>
                    </>
                  ) : (
                    <>
                      <th className="px-2 py-4 text-center">IP</th>
                      <th className="px-2 py-4 text-center">H</th>
                      <th className="px-2 py-4 text-center">ER</th>
                      <th className="px-2 py-4 text-center">BB</th>
                      <th className="px-2 py-4 text-center">K</th>
                      <th className="px-2 py-4 text-center">HR</th>
                      <th className="px-2 py-4 text-center text-[#ffd60a]">ERA</th>
                      <th className="px-2 py-4 text-center text-[#c1121f]">WHIP</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {splits.map((split: any, idx: number) => {
                  const b = split.batting;
                  const p = split.pitching;
                  const r = split.rates;

                  // Skip if they didn't do this activity in this split
                  if (activeTab === 'batting' && b.ab === 0 && b.bb === 0) return null;
                  if (activeTab === 'pitching' && p.faced === 0) return null;

                  return (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-bold text-white">{split.year}</td>
                      <td className="px-4 py-3 text-slate-300 font-medium">{split.leagueName}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-sm ${split.style === 'Fast' ? 'bg-[#c1121f]/20 text-[#c1121f]' : 'bg-blue-500/20 text-blue-400'}`}>
                          {split.style}
                        </span>
                      </td>

                      {activeTab === 'batting' ? (
                        <>
                          <td className="px-2 py-3 text-center tabular-nums">{b.ab}</td>
                          <td className="px-2 py-3 text-center tabular-nums">{b.h}</td>
                          <td className="px-2 py-3 text-center tabular-nums text-slate-500">{b.d}</td>
                          <td className="px-2 py-3 text-center tabular-nums text-slate-500">{b.t}</td>
                          <td className="px-2 py-3 text-center tabular-nums font-bold text-[#c1121f]">{b.hr}</td>
                          <td className="px-2 py-3 text-center tabular-nums">{b.rbi}</td>
                          <td className="px-2 py-3 text-center tabular-nums text-green-600/70">{b.bb}</td>
                          <td className="px-2 py-3 text-center tabular-nums text-slate-500">{b.k}</td>
                          <td className="px-2 py-3 text-center tabular-nums text-[#ffd60a] font-mono text-xs">{r.avg}</td>
                          <td className="px-2 py-3 text-center tabular-nums font-black text-white font-mono text-xs">{r.ops}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-2 py-3 text-center tabular-nums">{r.ip}</td>
                          <td className="px-2 py-3 text-center tabular-nums text-slate-400">{p.h}</td>
                          <td className="px-2 py-3 text-center tabular-nums font-bold text-red-400">{p.er}</td>
                          <td className="px-2 py-3 text-center tabular-nums">{p.bb}</td>
                          <td className="px-2 py-3 text-center tabular-nums font-bold text-[#669bbc]">{p.k}</td>
                          <td className="px-2 py-3 text-center tabular-nums text-slate-500">{p.hr}</td>
                          <td className="px-2 py-3 text-center tabular-nums text-[#ffd60a] font-mono text-xs font-black">{r.era}</td>
                          <td className="px-2 py-3 text-center tabular-nums text-white font-mono text-xs">{r.whip}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

// Quick UI helper for the top cards
function StatBlock({ label, value, highlight = false, isPitching = false }: any) {
  return (
    <div className={`p-4 border-2 flex flex-col justify-center items-center text-center skew-x-[-5deg] ${highlight ? 'bg-[#ffd60a] border-[#ffd60a] text-[#001d3d]' : isPitching ? 'bg-[#003566] border-[#003566] text-white' : 'bg-[#001d3d] border-[#001d3d] text-white'}`}>
      <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${highlight ? 'text-[#001d3d]/70' : isPitching ? 'text-[#669bbc]' : 'text-[#669bbc]'}`}>
        {label}
      </span>
      <span className="text-3xl font-black italic tracking-tighter">
        {value}
      </span>
    </div>
  );
}