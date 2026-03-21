import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from 'next/link';
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function AdminDashboard() {
  // 1. SECURE THE ROUTE
  const session = await getServerSession(authOptions);

  // Level 3 = Global Admin (You), Level 2 = League Commish, Level 1 = Scorer
  if (!session || (session.user as any).role < 3) {
    redirect('/admin/login');
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] font-sans border-[12px] border-[#c1121f]">
      <div className="max-w-7xl mx-auto p-8 md:p-12">
        
        {/* ALL-STAR HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-16 border-b-4 border-[#669bbc] pb-8">
          <div className="relative">
            <h1 className="text-8xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f] leading-none">
              wRC
            </h1>
            <p className="text-[#fdf0d5] font-bold uppercase text-xs tracking-[0.3em] mt-2">
              Wiffle Recording & Creation // Global Root
            </p>
          </div>
          
          <div className="bg-[#c1121f] border-2 border-[#fdf0d5] p-6 shadow-xl skew-x-[-10deg]">
            <p className="text-[10px] font-black uppercase text-[#fdf0d5] tracking-widest skew-x-[10deg]">Global Operator</p>
            <p className="text-2xl font-black uppercase italic skew-x-[10deg]">{user?.name}</p>
          </div>
        </header>

        {/* HIGH-LEVEL SYSTEM STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <ProStatCard label="Live Action" value="0" sub="Active Games" />
          <ProStatCard label="Total Personnel" value="48" sub="Rostered Players" />
          <ProStatCard label="Affiliates" value="1" sub="Active Leagues" />
          <ProStatCard label="System Integrity" value="Lvl 3" sub="Full Authorization" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CATEGORY 1: LEAGUE ADMINISTRATION */}
          <div className="bg-[#003566] border-2 border-[#669bbc] p-8 rounded-tr-[50px] shadow-lg flex flex-col h-full">
            <h3 className="text-xl font-black uppercase italic text-[#fdf0d5] mb-6 border-b-2 border-[#c1121f] pb-2">
              League Admin
            </h3>
            <div className="space-y-4 flex-1">
              <ProButton 
                title="Select League" 
                desc="Dive into league-specific tools" 
                href="/admin/global" 
                highlight 
              />
              <ProButton 
                title="Register League" 
                desc="Establish a new organization" 
                href="/admin/leagues/new" 
              />
              <ProButton 
                title="View Live Action" 
                desc="Monitor all active scorekeepers" 
                href="/admin/games/active" 
              />
            </div>
          </div>

          {/* CATEGORY 2: GLOBAL OPERATIONS */}
          <div className="bg-[#003566] border-2 border-[#669bbc] p-8 rounded-tr-[50px] shadow-lg flex flex-col h-full">
            <h3 className="text-xl font-black uppercase italic text-[#fdf0d5] mb-6 border-b-2 border-[#c1121f] pb-2">
              Global Control
            </h3>
            <div className="space-y-4 flex-1">
              <ProButton 
                title="Staff Approvals" 
                desc="Authorize Level 1 & 2 access" 
                href="/admin/staff" 
              />
              <ProButton 
                title="User Logs" 
                desc="Security levels & session history" 
                href="/admin/users" 
              />
            </div>
          </div>

          {/* CATEGORY 3: EDIT ADMIN */}
          <div className="bg-[#003566] border-2 border-[#669bbc] p-8 rounded-tr-[50px] shadow-lg flex flex-col h-full">
            <h3 className="text-xl font-black uppercase italic text-[#fdf0d5] mb-6 border-b-2 border-[#c1121f] pb-2">
              Edit Admin
            </h3>
            <div className="space-y-4 flex-1">
              <ProButton 
                title="Edit Box Scores" 
                desc="Manual correction terminal" 
                href="/admin/stats/audit" 
              />
              <ProButton 
                title="Edit All Players" 
                desc="Manage global player registry" 
                href="/admin/players" 
              />
              <ProButton 
                title="Edit All Teams" 
                desc="Manage global team registry" 
                href="/admin/teams" 
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// --- ALL-STAR UI COMPONENTS ---

function ProStatCard({ label, value, sub }: { label: string, value: string, sub: string }) {
  return (
    <div className="bg-gradient-to-br from-[#fdf0d5] to-[#c1121f] p-[2px] shadow-lg">
      <div className="bg-[#001d3d] p-6 text-center border border-white/10">
        <p className="text-[10px] font-black uppercase text-[#669bbc] mb-1 tracking-widest">{label}</p>
        <p className="text-5xl font-black italic uppercase text-white leading-none mb-1">{value}</p>
        <p className="text-[9px] font-bold uppercase text-[#c1121f] tracking-tighter">{sub}</p>
      </div>
    </div>
  );
}

function ProButton({ title, desc, href, highlight = false }: { title: string, desc: string, href: string, highlight?: boolean }) {
  return (
    <Link href={href} className={`group block relative overflow-hidden border transition-all duration-200 ${
      highlight 
        ? 'bg-[#c1121f] border-[#fdf0d5] hover:bg-white' 
        : 'bg-white/5 border-white/10 hover:bg-black/40 hover:border-[#fdf0d5]'
    } p-5 shadow-inner`}>
      <div className="flex justify-between items-center relative z-10">
        <div>
          <h4 className={`font-black italic uppercase tracking-tighter text-xl transition-colors ${
            highlight ? 'text-white group-hover:text-[#c1121f]' : 'text-white'
          }`}>
            {title}
          </h4>
          <p className={`text-[9px] font-bold uppercase tracking-[0.15em] mt-1 transition-colors ${
            highlight ? 'text-red-200 group-hover:text-slate-500' : 'text-[#669bbc]'
          }`}>
            {desc}
          </p>
        </div>
        <span className={`text-xl transition-all ${
          highlight ? 'text-white group-hover:text-[#c1121f] group-hover:translate-x-1' : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-1'
        }`}>
          ★
        </span>
      </div>
    </Link>
  );
}