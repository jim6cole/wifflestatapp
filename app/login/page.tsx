'use client';
import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 1. Dynamic Redirect: Grabs where they came from, defaults to /admin
  const callbackUrl = searchParams.get('callbackUrl') || '/admin/dashboard';
  const isRegistered = searchParams.get('registered') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid Clearance Credentials or Account Not Yet Approved.");
      setIsLoading(false);
    } else {
      // 2. Uses the callbackUrl here instead of the hardcoded dashboard route
      router.push(callbackUrl);
      router.refresh(); 
    }
  };

  return (
    <div className="min-h-screen bg-[#001d3d] flex items-center justify-center p-6 border-[16px] border-[#c1121f]">
      <div className="w-full max-w-xl bg-white border-8 border-[#001d3d] p-8 md:p-12 shadow-[16px_16px_0px_#ffd60a]">
        
        <div className="mb-10 border-b-8 border-[#c1121f] pb-6">
          <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-[#001d3d] leading-none">
            Terminal Login
          </h1>
          <p className="text-[#c1121f] font-bold uppercase text-xs tracking-[0.4em] mt-2 italic">
            AWAA Vault // Authorized Access Only
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {isRegistered && (
            <div className="bg-[#fdf0d5] border-4 border-green-600 p-4 text-center shadow-[4px_4px_0px_#000]">
              <p className="text-green-700 text-[10px] font-black uppercase tracking-widest">Profile Created</p>
              <p className="text-[#001d3d] text-xs font-bold mt-1">Please log in with your new credentials.</p>
            </div>
          )}

          {error && (
            <div className="bg-[#c1121f] text-white p-4 text-center border-4 border-[#001d3d] shadow-[4px_4px_0px_#000] animate-pulse">
              <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
            </div>
          )}
          
          <div className="flex flex-col">
            <label className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest mb-2">Email</label>
            <input 
              type="email" 
              placeholder="COMMISSIONER@AWAA.COM"
              className="w-full bg-[#fdf0d5] border-4 border-[#001d3d] p-5 text-[#001d3d] font-black outline-none focus:border-[#ffd60a] transition-colors placeholder:text-black/20"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="flex flex-col">
            <label className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest mb-2">Access Key</label>
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full bg-[#fdf0d5] border-4 border-[#001d3d] p-5 text-[#001d3d] font-black outline-none focus:border-[#ffd60a] transition-colors placeholder:text-black/20"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[#c1121f] py-6 text-white font-black uppercase italic tracking-[0.2em] text-xl border-4 border-[#001d3d] hover:bg-[#ffd60a] hover:text-[#001d3d] transition-colors shadow-[8px_8px_0px_#000] disabled:opacity-50 mt-4"
          >
            {isLoading ? 'Verifying...' : 'Initialize Authorization'}
          </button>
        </form>

        <div className="mt-10 border-t-4 border-[#fdf0d5] pt-8 text-center bg-black/5 p-4 border-2 border-dashed border-[#001d3d]">
          <p className="text-xs font-bold text-[#001d3d] mb-2 uppercase tracking-widest">Want to establish a new Wiffleball league?</p>
          <Link href="/admin/register" className="inline-block bg-[#001d3d] text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-[#ffd60a] hover:text-[#001d3d] transition-colors border-2 border-[#001d3d]">
            Create Commissioner Profile →
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function AdminLogin() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#001d3d] flex items-center justify-center border-[16px] border-[#c1121f]">
        <div className="text-[#ffd60a] font-black italic text-4xl uppercase tracking-tighter animate-pulse">Establishing Connection...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}