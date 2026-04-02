import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from 'next/link';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  
  // If no session, send them back to the home plate login
  if (!session?.user?.email) redirect('/login');

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { memberships: { include: { league: true } } }
  });

  // If user doesn't exist in DB, send to login
  if (!dbUser) redirect('/login');

  const isGlobalAdmin = dbUser.isGlobalAdmin;

  // NEW: Identify if the user is a Commissioner (Tier 2+) for any league
  const isCommissioner = isGlobalAdmin || dbUser.memberships.some(m => m.isApproved && m.roleLevel >= 2);

  let displayLeagues: any[] = [];
  let pendingMemberships: any[] = [];

  if (isGlobalAdmin) {
    const allLeagues = await prisma.league.findMany({ orderBy: { name: 'asc' } });
    displayLeagues = allLeagues.map(l => ({
      id: `root-${l.id}`, leagueId: l.id, roleLevel: 3, league: l
    }));
  } else {
    displayLeagues = dbUser.memberships.filter(m => m.isApproved);
    pendingMemberships = dbUser.memberships.filter(m => !m.isApproved);
  }

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] font-sans border-[12px] border-[#c1121f]">
      <div className="max-w-7xl mx-auto p-8 md:p-12">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-16 border-b-4 border-[#669bbc] pb-8">
          <div>
            <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f] leading-none">
              WIFF<span className="text-[#ffd60a]">+</span>
            </h1>
            <p className="text-[#fdf0d5] font-bold uppercase text-xs tracking-[0.3em] mt-2 italic">
              The Commissioner's Clubhouse
            </p>
          </div>
          
          <div className={`border-4 p-6 shadow-[8px_8px_0px_#c1121f] skew-x-[-10deg] mt-6 md:mt-0 ${isGlobalAdmin ? 'bg-white border-[#001d3d]' : 'bg-[#ffd60a] border-[#001d3d]'}`}>
            <p className={`text-[10px] font-black uppercase tracking-widest skew-x-[10deg] ${isGlobalAdmin ? 'text-[#c1121f]' : 'text-[#001d3d]'}`}>
              {isGlobalAdmin ? 'Hall of Fame Admin' : 'League Official'}
            </p>
            <p className={`text-2xl font-black uppercase italic skew-x-[10deg] ${isGlobalAdmin ? 'text-[#001d3d]' : 'text-[#001d3d]'}`}>{dbUser.name}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLUMN 1 & 2: LEAGUES */}
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-3xl font-black italic uppercase text-white border-b-4 border-[#ffd60a] pb-2 inline-block">
              {isGlobalAdmin ? 'All Active Leagues' : 'My Leagues'}
            </h2>
            
            {displayLeagues.length === 0 ? (
              <div className="bg-[#001d3d] border-4 border-dashed border-[#669bbc] p-12 text-center opacity-70">
                <p className="text-xl font-black uppercase italic text-white mb-2">The Dugout is Empty</p>
                <p className="text-xs font-bold text-[#669bbc] uppercase tracking-widest">Create a new league to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayLeagues.map((m) => (
                  <div key={m.id} className="bg-white border-4 border-[#001d3d] p-6 hover:border-[#c1121f] transition-all group shadow-[8px_8px_0px_#ffd60a] flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-6">
                      <span className={`text-[9px] font-black px-3 py-1 uppercase tracking-widest ${m.roleLevel === 3 ? 'bg-[#c1121f] text-white' : 'bg-[#001d3d] text-white'}`}>
                        {m.roleLevel === 3 ? 'H.O.F Admin' : `Tier ${m.roleLevel} ${m.roleLevel === 2 ? 'Commissioner' : 'Scout'}`}
                      </span>
                      {m.roleLevel >= 2 && (
                        <Link href={`/admin/leagues/${m.leagueId}/settings`} className="text-[10px] font-black uppercase text-[#001d3d] hover:text-[#c1121f] transition-colors border-2 border-[#001d3d] px-3 py-1 shadow-sm hover:shadow-none italic">
                          ⚾ League Ops
                        </Link>
                      )}
                    </div>
                    <div>
                      <Link href={`/admin/leagues/${m.leagueId}`} className="block">
                        <h3 className="text-3xl font-black uppercase italic text-[#001d3d] flex items-center justify-between group-hover:text-[#c1121f] transition-colors tracking-tighter">
                          {m.league.name} <span className="text-[#001d3d] group-hover:text-[#c1121f] font-black text-xl">↗</span>
                        </h3>
                      </Link>
                      <p className="text-[10px] font-bold uppercase text-slate-500 mt-1">{m.league.location || 'Sandlot'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pendingMemberships.length > 0 && !isGlobalAdmin && (
              <div className="mt-8 p-6 bg-[#001d3d] border-4 border-[#c1121f]">
                <p className="text-[10px] font-black uppercase text-[#fdf0d5] tracking-widest mb-3">Warming Up (Pending Access)</p>
                <div className="space-y-2">
                  {pendingMemberships.map(m => (
                    <div key={m.id} className="bg-black/40 border border-[#c1121f] p-4 flex justify-between items-center">
                      <span className="font-bold text-white uppercase">{m.league.name}</span>
                      <span className="text-[9px] font-black text-[#ffd60a] uppercase tracking-widest animate-pulse">Awaiting the Call-up</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* COLUMN 3: SYSTEM ACTIONS */}
          <div className="space-y-6">
            <h2 className="text-3xl font-black italic uppercase text-white border-b-4 border-[#ffd60a] pb-2 inline-block">Lineup</h2>
            
            <ProButton 
              title="Create League" 
              desc="Draft a brand new organization" 
              href="/admin/leagues/new" 
              highlight 
            />
            
            {!isGlobalAdmin && <ProButton title="Join League" desc="Request a roster spot" href="/admin/join" />}
            
            {/* UPDATED: Visible to Global Admins AND Commissioners (Tier 2+) */}
            {isCommissioner && (
              <div className="mt-8 pt-8 border-t-4 border-[#c1121f] space-y-4">
                <p className="text-[10px] font-black uppercase text-[#ffd60a] tracking-widest">Administrative Tools</p>
                
                <ProButton 
                  title="Master Roster" 
                  desc="Edit names & manage players" 
                  href="/admin/players" 
                />

            
                
                {/* Global Admin exclusive buttons */}
                {isGlobalAdmin && (
                  <ProButton 
                    title="User Management" 
                    desc="View all system officials" 
                    href="/admin/users" 
                  />
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function ProButton({ title, desc, href, highlight = false }: { title: string, desc: string, href: string, highlight?: boolean }) {
  return (
    <Link href={href} className={`group block relative overflow-hidden border-4 transition-all duration-200 ${
      highlight ? 'bg-[#c1121f] border-[#fdf0d5] hover:bg-white shadow-[8px_8px_0px_#000]' : 'bg-[#001d3d] border-[#669bbc] hover:border-white shadow-[8px_8px_0px_#000]'
    } p-6`}>
      <div className="flex justify-between items-center relative z-10">
        <div>
          <h4 className={`font-black italic uppercase tracking-tighter text-xl transition-colors ${highlight ? 'text-white group-hover:text-[#c1121f]' : 'text-white'}`}>{title}</h4>
          <p className={`text-[9px] font-bold uppercase tracking-[0.15em] mt-1 transition-colors ${highlight ? 'text-red-200 group-hover:text-slate-500' : 'text-[#669bbc] group-hover:text-white'}`}>{desc}</p>
        </div>
        <span className={`text-2xl font-black transition-all ${highlight ? 'text-white group-hover:text-[#c1121f] group-hover:translate-x-1' : 'text-[#669bbc] group-hover:text-white group-hover:translate-x-1'}`}>↗</span>
      </div>
    </Link>
  );
}