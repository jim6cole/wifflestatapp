'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ContactSupportPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit request.');
      }

      setStatus('success');
      setFormData({ name: '', email: '', message: '' }); // clear form
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#001d3d] text-white p-6 md:p-16 border-[12px] md:border-[16px] border-[#c1121f]">
      <div className="max-w-3xl mx-auto">
        
        <header className="mb-12 border-b-4 border-[#669bbc] pb-6">
          <Link href="/support" className="text-[10px] font-black uppercase text-[#ffd60a] tracking-widest hover:text-white transition-colors mb-4 block">
            ← Support Hub
          </Link>
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter drop-shadow-[4px_4px_0px_#c1121f] leading-none">
            Submit Ticket
          </h1>
          <p className="text-[#669bbc] font-bold uppercase text-[10px] tracking-[0.4em] mt-4 italic">
            Direct Line to WIFF+ Administration
          </p>
        </header>

        {status === 'success' ? (
          <div className="bg-[#22c55e] border-4 border-white p-12 text-center shadow-[12px_12px_0px_#c1121f]">
            <h2 className="text-4xl font-black italic uppercase mb-4">Transmission Received</h2>
            <p className="font-bold text-sm uppercase tracking-widest mb-8">Our ground crew will be in touch shortly.</p>
            <button onClick={() => setStatus('idle')} className="bg-black text-white px-8 py-3 font-black uppercase italic tracking-widest border-2 border-white hover:bg-white hover:text-black transition-colors">
              Send Another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white text-[#001d3d] border-4 border-[#001d3d] p-6 md:p-10 shadow-[12px_12px_0px_#c1121f] space-y-6">
            
            {status === 'error' && (
              <div className="bg-red-100 border-2 border-[#c1121f] p-4 text-[#c1121f] font-bold text-xs uppercase tracking-wider text-center">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-[#669bbc] mb-2 tracking-widest">Full Name</label>
                <input 
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#fdf0d5] border-4 border-[#001d3d] p-4 font-black text-lg outline-none focus:border-[#c1121f]"
                  placeholder="e.g. Ken Griffey Jr."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-[#669bbc] mb-2 tracking-widest">Email Address</label>
                <input 
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-[#fdf0d5] border-4 border-[#001d3d] p-4 font-black text-lg outline-none focus:border-[#c1121f]"
                  placeholder="e.g. ken@wiffplus.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-[#669bbc] mb-2 tracking-widest">How can we help?</label>
              <textarea 
                required
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="w-full bg-[#fdf0d5] border-4 border-[#001d3d] p-4 font-bold text-base outline-none focus:border-[#c1121f] resize-none"
                placeholder="Describe the issue, bug, or feature request..."
              />
            </div>

            <button 
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-[#c1121f] text-white border-4 border-[#001d3d] py-5 text-2xl font-black italic uppercase tracking-widest hover:bg-[#001d3d] hover:text-[#ffd60a] transition-all shadow-[6px_6px_0px_#001d3d] disabled:opacity-50 mt-4"
            >
              {status === 'loading' ? 'Transmitting...' : 'Dispatch Request'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}