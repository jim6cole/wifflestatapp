'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function PublicLeagueHub() {
  const { leagueId } = useParams();

  return (
    <div className="min-h-screen bg-[#001d3d] flex flex-col items-center justify-center p-6 border-[16px] border-[#001d3d]">
      <div className="max-w-5xl w-full text-center space-y-12">
        <h1 className="text-[80px] md:text-[140px] font-black italic uppercase text-white tracking-tighter leading-none drop-shadow-[8px_8px_0px_#c1121f]">
          LEAGUE<span className="text-[#ffd60a]">HUB</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* STATS BUTTON */}
          <Link href={`/leagues/${leagueId}/stats`} className="group bg-[#ffd60a] p-16 border-4 border-[#001d3d] shadow-[12px_12px_0px_#c1121f] transition-all hover:-translate-y-2">
            <span className="text-6xl md:text-7xl font-black italic uppercase text-[#001d3d] group-hover:text-[#c1121f]">Stats</span>
            <p className="text-xs font-bold uppercase tracking-[0.5em] text-[#001d3d]/60 mt-4 italic underline decoration-4">Historical Records</p>
          </Link>

          {/* SCHEDULE BUTTON */}
          <Link href={`/leagues/${leagueId}/schedule`} className="group bg-white p-16 border-4 border-[#001d3d] shadow-[12px_12px_0px_#ffd60a] transition-all hover:-translate-y-2">
            <span className="text-6xl md:text-7xl font-black italic uppercase text-[#001d3d] group-hover:text-[#669bbc]">Schedule</span>
            <p className="text-xs font-bold uppercase tracking-[0.5em] text-[#001d3d]/60 mt-4 italic underline decoration-4">Live & Upcoming</p>
          </Link>
        </div>
        
        <Link href="/leagues" className="inline-block text-[#669bbc] font-black uppercase tracking-[0.3em] text-[10px] hover:text-[#ffd60a] transition-colors mt-12">
          ← Switch League
        </Link>
      </div>
    </div>
  );
}