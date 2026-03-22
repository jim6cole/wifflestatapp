'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function JoinLeague() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated';

  const [leagues, setLeagues] = useState<any[]>([]);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirm: '', leagueId: '', requestedRole: '1' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch the available leagues for the dropdown
  useEffect(() => {
    fetch('/api/public/leagues')
      .then(res => res.json())
      .then(data => setLeagues(data))
      .catch(() => console.error("Could not load leagues"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.leagueId) return setError("You must select a league to join.");
    
    // If NOT logged in, validate passwords
    if (!isLoggedIn) {
      if (formData.password !== formData.confirm) return setError("Access Keys do not match.");
      if (formData.password.length < 6) return setError("Access Key must be at least 6 characters.");
    }

    setLoading(true);

    try {
      // Determine which API route to hit based on auth status
      const endpoint = isLoggedIn ? '/api/admin/leagues/join' : '/api/admin/register/join';
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        if (isLoggedIn) {
          router.push('/admin/dashboard');
          router.refresh();
        } else {
          router.push('/admin/login?joined=true');
        }
      } else {
        const data = await res.json();
        setError(data.error || "Request failed.");
      }
    } catch (err) {
      setError("Network Error. Could not connect to mainframe.");
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') return <div className="min-h-screen bg-black flex items-center justify-center text-white font-black italic">LOADING...</div>;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md relative z-10">
        <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl backdrop-blur-md shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h1 className="text-4xl font-black italic uppercase text-center text-white">Request Access</h1>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center mt-2">
                {isLoggedIn ? `Authenticated as ${session?.user?.name}` : 'Request Staff Authorization'}
              </p>
            </div>
            
            {error && <p className="text-red-500 text-[10px] font-black uppercase text-center tracking-widest bg-red-900/20 py-2 border border-red-900/50">{error}</p>}
            
            {/* ONLY SHOW IF NOT LOGGED IN */}
            {!isLoggedIn && (
              <>
                <input 
                  type="text" placeholder="Your Name (e.g. Jum)" required
                  className="w-full bg-black border border-white/5 p-4 rounded-xl text-white outline-none focus:border-red-600 transition-colors font-bold"
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
                <input 
                  type="email" placeholder="Email Address" required
                  className="w-full bg-black border border-white/5 p-4 rounded-xl text-white outline-none focus:border-red-600 transition-colors"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </>
            )}

            {/* LEAGUE SELECTOR */}
            <select 
              required
              className="w-full bg-black border border-white/5 p-4 rounded-xl text-white outline-none focus:border-red-600 transition-colors cursor-pointer"
              onChange={(e) => setFormData({...formData, leagueId: e.target.value})}
              value={formData.leagueId}
            >
              <option value="" disabled>Select a League...</option>
              {leagues.map(l => (
                <option key={l.id} value={l.id}>{l.name} {l.location ? `(${l.location})` : ''}</option>
              ))}
            </select>

            {/* ROLE REQUEST SELECTOR */}
            <select 
              required
              className="w-full bg-black border border-white/5 p-4 rounded-xl text-white outline-none focus:border-red-600 transition-colors cursor-pointer"
              onChange={(e) => setFormData({...formData, requestedRole: e.target.value})}
              value={formData.requestedRole}
            >
              <option value="1">Level 1: Scorekeeper (Live Scorer Only)</option>
              <option value="2">Level 2: Assistant Commish (Full Admin)</option>
            </select>
            
            {/* ONLY SHOW IF NOT LOGGED IN */}
            {!isLoggedIn && (
              <>
                <input 
                  type="password" placeholder="Access Key (Password)" required
                  className="w-full bg-black border border-white/5 p-4 rounded-xl text-white outline-none focus:border-red-600 transition-colors"
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <input 
                  type="password" placeholder="Confirm Access Key" required
                  className="w-full bg-black border border-white/5 p-4 rounded-xl text-white outline-none focus:border-red-600 transition-colors"
                  onChange={(e) => setFormData({...formData, confirm: e.target.value})}
                />
              </>
            )}

            <button type="submit" disabled={loading} className="w-full bg-red-600 py-5 rounded-xl text-white font-black uppercase italic tracking-widest hover:bg-white hover:text-red-600 transition-colors disabled:opacity-50">
              {loading ? 'Processing...' : 'Submit Clearance Request'}
            </button>
          </form>

          <div className="mt-8 border-t border-white/10 pt-6 text-center">
            <Link href={isLoggedIn ? "/admin/dashboard" : "/admin/login"} className="text-[10px] font-black uppercase text-slate-500 tracking-widest hover:text-white transition-colors">
              ← Cancel & Return
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}