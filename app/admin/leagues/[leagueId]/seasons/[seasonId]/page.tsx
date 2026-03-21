import Link from 'next/link';
import prisma from '@/lib/prisma';

export default async function SeasonDashboard({ params }: { params: { leagueId: string, seasonId: string } }) {
  const { leagueId, seasonId } = await params;
  
  const season = await prisma.season.findUnique({
    where: { id: parseInt(seasonId) },
    include: { league: true }
  });

  const menuItems = [
    { title: "Manage Teams", desc: "Add existing teams or create new ones.", icon: "⚾", path: "teams" },
    { title: "Manage Players", desc: "Sign players to team rosters.", icon: "👥", path: "players" },
    { title: "Manage Schedule", desc: "Create games and set matchups.", icon: "📅", path: "schedule" },
    { title: "Manage Stats", desc: "View box scores and season leaders.", icon: "📈", path: "stats" },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{season?.name}</h1>
        <p className="text-gray-500">{season?.league.fullName} — Management Hub</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menuItems.map((item) => (
          <Link 
            key={item.path} 
            href={`/admin/leagues/${leagueId}/seasons/${seasonId}/${item.path}`}
            className="p-6 border rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm group"
          >
            <span className="text-4xl mb-4 block">{item.icon}</span>
            <h2 className="text-xl font-bold group-hover:text-blue-600">{item.title}</h2>
            <p className="text-gray-600 mt-2">{item.desc}</p>
          </Link>
        ))}
      </div>
      
      <div className="mt-12 p-6 bg-gray-100 rounded-lg">
        <h3 className="font-bold mb-2">Active Season Rules:</h3>
        <ul className="text-sm grid grid-cols-2 gap-2">
          <li>• Innings: {season?.inningsPerGame}</li>
          <li>• Mercy Rule: {season?.mercyRule} runs</li>
          <li>• Ghost Runner: {season?.ghostRunner ? "Yes" : "No"}</li>
          <li>• Clean Hit Rule: {season?.cleanHitRule ? "Yes" : "No"}</li>
        </ul>
      </div>
    </div>
  );
}