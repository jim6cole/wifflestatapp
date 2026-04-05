'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function Sidebar() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  
  const user = session?.user as any;
  const isLoading = status === "loading";

  // If session is still loading, we show a neutral state
  if (isLoading) return null; 

  // Multi-League Permission Checks
  const isGlobalAdmin = user?.isGlobalAdmin;

  return (
    <>
      {/* MOBILE HAMBURGER TOGGLE */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-6 right-6 z-[100] bg-[#001d3d] p-3 border-4 border-[#ffd60a] shadow-[6px_6px_0px_#c1121f] hover:bg-[#c1121f] hover:border-[#fdf0d5] transition-all group"
      >
        <div className="w-6 h-1 bg-white mb-1 group-hover:bg-[#001d3d] transition-colors"></div>
        <div className="w-6 h-1 bg-white mb-1 group-hover:bg-[#001d3d] transition-colors"></div>
        <div className="w-6 h-1 bg-white group-hover:bg-[#001d3d] transition-colors"></div>
      </button>

      {/* OVERLAY */}
      {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[80]"></div>}

      {/* SIDEBAR PANEL */}
      <div className={`fixed top-0 right-0 h-full bg-[#fdf0d5] border-l-[16px] border-[#001d3d] z-[90] transition-transform duration-300 w-80 p-8 shadow-[-12px_0px_0px_#c1121f] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <nav className="flex flex-col h-full">
          
          <div className="mb-8">
            <h2 className="text-4xl font-black italic uppercase text-[#001d3d] tracking-tighter drop-shadow-[2px_2px_0px_#ffd60a]">WIFF+</h2>
            <div className="h-2 w-16 bg-[#c1121f] mt-2"></div>
            <p className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest mt-2">Operations Menu</p>
          </div>

          <div className="space-y-6 flex-1">
            <Link 
              href="/" 
              onClick={() => setIsOpen(false)} 
              className="block text-2xl font-black uppercase italic text-[#001d3d] hover:text-[#c1121f] transition-colors border-b-4 border-transparent hover:border-[#ffd60a] w-fit pb-1"
            >
              Home
            </Link>

            <Link 
              href="/admin/dashboard" 
              onClick={() => setIsOpen(false)} 
              className="block text-2xl font-black uppercase italic text-[#001d3d] hover:text-[#c1121f] transition-colors border-b-4 border-transparent hover:border-[#ffd60a] w-fit pb-1"
            >
              Dashboard
            </Link>

            {/* UPDATED: Unfiltered Support Link */}
            <Link 
              href="/support" 
              onClick={() => setIsOpen(false)} 
              className="block text-2xl font-black uppercase italic text-[#001d3d] hover:text-[#c1121f] transition-colors border-b-4 border-transparent hover:border-[#ffd60a] w-fit pb-1"
            >
              Support
            </Link>

            <Link 
              href="/about" 
              onClick={() => setIsOpen(false)} 
              className="block text-2xl font-black uppercase italic text-[#001d3d] hover:text-[#c1121f] transition-colors border-b-4 border-transparent hover:border-[#ffd60a] w-fit pb-1"
            >
              About
            </Link>

            {/* GLOBAL ADMIN ONLY */}
            {isGlobalAdmin && (
              <div className="pt-8 mt-8 border-t-4 border-[#001d3d]/10">
                <p className="text-[10px] font-black uppercase text-[#c1121f] mb-4 tracking-widest">Root Clearance</p>
                <Link 
                  href="/admin/users" 
                  onClick={() => setIsOpen(false)} 
                  className="block text-xl font-black uppercase italic text-[#001d3d] hover:text-[#c1121f] transition-colors"
                >
                  User Registry
                </Link>
                <Link 
                  href="/admin/staff" 
                  onClick={() => setIsOpen(false)} 
                  className="block text-xl font-black uppercase italic text-[#001d3d] hover:text-[#c1121f] transition-colors mt-4"
                >
                  Staff Approvals
                </Link>
              </div>
            )}
          </div>

          {/* Conditional Login/Logout */}
          {session ? (
            <button 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="mt-auto bg-[#c1121f] border-4 border-[#001d3d] p-4 text-[12px] text-white font-black italic uppercase tracking-widest hover:bg-[#001d3d] hover:text-[#ffd60a] transition-all shadow-[6px_6px_0px_#ffd60a] active:translate-y-1 active:shadow-none"
            >
              System Logout
            </button>
          ) : (
            <Link 
              href="/login"
              onClick={() => setIsOpen(false)}
              className="mt-auto text-center block bg-[#001d3d] border-4 border-[#c1121f] p-4 text-[12px] text-[#ffd60a] font-black italic uppercase tracking-widest hover:bg-[#c1121f] hover:text-white transition-all shadow-[6px_6px_0px_#c1121f] active:translate-y-1 active:shadow-none"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </>
  );
}