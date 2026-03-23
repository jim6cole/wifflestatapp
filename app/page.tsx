'use client';
import Link from 'next/link';

export default function WRCLauncher() {
  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] flex flex-col items-center justify-center p-6 border-[12px] border-[#c1121f] relative overflow-hidden">
      
      {/* BACKGROUND ACCENT */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#c1121f] rounded-full blur-[120px] opacity-20"></div>

      {/* TOP NAV */}
      <div className="absolute top-8 right-8 z-20">
        <Link 
          href="/admin/login" 
          className="text-[10px] font-black uppercase tracking-[0.3em] border-2 border-[#669bbc] px-8 py-3 rounded-full text-[#669bbc] hover:bg-[#669bbc] hover:text-white transition-all shadow-xl"
        >
          Terminal Login
        </Link>
      </div>

      <div className="max-w-4xl w-full relative z-10">
        {/* HERO SECTION */}
        <header className="text-center mb-16">
          <h1 className="text-[120px] md:text-[180px] font-black italic uppercase tracking-tighter text-white leading-none drop-shadow-[8px_8px_0px_#c1121f]">
            wRC
          </h1>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="h-[2px] w-12 bg-[#c1121f]"></div>
            <p className="text-[#669bbc] font-black uppercase text-sm tracking-[0.6em] italic">
              Wiffle Reporting & Control
            </p>
            <div className="h-[2px] w-12 bg-[#c1121f]"></div>
          </div>
        </header>

        {/* MAIN NAVIGATION BUTTONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <LauncherButton 
            title="Select League" 
            desc="Browse Active Organizations" 
            href="/leagues" 
            icon="⚾"
          />

          <LauncherButton 
            title="League Stats" 
            desc="Sortable Leaders & Records" 
            href="/stats/select" 
            highlight
            icon="📊"
          />

        </div>

        {/* SYSTEM FOOTER */}
        <footer className="mt-16 text-center border-t border-white/10 pt-8">
          <p className="text-[9px] font-black uppercase text-slate-500 tracking-[0.4em]">
            Global Affiliate Network // ADK Operations
          </p>
        </footer>
      </div>
    </div>
  );
}

function LauncherButton({ title, desc, href, icon, highlight = false }: any) {
  return (
    <Link href={href} className="group">
      <div className={`h-full p-10 border-4 transition-all duration-300 transform group-hover:-translate-y-2 flex flex-col justify-between ${
        highlight 
        ? 'bg-[#c1121f] border-[#fdf0d5] shadow-[12px_12px_0px_#003566]' 
        : 'bg-[#003566] border-[#669bbc] shadow-[12px_12px_0px_#c1121f]'
      }`}>
        <div className="flex justify-between items-start mb-8">
          <span className="text-5xl">{icon}</span>
          <span className="text-2xl group-hover:translate-x-2 transition-transform">→</span>
        </div>
        <div>
          <h2 className="text-4xl font-black italic uppercase text-white leading-tight">
            {title}
          </h2>
          <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 ${highlight ? 'text-red-100' : 'text-[#669bbc]'}`}>
            {desc}
          </p>
        </div>
      </div>
    </Link>
  );
}