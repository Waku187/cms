import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const healthRecord = await db.healthRecord.findUnique({
      where: { id },
      include: {
        cattle: {
          select: {
            id: true,
            tagNumber: true,
            name: true,
            breed: true,
            category: true,
          },
        },
      },
    });
    if (!healthRecord) {
      return NextResponse.json(
        { error: "Health record not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(healthRecord);
  } catch (error) {
    console.error("Error fetching health record:", error);
    return NextResponse.json(
      { error: "Failed to fetch health record" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const healthRecord = await db.healthRecord.update({
      where: { id },
      data: {
        cattleId: body.cattleId,
        recordType: body.recordType,
        vaccinationType: body.vaccinationType || null,
        description: body.description,
        scheduledDate: new Date(body.scheduledDate),
        completedDate: body.completedDate ? new Date(body.completedDate) : null,
        status: body.status,
        veterinarian: body.veterinarian || null,
        cost: body.cost ? parseFloat(body.cost) : null,
        notes: body.notes || null,
      },
      include: {
        cattle: {
          select: {
            id: true,
            tagNumber: true,
            name: true,
            breed: true,
            category: true,
          },
        },
      },
    });
    return NextResponse.json(healthRecord);
  } catch (error) {
    console.error("Error updating health record:", error);
    return NextResponse.json(
      { error: "Failed to update health record" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.healthRecord.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting health record:", error);
    return NextResponse.json(
      { error: "Failed to delete health record" },
      { status: 500 }
    );
  }
}

