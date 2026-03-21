'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateLeague() {
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
        // Redirect back to dashboard on success
        router.push('/admin/dashboard');
      } else {
        console.error("Failed to create league");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 md:p-16 font-sans">
      <div className="max-w-2xl mx-auto">
        
        {/* BREADCRUMB */}
        <Link href="/admin/dashboard" className="text-[10px] font-black uppercase tracking-[.3em] text-slate-500 hover:text-red-500 transition-colors">
          ← Back to Dashboard
        </Link>

        <header className="mt-8 mb-12">
          <h1 className="text-6xl font-black italic uppercase tracking-tighter">
            Register League
          </h1>
          <p className="text-red-600 font-bold uppercase text-[10px] tracking-[.4em] mt-2">
            Establish New Organization Identity
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8 bg-slate-900/50 border border-white/5 p-8 md:p-12 rounded-3xl backdrop-blur-sm">
          
          {/* SECTION: IDENTITY */}
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">
                League Slug (Short Name)
              </label>
              <input 
                required
                placeholder="e.g., AWAA"
                className="w-full bg-black border border-white/10 p-4 rounded-xl focus:border-red-600 outline-none font-black italic uppercase text-xl transition-all"
                onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
              />
              <p className="text-[9px] text-slate-600 mt-2 ml-1 uppercase">Used for URLs and scoreboards (max 6 chars recommended)</p>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">
                Official Organization Name
              </label>
              <input 
                required
                placeholder="e.g., Adirondack Wiffleball Association"
                className="w-full bg-black border border-white/10 p-4 rounded-xl focus:border-red-600 outline-none font-bold text-lg transition-all"
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              />
            </div>
          </div>

          <div className="h-px bg-white/5 w-full"></div>

          {/* SECTION: DETAILS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">
                Primary Location
              </label>
              <input 
                placeholder="City, State"
                className="w-full bg-black border border-white/10 p-4 rounded-xl focus:border-red-600 outline-none font-bold transition-all"
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1 tracking-widest">
                Regional Description
              </label>
              <input 
                placeholder="e.g., Adirondack Mountains"
                className="w-full bg-black border border-white/10 p-4 rounded-xl focus:border-red-600 outline-none font-bold transition-all"
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 py-6 rounded-2xl font-black uppercase italic tracking-widest text-lg hover:bg-white hover:text-black transition-all shadow-2xl shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Processing...' : 'Authorize & Initialize League →'}
          </button>
        </form>

        <footer className="mt-12 text-center">
          <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">
            Registration creates a Level 2 Admin profile for the current user.
          </p>
        </footer>
      </div>
    </div>
  );
}