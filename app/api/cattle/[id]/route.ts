import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const cattle = await db.cattle.update({
      where: { id },
      data: {
        tagNumber: body.tagNumber,
        name: body.name,
        gender: body.gender,
        breed: body.breed,
        dateOfBirth: new Date(body.dateOfBirth),
        weight: body.weight ? parseFloat(body.weight) : null,
        imageUrl: body.imageUrl || null,
        status: body.status,
        category: body.category,
        motherId: body.motherId || null,
      },
    });
    return NextResponse.json(cattle);
  } catch (error) {
    console.error("Error updating cattle:", error);
    return NextResponse.json(
      { error: "Failed to update cattle" },
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
    await db.cattle.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cattle:", error);
    return NextResponse.json(
      { error: "Failed to delete cattle" },
      { status: 500 }
    );
  }
}

