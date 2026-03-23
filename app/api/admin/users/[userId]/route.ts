import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);
  const admin = session?.user as any;

  if (!session || !admin.isGlobalAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { isGlobalAdmin } = await request.json();
  const userId = parseInt((await params).userId);

  try {
    // Prevent removing your own admin status
    if (userId === parseInt(admin.id)) {
      return NextResponse.json({ error: "Cannot modify your own root status." }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isGlobalAdmin }
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getServerSession(authOptions);
  const admin = session?.user as any;

  if (!session || !admin.isGlobalAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const userId = parseInt((await params).userId);

  try {
    if (userId === parseInt(admin.id)) {
      return NextResponse.json({ error: "Cannot delete your own account." }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Deletion failed" }, { status: 500 });
  }
}