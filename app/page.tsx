'use client';

import Link from 'next/link';
import { useState } from 'react';

/**
 * WiffPlus Launcher Page
 * Includes "Bizarro Mode" Easter Egg triggered by clicking the logo 8 times.
 */
export default function WiffPlusLauncher() {
  const [clickCount, setClickCount] = useState(0);
  const [isBizarro, setIsBizarro] = useState(false);

  const handleLogoClick = () => {
    const nextCount = clickCount + 1;
    if (nextCount === 8) {
      setIsBizarro(!isBizarro);
      setClickCount(0);
    } else {
      setClickCount(nextCount);
    }
  };

  return (
    <main className={`min-h-screen flex flex-col items-center justify-center p-6 border-[12px] transition-colors duration-700 relative overflow-hidden ${
      isBizarro 
        ? "bg-white text-black border-[#ffd60a]" 
        : "bg-[#001d3d] text-[#fdf0d5] border-[#c1121f]"
    }`}>
      
      {/* BIZARRO VISUALS (COW SPOTS) */}
      {isBizarro && (
        <div className="absolute inset-0 pointer-events-none opacity-80">
          <div className="absolute top-[10%] left-[10%] w-32 h-32 bg-black rounded-full blur-md" />
          <div className="absolute bottom-[20%] right-[15%] w-48 h-40 bg-black rounded-[40%] blur-sm" />
          <div className="absolute top-[-5%] left-[50%] w-64 h-32 bg-black rounded-full blur-md" />
          <div className="absolute top-[40%] right-[5%] w-24 h-24 bg-black rounded-full blur-lg" />
        </div>
      )}

      <div className="max-w-4xl w-full relative z-10">
        <header className="text-center mb-16">
          {/* LOGO WITH HIDDEN CLICKER */}
          <h1 
            onClick={handleLogoClick}
            className={`text-[110px] md:text-[180px] font-black italic uppercase tracking-tighter leading-none select-none transition-all duration-300 active:scale-[0.99] cursor-default ${
              isBizarro 
                ? "text-black drop-shadow-[8px_8px_0px_#ffd60a]" 
                : "text-white drop-shadow-[8px_8px_0px_#c1121f]"
            }`}
          >
            {isBizarro ? "MOO" : "WIFF"}<span className="text-[#ffd60a]">+</span>
          </h1>
          
          <p className={`font-black uppercase text-sm tracking-[0.6em] italic mt-2 ${
            isBizarro ? "text-black" : "text-[#fdf0d5]"
          }`}>
            {isBizarro ? "The Premier Dairy Platform" : "The Premier Wiffleball Platform"}
          </p>
        </header>

        {/* NAVIGATION GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <LauncherButton 
            title={isBizarro ? "Select Herd" : "Select League"} 
            href="/leagues" 
            isBizarro={isBizarro}
          />
          <LauncherButton 
            title={isBizarro ? "Global Cheese" : "Global Stats"} 
            href="/stats/select" 
            highlight 
            isBizarro={isBizarro}
          />
        </div>
        
        {/* FOOTER ACCENT */}
        <footer className="mt-16 text-center">
          <p className={`text-[10px] uppercase tracking-widest font-bold opacity-50 ${
            isBizarro ? "text-black" : "text-[#669bbc]"
          }`}>
            {isBizarro ? "EST. 1848 - MADISON, WI" : ""}
          </p>
        </footer>
      </div>
    </main>
  );
}

/**
 * Reusable Launcher Button Component
 */
function LauncherButton({ title, href, highlight = false, isBizarro = false }: any) {
  const styles = {
    normal: {
      base: "bg-[#001d3d] border-[#669bbc] shadow-[12px_12px_0px_#c1121f]",
      text: "text-white"
    },
    highlight: {
      base: "bg-[#c1121f] border-[#fdf0d5] shadow-[12px_12px_0px_#ffd60a]",
      text: "text-white"
    },
    bizarroNormal: {
      base: "bg-white border-black shadow-[12px_12px_0px_#ffd60a]",
      text: "text-black"
    },
    bizarroHighlight: {
      base: "bg-[#ffd60a] border-black shadow-[12px_12px_0px_#000000]",
      text: "text-black"
    }
  };

  // Determine which style set to use
  let currentStyle = isBizarro 
    ? (highlight ? styles.bizarroHighlight : styles.bizarroNormal)
    : (highlight ? styles.highlight : styles.normal);

  return (
    <Link href={href} className="group">
      <div className={`h-full p-10 border-4 transition-all duration-300 transform group-hover:-translate-y-2 flex flex-col justify-between ${currentStyle.base}`}>
        <h2 className={`text-4xl font-black italic uppercase leading-tight ${currentStyle.text}`}>
          {title}
        </h2>
        <div className={`mt-4 w-12 h-1 bg-current opacity-30 transition-all duration-300 group-hover:w-full`} />
      </div>
    </Link>
  );
}