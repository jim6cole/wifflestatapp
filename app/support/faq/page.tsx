import Link from 'next/link';

export default function FAQPage() {
  const faqs = [
    {
      q: "How do I join a WIFF+ affiliated league?",
      a: "Each affiliated league manages its own rosters and free agency. Browse the 'Leagues' tab from the home page to find an organization near you, and reach out to their commissioner directly via their league hub."
    },
    {
      q: "When are global stats updated?",
      a: "Global stats update in real-time as soon as a live game concludes or a commissioner manually logs a legacy box score. If you notice a discrepancy, please allow up to 24 hours for the caching to clear."
    },
    {
      q: "I found an error in a box score. How do I fix it?",
      a: "Only League Commissioners have the authorization to edit box scores or undo plays once a game has gone final. Please submit a request to your specific league manager."
    },
    {
      q: "Can I bring my own wiffleball league to WIFF+?",
      a: "Yes! We are currently accepting applications for new league chapters. Please use the 'Submit Ticket' portal to get in touch with our administration team regarding setup and onboarding."
    },
    {
      q: "What is a 'Speed Restricted' season?",
      a: "Certain leagues or tournaments enforce a radar-gun speed limit on pitches to encourage hitting and participation. Stats from these games are tagged as 'Medium Speed' to differentiate them from unrestricted 'Fast' leagues on the global leaderboards."
    }
  ];

  return (
    <div className="min-h-screen bg-[#fdf0d5] text-[#001d3d] p-6 md:p-16 border-[12px] md:border-[16px] border-[#001d3d]">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 border-b-8 border-[#c1121f] pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <Link href="/support" className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-[#c1121f] transition-colors mb-4 block">
              ← Support Hub
            </Link>
            <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-[#001d3d] drop-shadow-[4px_4px_0px_#ffd60a] leading-none">
              F.A.Q.
            </h1>
          </div>
          <div className="bg-[#001d3d] text-white px-6 py-3 font-black italic uppercase tracking-widest shadow-[4px_4px_0px_#c1121f]">
            Knowledge Base
          </div>
        </header>

        <div className="space-y-6">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white border-4 border-[#001d3d] p-6 md:p-8 shadow-[8px_8px_0px_#669bbc]">
              <h3 className="text-xl md:text-2xl font-black italic uppercase text-[#c1121f] mb-4 leading-tight">
                {faq.q}
              </h3>
              <p className="text-sm md:text-base font-bold text-slate-600 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center border-4 border-dashed border-[#001d3d]/20 p-8">
          <p className="text-sm font-black uppercase italic text-[#001d3d] mb-4">Still need help?</p>
          <Link href="/support/contact" className="inline-block bg-[#001d3d] text-white border-4 border-[#c1121f] px-8 py-4 font-black uppercase italic tracking-widest hover:bg-[#c1121f] hover:border-[#001d3d] transition-all shadow-[6px_6px_0px_#000]">
            Submit a Ticket
          </Link>
        </div>
      </div>
    </div>
  );
}