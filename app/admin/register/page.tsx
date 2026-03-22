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
        router.push('/admin/login?registered=true');
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
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md relative z-10">
        <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl backdrop-blur-md shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h1 className="text-4xl font-black italic uppercase text-center text-white">Establish Org</h1>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center mt-2">Commissioner Level 2 Profile Creation</p>
            </div>
            
            {error && <p className="text-red-500 text-[10px] font-black uppercase text-center tracking-widest bg-red-900/20 py-2 border border-red-900/50">{error}</p>}
            
            <input 
              type="text" 
              placeholder="Commissioner Name (e.g. Jum)"
              required
              className="w-full bg-black border border-white/5 p-4 rounded-xl text-white outline-none focus:border-red-600 transition-colors font-bold"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />

            <input 
              type="email" 
              placeholder="Email Address"
              required
              className="w-full bg-black border border-white/5 p-4 rounded-xl text-white outline-none focus:border-red-600 transition-colors"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            
            <input 
              type="password" 
              placeholder="Access Key (Password)"
              required
              className="w-full bg-black border border-white/5 p-4 rounded-xl text-white outline-none focus:border-red-600 transition-colors"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />

            <input 
              type="password" 
              placeholder="Confirm Access Key"
              required
              className="w-full bg-black border border-white/5 p-4 rounded-xl text-white outline-none focus:border-red-600 transition-colors"
              onChange={(e) => setFormData({...formData, confirm: e.target.value})}
            />

            <button type="submit" disabled={loading} className="w-full bg-white py-5 rounded-xl text-black font-black uppercase italic tracking-widest hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50">
              {loading ? 'Processing...' : 'Initialize Commissioner Profile'}
            </button>
          </form>

          <div className="mt-8 border-t border-white/10 pt-6 text-center">
            <Link href="/admin/login" className="text-[10px] font-black uppercase text-slate-500 tracking-widest hover:text-white transition-colors">
              ← Cancel & Return to Login
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}