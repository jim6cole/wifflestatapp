'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SeasonArchive({ params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = use(params);
  const router = useRouter();
  const [seasons, setSeasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/leagues/${leagueId}/seasons`)
      .then(res => res.json())
      .then(data => {
        setSeasons(data);
        setLoading(false);
      });
  }, [leagueId]);

  if (loading) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black uppercase text-white animate-pulse italic">Loading Archive...</div>;

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] font-sans p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 border-b-4 border-[#669bbc] pb-8 flex justify-between items-end">
          <div>
            <button onClick={() => router.back()} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white mb-4 block">← Back</button>
            <h1 className="text-8xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f]">Season Archive</h1>
          </div>
          <Link href={`/admin/leagues/${leagueId}/seasons/new`} className="bg-[#c1121f] border-2 border-white px-6 py-3 font-black uppercase italic text-white hover:bg-white hover:text-[#c1121f] transition-all">+ New Season</Link>
        </header>

        <div className="space-y-6">
          {seasons.map((season) => (
            <div key={season.id} className="bg-[#003566] border-2 border-[#669bbc] p-8 shadow-2xl flex flex-col lg:flex-row justify-between items-center group hover:border-white transition-all">
              <div className="flex-1">
                {/* NEW: Making the Title the main link to the Dashboard */}
                <Link href={`/admin/leagues/${leagueId}/seasons/${season.id}`}>
                  <h2 className="text-5xl font-black italic uppercase text-white hover:text-yellow-400 transition-colors cursor-pointer">
                    {season.name} <span className="text-xl not-italic ml-2 opacity-0 group-hover:opacity-100 transition-opacity">★</span>
                  </h2>
                </Link>
                <div className="flex gap-4 mt-4">
                  <span className="bg-[#001d3d] border border-white/20 px-3 py-1 text-[10px] font-black uppercase">Innings: {season.inningsPerGame}</span>
                  <span className="bg-[#001d3d] border border-white/20 px-3 py-1 text-[10px] font-black uppercase">Clean Hit: {season.cleanHitRule ? 'ON' : 'OFF'}</span>
                  <span className="bg-[#001d3d] border border-white/20 px-3 py-1 text-[10px] font-black uppercase">Mercy: {season.mercyRule} Runs</span>
                </div>
              </div>

              {/* Keep your existing shortcuts, but these are now "Quick Links" */}
              <div className="grid grid-cols-2 gap-2 mt-6 lg:mt-0 lg:ml-8">
                <Link href={`/admin/leagues/${leagueId}/seasons/${season.id}/teams`} className="bg-black/20 border border-white/10 p-3 text-center text-[9px] font-black uppercase tracking-widest text-white hover:bg-white hover:text-black">Edit/Create Teams</Link>
                <Link href={`/admin/leagues/${leagueId}/seasons/${season.id}/players`} className="bg-black/20 border border-white/10 p-3 text-center text-[9px] font-black uppercase tracking-widest text-white hover:bg-white hover:text-black">Manage Players</Link>
                <Link href={`/admin/leagues/${leagueId}/seasons/${season.id}/schedule/new`} className="bg-black/20 border border-white/10 p-3 text-center text-[9px] font-black uppercase tracking-widest text-white hover:bg-white hover:text-black">Schedule Games</Link>
                <Link href={`/admin/leagues/${leagueId}/seasons/${season.id}/schedule`} className="bg-black/20 border border-white/10 p-3 text-center text-[9px] font-black uppercase tracking-widest text-white hover:bg-white hover:text-black">Edit Schedule</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}