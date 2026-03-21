'use client';
import Link from 'next/link';

export default function WRCStorefront() {
  return (
    <div className="p-8 md:p-16 bg-slate-950 min-h-screen text-white font-sans relative">
      
      {/* TOP RIGHT ADMIN LOGIN */}
      <div className="absolute top-8 right-8">
        <Link 
          href="/admin/login" 
          className="text-[10px] font-black uppercase tracking-widest border border-white/10 px-6 py-2 rounded-full hover:bg-white hover:text-black transition-all"
        >
          Admin Login
        </Link>
      </div>

      <div className="max-w-4xl mx-auto mt-20">
        {/* APP LOGO/NAME */}
        <header className="text-center mb-24">
          <h1 className="text-8xl font-black italic uppercase tracking-tighter text-white">
            wRC
          </h1>
          <p className="text-red-600 font-bold uppercase text-xs tracking-[.5em] mt-2">
            Wiffle Reporting & Control
          </p>
        </header>

        {/* LEAGUE LIST SECTION */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Active Leagues</h2>
            <span className="text-[10px] font-bold text-slate-700">Total: 1</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* LEAGUE CARD */}
            <Link href="/leagues/awaa" className="group bg-white/5 border border-white/5 p-8 rounded-3xl flex items-center justify-between hover:bg-white hover:text-black transition-all duration-300">
              <div>
                <h3 className="text-3xl font-black italic uppercase tracking-tight">AWAA</h3>
                <p className="text-[10px] font-bold uppercase text-slate-500 group-hover:text-slate-800 transition-colors">Adirondack Wiffleball Association</p>
              </div>
              <div className="text-2xl group-hover:translate-x-2 transition-transform">→</div>
            </Link>

            {/* Placeholder for more leagues */}
            <div className="border-2 border-dashed border-white/5 p-8 rounded-3xl flex items-center justify-center">
              <p className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Register New League +</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}