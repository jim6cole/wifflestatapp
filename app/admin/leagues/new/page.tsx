'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewLeaguePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    shortName: '', 
    name: '',      
    location: '',
    region: '',    
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation check
    if (!formData.shortName || !formData.name || !formData.location || !formData.region) {
      setError("Roster incomplete! All fields are required to take the field.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        // Refresh and head back to the dugout
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "The Umpire called it: Registration failed.");
      }
    } catch (err) {
      setError("Connection error. The Clubhouse uplink is down.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#001d3d] p-8 md:p-20">
      <div className="max-w-2xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="mb-12 border-b-8 border-[#ffd60a] pb-6">
          <Link href="/admin/dashboard" className="text-[#669bbc] font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">
            ← Back to Dugout
          </Link>
          <h1 className="text-6xl font-black italic uppercase text-white tracking-tighter mt-4 leading-none">
            Create League
          </h1>
          <p className="text-[#fdf0d5] font-bold uppercase text-xs tracking-[0.3em] mt-2 italic">
            Wiff+ // New Organization
          </p>
        </div>

        {/* --- FORM CARD --- */}
        <div className="bg-white border-8 border-[#001d3d] p-8 md:p-12 shadow-[16px_16px_0px_#c1121f]">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {error && (
              <div className="bg-[#c1121f] text-white p-4 font-black uppercase text-xs tracking-widest text-center border-4 border-[#001d3d]">
                {error}
              </div>
            )}

            {/* Short Name (Abbreviation) */}
            <div className="flex flex-col">
              <label className="text-[11px] font-black uppercase text-[#001d3d] tracking-widest mb-2 italic text-[#c1121f]">
                Short Name / Abbreviation *
              </label>
              <input 
                type="text" 
                placeholder="e.g. MAW"
                required
                maxLength={6}
                value={formData.shortName}
                className="w-full bg-[#fdf0d5] border-4 border-[#001d3d] p-5 text-[#001d3d] font-black outline-none focus:border-[#c1121f] transition-colors uppercase placeholder:opacity-30"
                onChange={(e) => setFormData({...formData, shortName: e.target.value})}
              />
              <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">This will be used for stat tables and filters (Max 6 chars).</p>
            </div>

            {/* Full League Name */}
            <div className="flex flex-col">
              <label className="text-[11px] font-black uppercase text-[#001d3d] tracking-widest mb-2 italic">Full League Name *</label>
              <input 
                type="text" 
                placeholder="e.g. Mid Atlantic Wiffle"
                required
                value={formData.name}
                className="w-full bg-[#fdf0d5] border-4 border-[#001d3d] p-5 text-[#001d3d] font-black outline-none focus:border-[#c1121f] transition-colors placeholder:opacity-30"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            {/* Location */}
            <div className="flex flex-col">
              <label className="text-[11px] font-black uppercase text-[#001d3d] tracking-widest mb-2 italic">Base Location *</label>
              <input 
                type="text" 
                placeholder="e.g. Queensbury, NY"
                required
                value={formData.location}
                className="w-full bg-[#fdf0d5] border-4 border-[#001d3d] p-5 text-[#001d3d] font-black outline-none focus:border-[#c1121f] transition-colors placeholder:opacity-30"
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>

            {/* Region Selection */}
            <div className="flex flex-col">
              <label className="text-[11px] font-black uppercase text-[#001d3d] tracking-widest mb-2 italic">Region *</label>
              <div className="relative">
                <select 
                  required
                  className="w-full bg-[#fdf0d5] border-4 border-[#001d3d] p-5 text-[#001d3d] font-black outline-none focus:border-[#c1121f] transition-colors appearance-none cursor-pointer"
                  onChange={(e) => setFormData({...formData, region: e.target.value})}
                  value={formData.region}
                >
                  <option value="" disabled>Select Region...</option>
                  <option value="East">East</option>
                  <option value="Midwest">Midwest</option>
                  <option value="South">South</option>
                  <option value="West">West</option>
                  <option value="International">International</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-[#001d3d]">
                  <span className="text-xl">▼</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#c1121f] py-6 text-white font-black uppercase italic tracking-[0.2em] text-2xl border-4 border-[#001d3d] hover:bg-[#ffd60a] hover:text-[#001d3d] transition-colors shadow-[8px_8px_0px_#000] disabled:opacity-50 mt-4"
            >
              {loading ? 'Registering Team...' : 'Finalize League'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}