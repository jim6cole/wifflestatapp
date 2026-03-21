'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterLeaguePro() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    fullName: '',
    location: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/admin/dashboard');
      } else {
        alert("Authorization Failed: Could not initialize league.");
      }
    } catch (error) {
      console.error("Registry Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] font-sans p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-3xl mx-auto">
        
        {/* TOP NAVIGATION */}
        <Link href="/admin/dashboard" className="inline-block mb-8 px-4 py-2 border border-[#669bbc] text-[10px] font-black uppercase tracking-widest hover:bg-[#c1121f] hover:text-white transition-all">
          ← Return to Dashboard
        </Link>

        <header className="mb-12 border-b-4 border-[#669bbc] pb-6">
          <h1 className="text-7xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f]">
            League Registry
          </h1>
          <p className="text-[#669bbc] font-bold uppercase text-xs tracking-[0.4em] mt-2">
            Establishment of New Affiliate Identity
          </p>
        </header>

        <form onSubmit={handleSubmit} className="bg-[#003566] border-2 border-[#669bbc] p-10 shadow-2xl relative overflow-hidden">
          {/* DECORATIVE STAR */}
          <div className="absolute top-[-20px] right-[-20px] text-white opacity-10 text-9xl font-black italic select-none">★</div>

          <div className="space-y-8 relative z-10">
            {/* LEAGUE NAME / SLUG */}
            <div>
              <label className="block text-[10px] font-black uppercase text-[#669bbc] mb-2 tracking-[0.2em]">
                League Short Name (The Slug)
              </label>
              <input 
                required
                placeholder="AWAA"
                className="w-full bg-[#001d3d] border-2 border-[#fdf0d5] p-5 text-4xl font-black italic uppercase text-white outline-none focus:border-[#c1121f] transition-all placeholder:opacity-20"
                onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
              />
              <p className="text-[9px] font-bold text-[#669bbc] mt-2 uppercase">Recommended: 3-5 Characters for scoreboards</p>
            </div>

            {/* FULL ORG NAME */}
            <div>
              <label className="block text-[10px] font-black uppercase text-[#669bbc] mb-2 tracking-[0.2em]">
                Full Organization Title
              </label>
              <input 
                required
                placeholder="Adirondack Wiffleball Association"
                className="w-full bg-[#001d3d] border-2 border-[#fdf0d5] p-4 text-xl font-bold text-white outline-none focus:border-[#c1121f] transition-all placeholder:opacity-20"
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
              <div>
                <label className="block text-[10px] font-black uppercase text-[#669bbc] mb-2 tracking-[0.2em]">
                  Primary Location
                </label>
                <input 
                  placeholder="New York, NY"
                  className="w-full bg-[#001d3d] border border-white/20 p-4 font-bold text-white outline-none focus:border-[#c1121f]"
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-[#669bbc] mb-2 tracking-[0.2em]">
                  Region/Description
                </label>
                <input 
                  placeholder="Adirondack Mountains"
                  className="w-full bg-[#001d3d] border border-white/20 p-4 font-bold text-white outline-none focus:border-[#c1121f]"
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#c1121f] border-2 border-[#fdf0d5] py-6 text-2xl font-black italic uppercase tracking-widest text-white hover:bg-white hover:text-[#c1121f] transition-all shadow-xl disabled:opacity-50"
            >
              {isSubmitting ? 'INITIALIZING...' : 'Establish League Identity ★'}
            </button>
          </div>
        </form>

        <footer className="mt-12 text-center">
          <p className="text-[10px] font-bold text-[#669bbc] uppercase tracking-[0.3em]">
            wRC // Official Sanctioning Terminal
          </p>
        </footer>
      </div>
    </div>
  );
}