'use client';
import Link from 'next/link';

export default function WiffPlusLauncher() {
  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] flex flex-col items-center justify-center p-6 border-[12px] border-[#c1121f] relative overflow-hidden">
      
      {/* BACKGROUND ACCENT */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#c1121f] rounded-full blur-[120px] opacity-20"></div>

      {/* TOP NAV */}
      <div className="absolute top-8 right-8 z-20">
        <Link 
          href="/login" 
          className="text-[10px] font-black uppercase tracking-[0.3em] border-2 border-[#ffd60a] px-8 py-3 rounded-full text-[#ffd60a] hover:bg-[#ffd60a] hover:text-[#001d3d] transition-all shadow-[4px_4px_0px_#c1121f]"
        >
          Staff Portal
        </Link>
      </div>

      <div className="max-w-4xl w-full relative z-10">
        {/* HERO SECTION */}
        <header className="text-center mb-16">
          <h1 className="text-[120px] md:text-[180px] font-black italic uppercase tracking-tighter text-white leading-none drop-shadow-[8px_8px_0px_#c1121f]">
            WIFF<span className="text-[#ffd60a]">+</span>
          </h1>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="h-[4px] w-12 bg-[#ffd60a]"></div>
            <p className="text-[#fdf0d5] font-black uppercase text-sm tracking-[0.6em] italic">
              The Premier Wiffleball Platform
            </p>
            <div className="h-[4px] w-12 bg-[#ffd60a]"></div>
          </div>
        </header>

        {/* MAIN NAVIGATION BUTTONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <LauncherButton 
            title="Select League" 
            desc="Browse Active Organizations" 
            href="/leagues" 
          />
          <LauncherButton 
            title="Global Stats" 
            desc="Sortable Leaders & Records" 
            href="/stats/select" 
            highlight
          />
        </div>

        {/* SYSTEM FOOTER */}
        <footer className="mt-16 text-center border-t-2 border-white/10 pt-8">
          <p className="text-[10px] font-black uppercase text-[#669bbc] tracking-[0.4em]">
            Powered by WIFF+ // 1997 Edition
          </p>
        </footer>
      </div>
    </div>
  );
}

function LauncherButton({ title, desc, href, highlight = false }: any) {
  return (
    <Link href={href} className="group">
      <div className={`h-full p-10 border-4 transition-all duration-300 transform group-hover:-translate-y-2 flex flex-col justify-between ${
        highlight 
          ? 'bg-[#c1121f] border-[#fdf0d5] shadow-[12px_12px_0px_#ffd60a]' 
          : 'bg-[#001d3d] border-[#669bbc] shadow-[12px_12px_0px_#c1121f] group-hover:border-white'
      }`}>
        <div className="flex justify-between items-start mb-8">
          <span className="text-2xl group-hover:translate-x-2 transition-transform font-black text-white">↗</span>
        </div>
        <div>
          <h2 className="text-4xl font-black italic uppercase text-white leading-tight">
            {title}
          </h2>
          <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 ${highlight ? 'text-[#fdf0d5]' : 'text-[#669bbc] group-hover:text-white'}`}>
            {desc}
          </p>
        </div>
      </div>
    </Link>
  );
}