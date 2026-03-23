import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  // STRICT SECURITY: Only Global Admins can access the registry
  if (!session || !user.isGlobalAdmin) {
    return NextResponse.json({ error: "Unauthorized. Root Clearance Required." }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isGlobalAdmin: true,
        createdAt: true,
        memberships: {
          include: {
            league: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load registry" }, { status: 500 });
  }
}