'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function Sidebar() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  
  const user = session?.user as any;
  const isLoading = status === "loading";

  // If session is still loading, we can show a neutral state
  if (isLoading) return null; 

  return (
    <>
      {/* MOBILE HAMBURGER TOGGLE */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-6 right-6 z-[100] bg-[#c1121f] p-3 border-2 border-[#fdf0d5] shadow-xl"
      >
        <div className="w-6 h-1 bg-white mb-1"></div>
        <div className="w-6 h-1 bg-white mb-1"></div>
        <div className="w-6 h-1 bg-white"></div>
      </button>

      {/* SIDEBAR PANEL */}
      <div className={`fixed top-0 right-0 h-full bg-[#001d3d] border-l-[12px] border-[#c1121f] z-[90] transition-transform duration-300 w-80 p-8 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <nav className="flex flex-col h-full">
          <div className="mb-12">
            <h2 className="text-4xl font-black italic uppercase text-white tracking-tighter">Menu</h2>
            <div className="h-1 w-12 bg-[#c1121f] mt-2"></div>
          </div>

          <div className="space-y-6 flex-1">
            <Link href="/admin/dashboard" onClick={() => setIsOpen(false)} className="block text-xl font-black uppercase italic hover:text-[#c1121f]">Dashboard</Link>
            
            {/* LEVEL 1, 2, 3: Show active leagues */}
            <Link href="/admin/global" onClick={() => setIsOpen(false)} className="block text-xl font-black uppercase italic hover:text-[#c1121f]">Affiliate Map</Link>
            
            {/* LEVEL 2 & 3: Can see live games */}
            {user?.role >= 2 && (
               <Link href="/admin/games/active" onClick={() => setIsOpen(false)} className="block text-xl font-black uppercase italic hover:text-[#c1121f]">Live Action</Link>
            )}

            {/* LEVEL 3 ONLY: Show System Root / Global Admin controls */}
            {user?.role === 3 && (
              <div className="pt-6 border-t border-white/10">
                <p className="text-[10px] font-black uppercase text-[#669bbc] mb-4 tracking-widest">Global Ops</p>
                <Link href="/admin/users" onClick={() => setIsOpen(false)} className="block text-xl font-black uppercase italic text-[#c1121f] hover:text-white">User Registry</Link>
                <Link href="/admin/staff" onClick={() => setIsOpen(false)} className="block text-xl font-black uppercase italic text-[#c1121f] hover:text-white mt-4">Staff Approvals</Link>
              </div>
            )}
          </div>

          <button 
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="mt-auto bg-white/5 border border-white/10 p-4 text-[10px] font-black uppercase tracking-widest hover:bg-[#c1121f] hover:text-white transition-all"
          >
            Terminal Logout
          </button>
        </nav>
      </div>

      {/* OVERLAY */}
      {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"></div>}
    </>
  );
}