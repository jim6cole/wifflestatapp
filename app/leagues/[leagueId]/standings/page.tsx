import Link from 'next/link';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function StandingsHubPage({ params }: { params: Promise<{ leagueId: string }> }) {
  const { leagueId } = await params;
  const lId = parseInt(leagueId);

  // Fetch the league and all its seasons
  const league = await prisma.league.findUnique({
    where: { id: lId },
    include: {
      seasons: {
        orderBy: { id: 'desc' } // Most recent first
      }
    }
  });

  if (!league) return notFound();

  // Smart Sorting: Find the active season(s). 
  // It looks for an `isActive` or `status === 'ACTIVE'` flag. 
  // If it doesn't find one, it safely assumes the newest season (index 0) is the active one.
  let activeSeasons = league.seasons.filter(s => (s as any).isActive === true || (s as any).status === 'ACTIVE');
  
  if (activeSeasons.length === 0 && league.seasons.length > 0) {
    activeSeasons = [league.seasons[0]];
  }

  // Any season that isn't in the active list goes to the Past Seasons list
  const pastSeasons = league.seasons.filter(s => !activeSeasons.some(a => a.id === s.id));

  return (
    <div className="min-h-screen bg-[#fdf0d5] text-[#001d3d] p-4 md:p-12 border-[16px] border-[#001d3d]">
      <div className="max-w-4xl mx-auto">
        
        {/* --- HEADER --- */}
        <header className="mb-12 border-b-8 border-[#c1121f] pb-6">
          <Link href={`/leagues/${leagueId}`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#c1121f] mb-4 block transition-colors">
            ← BACK TO LEAGUE
          </Link>
          <h1 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter drop-shadow-[6px_6px_0px_#ffd60a]">
            Standings Hub
          </h1>
          <p className="text-xl font-bold italic mt-4 uppercase text-[#669bbc]">
            {league.name}
          </p>
        </header>

        {/* --- ACTIVE SEASONS --- */}
        <div className="mb-16">
          <h2 className="text-4xl font-black italic uppercase mb-6 drop-shadow-[2px_2px_0px_#ffd60a]">Current Season</h2>
          <div className="grid grid-cols-1 gap-6">
            {activeSeasons.length > 0 ? (
              activeSeasons.map((season) => (
                <Link key={season.id} href={`/leagues/${leagueId}/standings/${season.id}`}>
                  <div className="bg-[#001d3d] border-4 border-[#001d3d] p-8 shadow-[8px_8px_0px_#c1121f] hover:shadow-[12px_12px_0px_#ffd60a] hover:-translate-y-1 transition-all group cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-3xl font-black italic uppercase text-white group-hover:text-[#ffd60a] transition-colors">{season.name}</h3>
                        <p className="text-[#669bbc] font-bold uppercase tracking-widest mt-2 text-sm">View Full Standings →</p>
                      </div>
                      <div className="hidden md:block">
                        <span className="bg-[#c1121f] text-white px-4 py-2 font-black italic uppercase text-sm border-2 border-[#001d3d]">Active</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="bg-white border-4 border-[#001d3d] p-8 shadow-[8px_8px_0px_#000] text-center">
                <p className="font-bold italic text-slate-400 uppercase">No active seasons found.</p>
              </div>
            )}
          </div>
        </div>

        {/* --- PAST SEASONS --- */}
        {pastSeasons.length > 0 && (
          <div>
            <h2 className="text-4xl font-black italic uppercase mb-6 opacity-50 drop-shadow-[2px_2px_0px_#fff]">Archived Seasons</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pastSeasons.map((season) => (
                <Link key={season.id} href={`/leagues/${leagueId}/standings/${season.id}`}>
                  <div className="bg-white border-4 border-[#001d3d] p-6 shadow-[6px_6px_0px_#000] hover:bg-[#ffd60a] transition-colors group cursor-pointer">
                    <h3 className="text-2xl font-black italic uppercase text-[#001d3d]">{season.name}</h3>
                    <p className="text-[#669bbc] font-bold uppercase tracking-widest mt-2 text-xs group-hover:text-[#001d3d]">Final Standings →</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}