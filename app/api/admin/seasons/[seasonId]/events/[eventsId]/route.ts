import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;
    const body = await request.json();
    
    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    
    // Handle the winner update (allow nulling it out if they made a mistake)
    if (body.winnerId !== undefined) {
      updateData.winnerId = body.winnerId === '' ? null : parseInt(body.winnerId);
    }

    const updatedEvent = await prisma.event.update({
      where: { id: parseInt(eventId) },
      data: updateData
    });
    
    return NextResponse.json(updatedEvent);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update tournament" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;
    await prisma.event.delete({
      where: { id: parseInt(eventId) }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete tournament. Make sure all games inside it are deleted first." }, { status: 500 });
  }
}