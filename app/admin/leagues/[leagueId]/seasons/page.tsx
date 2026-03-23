'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function SeasonArchive({ params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = use(params);
  const router = useRouter();
  
  const { data: session } = useSession();
  const user = session?.user as any;

  // NEW MULTI-LEAGUE PERMISSION CHECK
  const isCommish = user?.isGlobalAdmin || user?.memberships?.some(
    (m: any) => m.leagueId === parseInt(leagueId) && m.roleLevel >= 2 && m.isApproved
  );

  const [seasons, setSeasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/leagues/${leagueId}/seasons`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setSeasons(data);
        setLoading(false);
      });
  }, [leagueId]);

  if (loading) return <div className="min-h-screen bg-[#001d3d] flex items-center justify-center font-black uppercase text-white animate-pulse italic text-2xl">Loading Archive...</div>;

  const activeSeasons = seasons.filter(s => s.status === 'ACTIVE');
  const upcomingSeasons = seasons.filter(s => s.status === 'UPCOMING');
  const endedSeasons = seasons.filter(s => s.status === 'COMPLETED');

  const SeasonRow = ({ season }: { season: any }) => (
    <div className="bg-[#003566] border-2 border-[#669bbc] p-8 shadow-xl flex flex-col lg:flex-row justify-between items-center group hover:border-white transition-all">
      <div className="flex-1 text-center lg:text-left">
        <Link href={`/admin/leagues/${leagueId}/seasons/${season.id}`}>
          <h2 className="text-4xl md:text-5xl font-black italic uppercase text-white hover:text-[#ffd60a] transition-colors cursor-pointer">
            {season.name} <span className="text-xl not-italic ml-2 opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
          </h2>
        </Link>
        <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-4">
          <span className="bg-[#001d3d] border border-white/20 px-3 py-1 text-[10px] font-black uppercase text-[#669bbc]">Innings: {season.inningsPerGame}</span>
          <span className="bg-[#001d3d] border border-white/20 px-3 py-1 text-[10px] font-black uppercase text-[#669bbc]">Clean Hit: {season.cleanHitRule ? 'ON' : 'OFF'}</span>
          <span className="bg-[#001d3d] border border-white/20 px-3 py-1 text-[10px] font-black uppercase text-[#669bbc]">Mercy: {season.mercyRule > 0 ? `${season.mercyRule} Runs` : 'OFF'}</span>
        </div>
      </div>
      
      <div className="mt-6 lg:mt-0 lg:ml-8 flex items-center justify-center">
        <div className={`px-8 py-4 font-black italic uppercase tracking-widest text-xl border-2 transition-all ${
          season.status === 'ACTIVE' ? 'bg-green-600 text-white border-green-400 shadow-[6px_6px_0px_#001d3d]' :
          season.status === 'UPCOMING' ? 'bg-[#ffd60a] text-[#001d3d] border-white shadow-[6px_6px_0px_#001d3d]' :
          'bg-slate-800 text-slate-400 border-slate-600 shadow-[6px_6px_0px_#001d3d]'
        }`}>
          {season.status}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] font-sans p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-12 border-b-4 border-[#669bbc] pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <Link href={`/admin/leagues/${leagueId}`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white mb-4 block">
              ← Back to League Hub
            </Link>
            <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f]">
              Season Archive
            </h1>
          </div>
          {isCommish && (
            <Link href={`/admin/leagues/${leagueId}/seasons/new`} className="bg-[#c1121f] border-2 border-[#fdf0d5] px-8 py-4 font-black uppercase italic text-white hover:bg-white hover:text-[#c1121f] transition-all shadow-xl">
              + New Season
            </Link>
          )}
        </header>

        <div className="space-y-16">
          
          <section>
            <h3 className="text-3xl font-black italic uppercase text-white mb-6 drop-shadow-[2px_2px_0px_#c1121f] flex items-center gap-3">
              <span className="w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-white"></span> Active Campaigns
            </h3>
            {activeSeasons.length === 0 ? (
              <p className="text-sm font-bold text-[#669bbc] uppercase tracking-widest bg-[#003566] p-6 border border-[#669bbc]/50">No active seasons found.</p>
            ) : (
              <div className="space-y-4">
                {activeSeasons.map(s => <SeasonRow key={s.id} season={s} />)}
              </div>
            )}
          </section>

          {isCommish && (
            <>
              {upcomingSeasons.length > 0 && (
                <section>
                  <h3 className="text-3xl font-black italic uppercase text-[#ffd60a] mb-6 drop-shadow-[2px_2px_0px_#003566]">
                    Upcoming Campaigns
                  </h3>
                  <div className="space-y-4">
                    {upcomingSeasons.map(s => <SeasonRow key={s.id} season={s} />)}
                  </div>
                </section>
              )}

              {endedSeasons.length > 0 && (
                <section>
                  <h3 className="text-3xl font-black italic uppercase text-slate-400 mb-6 drop-shadow-[2px_2px_0px_#003566]">
                    Archived Histories
                  </h3>
                  <div className="space-y-4 opacity-80 hover:opacity-100 transition-opacity">
                    {endedSeasons.map(s => <SeasonRow key={s.id} season={s} />)}
                  </div>
                </section>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}