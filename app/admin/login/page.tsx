'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false, // Don't auto-redirect so we can handle errors
    });

    if (res?.error) {
      setError("Invalid Clearance Credentials");
    } else {
      router.push('/admin/dashboard');
      router.refresh(); // Forces the server to re-check the session
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md relative z-10">
        <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h1 className="text-4xl font-black italic uppercase text-center text-white mb-8">Terminal Login</h1>
            
            {error && <p className="text-red-500 text-[10px] font-black uppercase text-center">{error}</p>}

            <input 
              type="email" 
              placeholder="Email"
              className="w-full bg-black border border-white/5 p-4 rounded-xl text-white outline-none focus:border-red-600"
              onChange={(e) => setEmail(e.target.value)}
            />
            
            <input 
              type="password" 
              placeholder="Access Key"
              className="w-full bg-black border border-white/5 p-4 rounded-xl text-white outline-none focus:border-red-600"
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit" className="w-full bg-red-600 py-5 rounded-xl text-white font-black uppercase italic">
              Initialize Authorization →
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}