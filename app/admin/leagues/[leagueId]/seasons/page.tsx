'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function LeagueSeasonManager() {
  const params = useParams();
  const leagueId = params.leagueId as string; // Assert as string
  const [seasons, setSeasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSeasons() {
      // Fetching seasons specific to this leagueId
      const res = await fetch(`/api/admin/leagues/${leagueId}/seasons`);
      if (res.ok) {
        const data = await res.json();
        setSeasons(data);
      }
      setLoading(false);
    }
    if (leagueId) fetchSeasons();
  }, [leagueId]);

  const handleDelete = async (seasonId: number, seasonName: string) => {
    // THE GATEKEEPER: VERBATIM CONFIRMATION
    const isConfirmed = window.confirm(
      `WARNING: You are about to delete "${seasonName}".\n\nThis will permanently purge all games, box scores, and player stats associated with this season. This action cannot be undone.\n\nProceed?`
    );

    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/seasons/${seasonId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Smoothly remove the season from the UI
        setSeasons((prev) => prev.filter((s) => s.id !== seasonId));
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error || 'Failed to delete season.'}`);
      }
    } catch (error) {
      console.error("Delete operation failed:", error);
      alert("Connection error. The database was not modified.");
    }
  };

  return (
    <div className="min-h-screen bg-[#001d3d] text-[#fdf0d5] font-sans p-8 md:p-16 border-[12px] border-[#c1121f]">
      <div className="max-w-6xl mx-auto">
        
        {/* BREADCRUMB / NAV */}
        <div className="flex justify-between items-center mb-12 border-b-4 border-[#669bbc] pb-6">
          <div>
            <Link href={`/admin/leagues/${leagueId}`} className="text-[10px] font-black uppercase text-[#669bbc] tracking-widest hover:text-white">
              ← Back to League Hub
            </Link>
            <h1 className="text-6xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0px_#c1121f] mt-2">
              Season Archive
            </h1>
          </div>
          
          <Link 
            href={`/admin/leagues/${leagueId}/seasons/new`}
            className="bg-[#c1121f] border-2 border-[#fdf0d5] px-8 py-4 font-black italic uppercase tracking-widest hover:bg-white hover:text-[#c1121f] transition-all shadow-lg text-center"
          >
            + New Season
          </Link>
        </div>

        {/* SEASON LIST */}
        <div className="space-y-6">
          {loading ? (
            <p className="text-center font-black italic uppercase animate-pulse text-2xl">Scanning Database...</p>
          ) : seasons.length === 0 ? (
            <div className="bg-[#003566] border-2 border-[#669bbc] p-12 text-center">
              <p className="text-2xl font-black italic uppercase opacity-50">No Active Seasons Found</p>
              <p className="text-[10px] font-bold uppercase text-[#669bbc] mt-2">Initialize a new campaign to begin recording stats.</p>
            </div>
          ) : (
            seasons.map((season) => (
              <div key={season.id} className="bg-[#003566] border-2 border-[#669bbc] p-8 flex flex-col xl:flex-row justify-between items-start xl:items-center group hover:border-[#fdf0d5] transition-all gap-8">
                
                {/* Left Side: Season Info */}
                <div>
                  <h3 className="text-3xl font-black italic uppercase text-white tracking-wide">{season.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <RuleBadge label="Innings" val={season.inningsPerGame} />
                    <RuleBadge label="Clean Hit" val={season.cleanHitRule ? "ON" : "OFF"} />
                    <RuleBadge label="Mercy" val={season.mercyRule + " Runs"} />
                  </div>
                </div>
                
                {/* Right Side: 2x2 Action Grid + Delete */}
                <div className="w-full xl:w-auto flex flex-col sm:flex-row gap-4">
                  
                  {/* The 4 Core Management Options */}
                  <div className="grid grid-cols-2 gap-2 flex-grow xl:flex-grow-0">
                    <ActionLink title="Edit/Create Teams" href={`/admin/leagues/${leagueId}/seasons/${season.id}/teams`} />
                    <ActionLink title="Manage Players" href={`/admin/leagues/${leagueId}/seasons/${season.id}/players`} />
                    <ActionLink title="Schedule Games" href={`/admin/leagues/${leagueId}/seasons/${season.id}/schedule/new`} />
                    <ActionLink title="Edit Schedule" href={`/admin/leagues/${leagueId}/seasons/${season.id}/games`} />
                  </div>

                  {/* Separate Delete Button */}
                  <button 
                    onClick={() => handleDelete(season.id, season.name)}
                    className="text-[10px] font-black uppercase tracking-widest border-2 border-[#c1121f]/50 bg-[#c1121f]/10 px-6 py-3 text-[#c1121f] hover:bg-[#c1121f] hover:text-white hover:border-[#fdf0d5] transition-all duration-200 h-full flex items-center justify-center min-h-[48px]"
                  >
                    Delete
                  </button>

                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// UI HELPERS
function RuleBadge({ label, val }: { label: string, val: any }) {
  return (
    <span className="text-[9px] font-black uppercase bg-[#001d3d] px-3 py-1 border border-[#669bbc] text-[#669bbc] whitespace-nowrap">
      {label}: <span className="text-[#fdf0d5]">{val}</span>
    </span>
  );
}

function ActionLink({ title, href }: { title: string, href: string }) {
  return (
    <Link 
      href={href} 
      className="text-[10px] font-black uppercase tracking-widest border border-white/20 bg-[#001d3d]/50 px-4 py-3 text-center hover:bg-[#669bbc] hover:text-[#001d3d] hover:border-[#001d3d] transition-all flex items-center justify-center min-h-[48px]"
    >
      {title}
    </Link>
  );
}