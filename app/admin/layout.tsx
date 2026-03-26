import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/admin/dashboard");
  }

  // We are letting anyone with a valid login into the /admin area.
  // The individual pages (like Dashboard) will handle showing 
  // "Empty" states if they don't have leagues yet.
  
  return (
    <div className="min-h-screen bg-[#001d3d] border-x-[12px] border-[#c1121f]">
      <main className="relative">
        {children}
      </main>
    </div>
  );
}