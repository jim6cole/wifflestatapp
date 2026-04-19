'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterUser() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm) {
      return setError("Access Keys do not match.");
    }
    
    if (formData.password.length < 6) {
      return setError("Access Key must be at least 6 characters.");
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password }),
      });

      if (res.ok) {
        router.push('/login?registered=true');
      } else {
        const data = await res.json();
        setError(data.error || "Registration failed.");
      }
    } catch (err) {
      setError("Network Error. Could not connect to mainframe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#001d3d] flex items-center justify-center p-6 border-[16px] border-[#c1121f]">
      <div className="w-full max-w-xl bg-white border-8 border-[#001d3d] p-8 md:p-12 shadow-[16px_16px_0px_#ffd60a]">
        
        {/* HEADER */}
        <div className="mb-10 border-b-8 border-[#c1121f] pb-6">
          <Link href="/login" className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#c1121f] transition-colors mb-4 block">
            ← Abort & Return to Login
          </Link>
          <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-[#001d3d] leading-none">
            Create Wiff+ Account
          </h1>
          <p className="text-[#c1121f] font-bold uppercase text-xs tracking-[0.4em] mt-2 italic">
            Commissioner Level 2 Profile Creation
          </p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="bg-[#c1121f] text-white p-4 text-center border-4 border-[#001d3d] shadow-[4px_4px_0px_#000] animate-pulse mb-8">
            <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="flex flex-col">
            <label className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest mb-2">Commissioner Name</label>
            <input 
              type="text" 
              placeholder="e.g. Jum"
              required
              className="w-full bg-[#fdf0d5] border-4 border-[#001d3d] p-5 text-[#001d3d] font-black outline-none focus:border-[#ffd60a] transition-colors placeholder:text-black/20"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest mb-2">Clearance Email</label>
            <input 
              type="email" 
              placeholder="COMMISSIONER@AWAA.COM"
              required
              className="w-full bg-[#fdf0d5] border-4 border-[#001d3d] p-5 text-[#001d3d] font-black outline-none focus:border-[#ffd60a] transition-colors placeholder:text-black/20"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          
          <div className="flex flex-col">
            <label className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest mb-2">Access Key (Password)</label>
            <input 
              type="password" 
              placeholder="ENTER SECURE KEY"
              required
              className="w-full bg-[#fdf0d5] border-4 border-[#001d3d] p-5 text-[#001d3d] font-black outline-none focus:border-[#ffd60a] transition-colors placeholder:text-black/20"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest mb-2">Confirm Access Key</label>
            <input 
              type="password" 
              placeholder="RE-ENTER SECURE KEY"
              required
              className="w-full bg-[#fdf0d5] border-4 border-[#001d3d] p-5 text-[#001d3d] font-black outline-none focus:border-[#ffd60a] transition-colors placeholder:text-black/20"
              onChange={(e) => setFormData({...formData, confirm: e.target.value})}
            />
          </div>

          {/* SPAM WARNING BANNER */}
          <div className="bg-[#fdf0d5] border-4 border-[#c1121f] p-4 text-center shadow-[4px_4px_0px_#000] mt-6">
            <p className="text-[#c1121f] text-[10px] font-black uppercase tracking-widest">
              ⚠️ CRITICAL: Verification links frequently route to SPAM/JUNK folders. Check there if you don't see it immediately.
            </p>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-[#c1121f] py-6 text-white font-black uppercase italic tracking-[0.2em] text-xl border-4 border-[#001d3d] hover:bg-[#ffd60a] hover:text-[#001d3d] transition-colors shadow-[8px_8px_0px_#000] disabled:opacity-50 mt-4"
          >
            {loading ? 'Processing...' : 'Initialize Profile'}
          </button>
        </form>

      </div>
    </div>
  );
}