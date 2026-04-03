'use client';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] flex flex-col items-center justify-center p-6 border-[12px] sm:border-[16px] border-[#c1121f] relative overflow-hidden">
      
      {/* BACKGROUND ACCENTS */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#c1121f] rounded-full blur-[120px] opacity-20"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-[#ffd60a] rounded-full blur-[120px] opacity-10"></div>

      {/* TOP NAV */}
      <div className="absolute top-8 left-8 sm:left-12 z-20">
        <Link 
          href="/" 
          className="text-[10px] font-black uppercase tracking-[0.3em] text-[#669bbc] hover:text-white transition-colors"
        >
          ← Back to Home
        </Link>
      </div>

      <div className="max-w-4xl w-full relative z-10 mt-12 bg-[#001d3d] border-4 border-[#669bbc] p-8 md:p-16 shadow-[12px_12px_0px_#c1121f]">
        
        <header className="text-center mb-12">
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-white leading-none drop-shadow-[4px_4px_0px_#c1121f]">
            About <span className="text-[#ffd60a]">WIFF+</span>
          </h1>
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="h-[4px] w-12 bg-[#ffd60a]"></div>
            <p className="text-[#fdf0d5] font-black uppercase text-[10px] sm:text-xs tracking-[0.4em] italic">
              The Mission
            </p>
            <div className="h-[4px] w-12 bg-[#ffd60a]"></div>
          </div>
        </header>

        <div className="space-y-8 text-lg md:text-2xl font-bold leading-relaxed text-slate-300">
          <p>
            WIFF+ was created by <span className="text-white font-black italic uppercase tracking-widest">Jimmy Cole</span> as a passion project to give back to the wiffleball community for everything the sport and its players have given him.
          </p>
          
          <div className="p-6 md:p-8 bg-[#c1121f] text-white border-4 border-[#fdf0d5] shadow-[6px_6px_0px_#ffd60a] my-8 transform -rotate-1">
            <p className="text-xl md:text-3xl font-black italic uppercase leading-tight">
              For too long, wiffleball leagues have had to rely on generic baseball apps, messy spreadsheets, or expensive enterprise software that didn't quite fit the unique needs of our sport.
            </p>
          </div>

          <p>
            Jimmy set out to build a <span className="text-[#ffd60a] font-black uppercase tracking-wider">true, free, open-source</span> wiffleball league management app made specifically for wiffleball, its players, and its managers.
          </p>
          
          <p>
            Whether you are running a massive multi-division league in the mountains, a competitive fast-pitch circuit, or a weekend tournament in your backyard, WIFF+ provides the exact tools you need to track every pitch, manage every roster, and immortalize every stat—all completely free.
          </p>
        </div>

        <div className="mt-16 text-center border-t-4 border-white/10 pt-8 flex flex-col items-center gap-4">
          <span className="text-4xl">⚾</span>
          <p className="text-[10px] font-black uppercase text-[#669bbc] tracking-[0.4em]">
            Built by a player. For the players.
          </p>
        </div>

      </div>
    </div>
  );
}