'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function PublicLeagueHub() {
  const { leagueId } = useParams();

  return (
    <div className="min-h-screen bg-[#001d3d] flex flex-col p-8 md:p-16 border-[16px] border-[#001d3d] relative overflow-hidden">
      
      {/* BACKGROUND ACCENT */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#c1121f] rounded-full blur-[120px] opacity-10"></div>

      <div className="max-w-5xl w-full mx-auto relative z-10">
        
        {/* HEADER SECTION WITH BACK BUTTON */}
        <header className="mb-12 border-b-4 border-white/10 pb-6">
          <Link href="/leagues" className="text-[10px] font-black uppercase text-[#669bbc] tracking-[0.3em] hover:text-[#ffd60a] transition-colors inline-block mb-4">
            ← Switch League
          </Link>
          <h1 className="text-7xl md:text-[120px] font-black italic uppercase text-white tracking-tighter leading-none drop-shadow-[6px_6px_0px_#c1121f]">
            LEAGUE<span className="text-[#ffd60a]">HUB</span>
          </h1>
          <p className="text-[#669bbc] font-black uppercase text-[10px] tracking-[0.5em] mt-4 italic">Affiliate Operational Center // ID: {leagueId}</p>
        </header>

        {/* MAIN COMMAND GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* MODULE 1: STATS */}
          <Link href={`/leagues/${leagueId}/stats`} className="group bg-[#ffd60a] p-12 border-4 border-[#001d3d] shadow-[12px_12px_0px_#c1121f] transition-all hover:-translate-y-2 flex flex-col justify-between h-full min-h-[250px]">
            <div className="text-right">
              <span className="text-2xl font-black text-[#001d3d] group-hover:translate-x-2 transition-transform italic inline-block">↗</span>
            </div>
            <div>
              <span className="text-5xl md:text-6xl font-black italic uppercase text-[#001d3d] group-hover:text-[#c1121f] leading-none">Stats</span>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#001d3d]/60 mt-4 italic underline decoration-2">Historical Records</p>
            </div>
          </Link>

          {/* MODULE 2: SCHEDULE */}
          <Link href={`/leagues/${leagueId}/schedule`} className="group bg-white p-12 border-4 border-[#001d3d] shadow-[12px_12px_0px_#ffd60a] transition-all hover:-translate-y-2 flex flex-col justify-between h-full min-h-[250px]">
            <div className="text-right">
              <span className="text-2xl font-black text-[#001d3d] group-hover:translate-x-2 transition-transform italic inline-block">↗</span>
            </div>
            <div>
              <span className="text-5xl md:text-6xl font-black italic uppercase text-[#001d3d] group-hover:text-[#669bbc] leading-none">Schedule</span>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#001d3d]/60 mt-4 italic underline decoration-2">Live & Upcoming</p>
            </div>
          </Link>

          {/* MODULE 3: BOX SCORES (The Archives) */}
          <Link href={`/leagues/${leagueId}/history`} className="group bg-[#669bbc] p-12 border-4 border-[#001d3d] shadow-[12px_12px_0px_#c1121f] transition-all hover:-translate-y-2 flex flex-col justify-between h-full min-h-[250px]">
            <div className="text-right">
              <span className="text-2xl font-black text-white group-hover:translate-x-2 transition-transform italic inline-block">↗</span>
            </div>
            <div>
              <span className="text-5xl md:text-6xl font-black italic uppercase text-white leading-none">Archives</span>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/70 mt-4 italic underline decoration-2">Box Scores & Logs</p>
            </div>
          </Link>

          {/* MODULE 4: STANDINGS */}
          <Link href={`/leagues/${leagueId}/standings`} className="group bg-[#22c55e] p-12 border-4 border-[#001d3d] shadow-[12px_12px_0px_#ffd60a] transition-all hover:-translate-y-2 flex flex-col justify-between h-full min-h-[250px]">
            <div className="text-right">
              <span className="text-2xl font-black text-white group-hover:translate-x-2 transition-transform italic inline-block">↗</span>
            </div>
            <div>
              <span className="text-5xl md:text-6xl font-black italic uppercase text-white leading-none">Standings</span>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/70 mt-4 italic underline decoration-2">Division Rankings</p>
            </div>
          </Link>
        </div>

        {/* FOOTER */}
        <footer className="mt-16 text-center border-t-2 border-white/5 pt-8">
          <p className="text-[9px] font-black uppercase text-[#669bbc] tracking-[0.4em] opacity-30">
            Powered by WIFF+ // Operational Hub
          </p>
        </footer>
      </div>
    </div>
  );
}