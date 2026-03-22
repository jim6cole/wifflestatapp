import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { name, fullName, location, description } = await request.json();

    // Create the League AND the Membership in one single transaction!
    const newLeague = await prisma.league.create({
      data: { 
        name, 
        fullName, 
        location, 
        description,
        memberships: {
          create: {
            userId: dbUser.id,
            roleLevel: 2,       // Level 2 = Commissioner
            isApproved: true    // Instantly approved for their own league
          }
        }
      }
    });

    return NextResponse.json(newLeague);
  } catch (error: any) {
    console.error("League Creation Error:", error);
    return NextResponse.json({ error: "Creation failed" }, { status: 500 });
  }
}