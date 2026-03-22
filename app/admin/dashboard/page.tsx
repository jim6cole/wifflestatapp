import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from 'next/link';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic'; // Ensures fresh data on every load

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/admin/login');

  // Fetch the user and all their connected leagues
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      memberships: {
        include: { league: true }
      }
    }
  });

  if (!dbUser) redirect('/admin/login');

  const isGlobalAdmin = dbUser.isGlobalAdmin;
  
  let displayLeagues: any[] = [];
  let pendingMemberships: any[] = [];

  // GOD MODE BYPASS: If Global Admin, fetch all leagues directly
  if (isGlobalAdmin) {
    const allLeagues = await prisma.league.findMany({
      orderBy: { name: 'asc' }
    });
    displayLeagues = allLeagues.map(l => ({
      id: `root-${l.id}`,
      leagueId: l.id,
      roleLevel: 3, // Custom level for Root
      league: l
    }));
  } else {
    // Normal SaaS User: Filter their specific memberships
    displayLeagues = dbUser.memberships.filter(m => m.isApproved);
    pendingMemberships = dbUser.memberships.filter(m => !m.isApproved);
  }

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] font-sans border-[12px] border-[#c1121f]">
      <div className="max-w-7xl mx-auto p-8 md:p-12">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-16 border-b-4 border-[#669bbc] pb-8">
          <div>
            <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f] leading-none">
              wRC
            </h1>
            <p className="text-[#fdf0d5] font-bold uppercase text-xs tracking-[0.3em] mt-2">
              Wiffle Reporting & Control // Operations
            </p>
          </div>
          
          <div className={`border-2 p-6 shadow-xl skew-x-[-10deg] mt-6 md:mt-0 ${isGlobalAdmin ? 'bg-black border-[#ffd60a]' : 'bg-[#c1121f] border-[#fdf0d5]'}`}>
            <p className={`text-[10px] font-black uppercase tracking-widest skew-x-[10deg] ${isGlobalAdmin ? 'text-[#ffd60a]' : 'text-[#fdf0d5]'}`}>
              {isGlobalAdmin ? 'Root Clearance' : 'Authorized Operator'}
            </p>
            <p className="text-2xl font-black uppercase italic skew-x-[10deg] text-white">{dbUser.name}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMN 1 & 2: LEAGUES */}
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-3xl font-black italic uppercase text-white border-b-2 border-[#c1121f] pb-2">
              {isGlobalAdmin ? 'All Organizations (Root)' : 'My Organizations'}
            </h2>
            
            {displayLeagues.length === 0 ? (
              <div className="bg-[#003566] border-2 border-dashed border-[#669bbc] p-12 text-center opacity-70">
                <p className="text-xl font-black uppercase italic text-white mb-2">No Organizations Found</p>
                <p className="text-xs font-bold text-[#669bbc] uppercase tracking-widest">Create a league to populate this terminal.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayLeagues.map((m) => (
                  <Link 
                    key={m.id} 
                    href={`/admin/leagues/${m.leagueId}`}
                    className="bg-[#003566] border-2 border-[#669bbc] p-6 hover:bg-[#c1121f] hover:border-[#fdf0d5] transition-all group shadow-lg"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-[9px] font-black px-2 py-1 uppercase tracking-widest ${m.roleLevel === 3 ? 'bg-[#ffd60a] text-black group-hover:bg-white' : 'bg-[#001d3d] text-[#669bbc] group-hover:text-white'}`}>
                        {m.roleLevel === 3 ? 'Root Admin' : `Lvl ${m.roleLevel} ${m.roleLevel === 2 ? 'Commish' : 'Staff'}`}
                      </span>
                      <span className="text-[#669bbc] group-hover:text-white font-black">↗</span>
                    </div>
                    <h3 className="text-2xl font-black uppercase italic text-white">{m.league.name}</h3>
                    <p className="text-[10px] font-bold uppercase text-[#669bbc] group-hover:text-red-200 mt-1">{m.league.location || 'Local'}</p>
                  </Link>
                ))}
              </div>
            )}

            {/* PENDING REQUESTS (Only for non-global admins) */}
            {pendingMemberships.length > 0 && !isGlobalAdmin && (
              <div className="mt-8">
                <p className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest mb-3">Pending Authorizations</p>
                <div className="space-y-2">
                  {pendingMemberships.map(m => (
                    <div key={m.id} className="bg-black/20 border border-[#669bbc]/30 p-4 flex justify-between items-center opacity-60">
                      <span className="font-bold text-white uppercase">{m.league.name}</span>
                      <span className="text-[9px] font-black text-[#ffd60a] uppercase tracking-widest animate-pulse">Awaiting Commish</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* COLUMN 3: SYSTEM ACTIONS */}
          <div className="space-y-6">
            <h2 className="text-3xl font-black italic uppercase text-white border-b-2 border-[#c1121f] pb-2">Portal</h2>
            
            <ProButton title="Establish League" desc="Create a new organization" href="/admin/leagues/new" highlight />
            
            {/* Standard users request access. Global Admins don't need to. */}
            {!isGlobalAdmin && (
              <ProButton title="Request Access" desc="Join an existing league" href="/admin/join" />
            )}
            
            {/* GLOBAL ADMIN TOOLS */}
            {isGlobalAdmin && (
              <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                <p className="text-[10px] font-black uppercase text-[#c1121f] tracking-widest">Root Clearance Tools</p>
                <ProButton title="Affiliate Map" desc="Global League Directory" href="/admin/global" />
                <ProButton title="User Registry" desc="Manage all system accounts" href="/admin/users" />
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
    <Link href={href} className={`group block relative overflow-hidden border-2 transition-all duration-200 ${
      highlight ? 'bg-[#c1121f] border-[#fdf0d5] hover:bg-white' : 'bg-[#003566] border-[#669bbc] hover:border-white'
    } p-6 shadow-xl`}>
      <div className="flex justify-between items-center relative z-10">
        <div>
          <h4 className={`font-black italic uppercase tracking-tighter text-xl transition-colors ${highlight ? 'text-white group-hover:text-[#c1121f]' : 'text-white'}`}>{title}</h4>
          <p className={`text-[9px] font-bold uppercase tracking-[0.15em] mt-1 transition-colors ${highlight ? 'text-red-200 group-hover:text-slate-500' : 'text-[#669bbc] group-hover:text-white'}`}>{desc}</p>
        </div>
        <span className={`text-xl transition-all ${highlight ? 'text-white group-hover:text-[#c1121f] group-hover:translate-x-1' : 'text-[#669bbc] group-hover:text-white group-hover:translate-x-1'}`}>→</span>
      </div>
    </Link>
  );
}