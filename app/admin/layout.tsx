import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
// 1. THE BOUNCER: Check for an active session
  const session = await getServerSession(authOptions);

  // Send them to our newly moved login page
  if (!session) {
    redirect("/login?callbackUrl=/admin"); // <-- Make sure there is no /admin before /login
  }

  // 2. THE VIP LIST: Check for Admin Privileges
  const user = session.user as any;
  
  // Using the exact fields from your Prisma schema
  const isGlobalAdmin = user?.isGlobalAdmin;
  
  // Check if they are a Commissioner (2) or Scorekeeper (1) in ANY league
  const hasLeagueRoles = user?.memberships?.some((m: any) => m.roleLevel >= 1);

  if (!isGlobalAdmin && !hasLeagueRoles) {
    // They are logged in, but they are just a regular player/fan.
    // Kick them back to the public homepage.
    redirect("/"); 
  }

  // 3. ACCESS GRANTED: Render the Admin UI
  return (
    <div className="admin-wrapper min-h-screen bg-[#001d3d]">
      {/* If you have a global admin sidebar or header, it goes right here */}
      
      <main>
        {children}
      </main>
    </div>
  );
}