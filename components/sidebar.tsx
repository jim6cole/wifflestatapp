'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { name: 'Home', path: '/', icon: '🏠' },
    { name: 'Leagues', path: '/leagues', icon: '🌎' },
    { name: 'Stats', path: '/stats', icon: '📊' },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      {/* PANCAKE BUTTON */}
      <button 
        onClick={toggleMenu}
        className="fixed top-8 left-8 z-[200] w-12 h-12 flex flex-col items-center justify-center gap-1.5 bg-slate-900 border border-white/10 rounded-xl hover:border-white/30 transition-all shadow-2xl"
      >
        <div className={`h-[2px] w-6 bg-white transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-[8px]' : ''}`} />
        <div className={`h-[2px] w-6 bg-white transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`} />
        <div className={`h-[2px] w-6 bg-white transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-[8px]' : ''}`} />
      </button>

      {/* OVERLAY */}
      <div className={`fixed inset-0 bg-slate-950/98 backdrop-blur-xl z-[150] transition-all duration-500 ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
        <div className="flex flex-col h-full p-12 md:p-24 justify-center max-w-4xl mx-auto">
          <p className="text-[10px] font-black uppercase text-slate-600 tracking-[0.5em] mb-12 border-b border-white/5 pb-4">wRC Directory</p>
          <nav className="flex flex-col space-y-6">
            {menuItems.map((item) => (
              <Link 
                key={item.path}
                href={item.path}
                onClick={() => setIsOpen(false)}
                className={`text-5xl md:text-7xl font-black italic uppercase tracking-tighter transition-all ${pathname === item.path ? 'text-red-600' : 'text-white hover:text-red-500'}`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}