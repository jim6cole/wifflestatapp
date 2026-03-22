'use client';
import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get('registered') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      // Still keeping this broad so if a Level 1 tries to log in before approval, it catches them
      setError("Invalid Clearance Credentials or Account Not Yet Approved.");
    } else {
      router.push('/admin/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md relative z-10">
        <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl backdrop-blur-md shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h1 className="text-4xl font-black italic uppercase text-center text-white mb-8">Terminal Login</h1>
            
            {isRegistered && (
              <div className="bg-green-900/40 border border-green-500/50 p-4 rounded-xl text-center">
                <p className="text-green-400 text-[10px] font-black uppercase tracking-widest">Profile Created</p>
                <p className="text-white/70 text-xs font-bold mt-1">Please log in with your new credentials.</p>
              </div>
            )}

            {error && <p className="text-red-500 text-[10px] font-black uppercase text-center tracking-widest">{error}</p>}
            
            <input 
              type="email" 
              placeholder="Email"
              className="w-full bg-black border border-white/5 p-4 rounded-xl text-white outline-none focus:border-red-600 transition-colors"
              onChange={(e) => setEmail(e.target.value)}
            />
            
            <input 
              type="password" 
              placeholder="Access Key"
              className="w-full bg-black border border-white/5 p-4 rounded-xl text-white outline-none focus:border-red-600 transition-colors"
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit" className="w-full bg-red-600 py-5 rounded-xl text-white font-black uppercase italic tracking-widest hover:bg-white hover:text-red-600 transition-colors">
              Initialize Authorization
            </button>
          </form>

          <div className="mt-8 border-t border-white/10 pt-6 text-center">
            <p className="text-xs font-bold text-slate-500 mb-2">Want to establish a new Wiffleball league?</p>
            <Link href="/admin/register" className="text-[10px] font-black uppercase text-white tracking-widest hover:text-red-500 transition-colors">
              Create Commissioner Profile →
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function AdminLogin() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white font-black italic uppercase tracking-widest text-2xl">LOADING...</div>}>
      <LoginForm />
    </Suspense>
  );
}