// app/reset-password/page.tsx
'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (!token) {
    return (
      <div className="min-h-screen bg-[#001d3d] flex items-center justify-center p-6 border-[16px] border-[#c1121f]">
        <div className="bg-[#c1121f] text-white p-8 border-4 border-[#001d3d] shadow-[8px_8px_0px_#000] text-center">
          <h1 className="text-3xl font-black italic uppercase tracking-widest mb-4">Invalid Link</h1>
          <p className="font-bold mb-6">No security token detected in the URL.</p>
          <Link href="/login" className="bg-[#001d3d] px-6 py-3 font-black uppercase text-[10px] tracking-widest hover:text-[#ffd60a] transition-colors">Return to Login</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage("Passwords do not match.");
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage("Your access key has been successfully updated.");
      } else {
        setStatus('error');
        setMessage(data.error || "Failed to reset password. The link may have expired.");
      }
    } catch (error) {
      setStatus('error');
      setMessage("A network error occurred.");
    }
  };

  return (
    <div className="min-h-screen bg-[#001d3d] flex items-center justify-center p-6 border-[16px] border-[#c1121f]">
      <div className="w-full max-w-xl bg-white border-8 border-[#001d3d] p-8 md:p-12 shadow-[16px_16px_0px_#ffd60a]">
        <div className="mb-10 border-b-8 border-[#c1121f] pb-6">
          <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-[#001d3d] leading-none">
            New Key
          </h1>
          <p className="text-[#c1121f] font-bold uppercase text-xs tracking-[0.4em] mt-2 italic">AWAA Vault // Identity Recovery</p>
        </div>

        {status === 'success' ? (
          <div className="bg-[#fdf0d5] border-4 border-green-600 p-8 text-center shadow-[8px_8px_0px_#000]">
            <p className="text-green-700 text-2xl font-black italic uppercase tracking-widest mb-2">Access Restored</p>
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
            <div className="flex flex-col">
              <label className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest mb-2">New Access Key</label>
              <input type="password" placeholder="••••••••" className="w-full bg-[#fdf0d5] border-4 border-[#001d3d] p-5 text-[#001d3d] font-black outline-none focus:border-[#ffd60a] transition-colors" onChange={(e) => setPassword(e.target.value)} required minLength={6} disabled={status === 'loading'} />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest mb-2">Confirm New Key</label>
              <input type="password" placeholder="••••••••" className="w-full bg-[#fdf0d5] border-4 border-[#001d3d] p-5 text-[#001d3d] font-black outline-none focus:border-[#ffd60a] transition-colors" onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} disabled={status === 'loading'} />
            </div>
            <button type="submit" disabled={status === 'loading'} className="w-full bg-[#c1121f] py-6 text-white font-black uppercase italic tracking-[0.2em] text-xl border-4 border-[#001d3d] hover:bg-[#ffd60a] hover:text-[#001d3d] transition-colors shadow-[8px_8px_0px_#000] disabled:opacity-50 mt-4">
              {status === 'loading' ? 'Encrypting...' : 'Save New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#001d3d] flex items-center justify-center border-[16px] border-[#c1121f]"><div className="text-[#ffd60a] font-black italic text-4xl uppercase tracking-tighter animate-pulse">Scanning Token...</div></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}