'use client';
import Link from 'next/link';

export default function PublicSupportHub() {
  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] flex flex-col items-center justify-center p-6 border-[12px] sm:border-[16px] border-[#c1121f] relative overflow-hidden">
      
      {/* BACKGROUND ACCENT */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#c1121f] rounded-full blur-[120px] opacity-20"></div>

      {/* TOP NAV */}
      <div className="absolute top-8 left-8 sm:left-12 z-20">
        <Link 
          href="/" 
          className="text-[10px] font-black uppercase tracking-[0.3em] text-[#669bbc] hover:text-white transition-colors"
        >
          ← Back to Home
        </Link>
      </div>

      <div className="max-w-4xl w-full relative z-10 mt-12">
        <header className="text-center mb-16">
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-white leading-none drop-shadow-[6px_6px_0px_#c1121f]">
            Help <span className="text-[#ffd60a]">&</span> Support
          </h1>
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="h-[4px] w-12 bg-[#ffd60a]"></div>
            <p className="text-[#fdf0d5] font-black uppercase text-[10px] sm:text-xs tracking-[0.4em] italic">
              Player & Fan Assistance
            </p>
            <div className="h-[4px] w-12 bg-[#ffd60a]"></div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link href="/support/faq" className="group">
            <div className="h-full p-8 md:p-10 border-4 bg-[#001d3d] border-[#669bbc] shadow-[8px_8px_0px_#c1121f] group-hover:border-white transition-all duration-300 transform group-hover:-translate-y-2 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-8">
                <span className="text-4xl">📖</span>
                <span className="text-2xl group-hover:translate-x-2 transition-transform font-black text-white">↗</span>
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-black italic uppercase text-white leading-tight">
                  Knowledge Base
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-2 text-[#669bbc] group-hover:text-white">
                  Frequently Asked Questions
                </p>
              </div>
            </div>
          </Link>

          <Link href="/support/contact" className="group">
            <div className="h-full p-8 md:p-10 border-4 bg-[#c1121f] border-[#fdf0d5] shadow-[8px_8px_0px_#ffd60a] transition-all duration-300 transform group-hover:-translate-y-2 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-8">
                <span className="text-4xl">✉️</span>
                <span className="text-2xl group-hover:translate-x-2 transition-transform font-black text-white">↗</span>
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-black italic uppercase text-white leading-tight">
                  Submit Ticket
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-2 text-[#fdf0d5]">
                  Contact the Ground Crew
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}