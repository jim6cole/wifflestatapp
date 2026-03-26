'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    })
    .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen bg-[#001d3d] flex items-center justify-center p-6 border-[16px] border-[#c1121f]">
      <div className="w-full max-w-xl bg-white border-8 border-[#001d3d] p-8 md:p-12 shadow-[16px_16px_0px_#ffd60a] text-center">
        
        {status === 'verifying' && (
          <div className="animate-pulse">
            <h1 className="text-4xl font-black italic uppercase text-[#001d3d] mb-4">Authenticating...</h1>
            <p className="text-[#669bbc] font-bold uppercase tracking-widest text-xs">Verifying cryptographic signature</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-[#fdf0d5] border-4 border-green-600 p-8 shadow-[8px_8px_0px_#000]">
            <h1 className="text-3xl font-black italic uppercase text-green-700 mb-2 tracking-tighter">Clearance Granted</h1>
            <p className="text-[#001d3d] font-bold mb-8">Your identity has been verified. You may now access the vault.</p>
            <Link href="/login" className="inline-block w-full bg-[#001d3d] text-white p-4 font-black uppercase tracking-widest hover:bg-[#ffd60a] hover:text-[#001d3d] transition-colors border-2 border-[#001d3d]">
              Initialize Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-[#c1121f] border-4 border-[#001d3d] p-8 shadow-[8px_8px_0px_#000] text-white">
            <h1 className="text-3xl font-black italic uppercase mb-2 tracking-tighter">Verification Failed</h1>
            <p className="font-bold mb-8 opacity-80">The security token is invalid, missing, or has already been used.</p>
            <Link href="/login" className="inline-block w-full bg-[#001d3d] text-white p-4 font-black uppercase tracking-widest hover:text-[#ffd60a] transition-colors border-2 border-[#001d3d]">
              Return to Login
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#001d3d] animate-pulse"></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}