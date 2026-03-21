'use client';
import Link from 'next/link';

// This will eventually fetch from Prisma
const leagues = [
  {
    id: 'awaa',
    name: 'AWAA',
    fullName: 'Adirondack Wiffleball Association',
    location: 'Adirondack Mountains, NY',
    status: 'Active',
    color: 'border-red-600'
  },
];

export default function LeaguesDirectory() {
  return (
    <div className="p-8 md:p-16 bg-slate-950 min-h-screen text-white font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-16">
          <p className="text-red-600 font-black uppercase text-[10px] tracking-[.5em] mb-2">
            Global Directory
          </p>
          <h1 className="text-7xl font-black italic uppercase tracking-tighter">
            Leagues
          </h1>
          <div className="h-1 w-24 bg-red-600 mt-4"></div>
        </header>

        {/* SEARCH / FILTER BAR */}
        <div className="mb-12 flex flex-col md:flex-row gap-4 items-center justify-between border-b border-white/5 pb-8">
          <div className="bg-slate-900 border border-white/10 px-6 py-3 rounded-full w-full md:w-96 text-sm text-slate-500 font-bold italic">
            Search by region or name...
          </div>
          <div className="flex gap-4">
            <span className="text-[10px] font-black uppercase text-slate-700">Filter:</span>
            <span className="text-[10px] font-black uppercase text-red-500 cursor-pointer">All</span>
          </div>
        </div>

        {/* LEAGUE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {leagues.map((league) => (
            <Link 
              key={league.id} 
              href={`/leagues/${league.id}`}
              className={`group bg-slate-900/50 border-l-4 ${league.color} p-8 rounded-r-3xl hover:bg-white transition-all duration-500 shadow-xl`}
            >
              <div className="flex justify-between items-start mb-6">
                <span className="bg-red-600/10 text-red-500 text-[9px] font-black px-3 py-1 rounded-full uppercase group-hover:bg-red-600 group-hover:text-white transition-colors">
                  {league.status}
                </span>
                <span className="text-slate-800 font-black italic text-sm group-hover:text-slate-400 leading-none">
                  01
                </span>
              </div>
              
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white group-hover:text-black transition-colors leading-none">
                {league.name}
              </h2>
              <p className="text-[10px] font-bold uppercase text-slate-500 mt-2 tracking-widest group-hover:text-slate-700 transition-colors">
                {league.fullName}
              </p>
              
              <div className="mt-8 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase text-slate-700 group-hover:text-slate-400">
                  📍 {league.location}
                </p>
                <span className="text-xl group-hover:translate-x-2 transition-transform text-red-600">→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* EMPTY STATE - Shown only if no leagues exist */}
        {leagues.length === 0 && (
          <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No leagues found in the directory.</p>
          </div>
        )}
      </div>
    </div>
  );
}