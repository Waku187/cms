import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const healthRecord = await db.healthRecord.update({
      where: { id: body.id },
      data: {
        status: "COMPLETED",
        completedDate: new Date(),
        notes: body.notes || undefined,
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
    console.error("Error completing health record:", error);
    return NextResponse.json(
      { error: "Failed to complete health record" },
      { status: 500 }
    );
  }
}

