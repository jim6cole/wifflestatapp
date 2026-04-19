'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage("If an account exists with that email, a reset link has been dispatched. Please check your inbox and your SPAM/JUNK folder.");
      } else {
        setStatus('error');
        setMessage(data.error || "Failed to process request. Please try again.");
      }
    } catch (error) {
      setStatus('error');
      setMessage("A network error occurred. Please check your connection.");
    }
  };

  return (
    <div className="min-h-screen bg-[#001d3d] flex items-center justify-center p-6 border-[16px] border-[#c1121f]">
      <div className="w-full max-w-xl bg-white border-8 border-[#001d3d] p-8 md:p-12 shadow-[16px_16px_0px_#ffd60a]">
        
        <div className="mb-10 border-b-8 border-[#c1121f] pb-6">
          <Link href="/login" className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#c1121f] transition-colors mb-4 block">
            ← Abort & Return
          </Link>
          <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-[#001d3d] leading-none">
            Reset Key
          </h1>
          <p className="text-[#c1121f] font-bold uppercase text-xs tracking-[0.4em] mt-2 italic">
            AWAA Vault // Identity Recovery
          </p>
        </div>

        {status === 'success' ? (
          <div className="bg-[#fdf0d5] border-4 border-green-600 p-8 text-center shadow-[8px_8px_0px_#000]">
            <p className="text-green-700 text-2xl font-black italic uppercase tracking-widest mb-2">Protocol Initiated</p>
            <p className="text-[#001d3d] text-sm font-bold">{message}</p>
            <Link href="/login" className="mt-8 inline-block w-full bg-[#001d3d] text-white p-4 font-black uppercase tracking-widest hover:bg-[#ffd60a] hover:text-[#001d3d] transition-colors border-2 border-[#001d3d]">
              Return to Login Terminal
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {status === 'error' && (
              <div className="bg-[#c1121f] text-white p-4 text-center border-4 border-[#001d3d] shadow-[4px_4px_0px_#000] animate-pulse">
                <p className="text-[10px] font-black uppercase tracking-widest">{message}</p>
              </div>
            )}
            
            <p className="text-sm font-bold text-[#001d3d] mb-6">
              Enter your clearance email below. If recognized, the system will securely route a temporary access reset link to your inbox.
            </p>
            <div className="bg-[#fdf0d5] border-4 border-[#c1121f] p-4 text-center shadow-[4px_4px_0px_#000] mb-6">
              <p className="text-[#c1121f] text-[10px] font-black uppercase tracking-widest">
                ⚠️ NOTE: Password reset emails frequently route to SPAM/JUNK folders. Check there if you don't see it within 2 minutes.
              </p>
            </div>

            <div className="flex flex-col">
              <label className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest mb-2">Clearance Email</label>
              <input 
                type="email" 
                placeholder="COMMISSIONER@AWAA.COM"
                className="w-full bg-[#fdf0d5] border-4 border-[#001d3d] p-5 text-[#001d3d] font-black outline-none focus:border-[#ffd60a] transition-colors placeholder:text-black/20"
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={status === 'loading'}
              />
            </div>

            <button 
              type="submit" 
              disabled={status === 'loading'}
              className="w-full bg-[#c1121f] py-6 text-white font-black uppercase italic tracking-[0.2em] text-xl border-4 border-[#001d3d] hover:bg-[#ffd60a] hover:text-[#001d3d] transition-colors shadow-[8px_8px_0px_#000] disabled:opacity-50 mt-4"
            >
              {status === 'loading' ? 'Transmitting...' : 'Request Reset Link'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}