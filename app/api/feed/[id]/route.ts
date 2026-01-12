import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const feedInventory = await db.feedInventory.findUnique({
      where: { id },
      include: {
        feedRecords: {
          orderBy: {
            date: "desc",
          },
        },
      },
    });
    if (!feedInventory) {
      return NextResponse.json(
        { error: "Feed inventory not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(feedInventory);
  } catch (error) {
    console.error("Error fetching feed inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed inventory" },
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
    const feedInventory = await db.feedInventory.update({
      where: { id },
      data: {
        feedType: body.feedType,
        quantity: parseFloat(body.quantity),
        unit: body.unit || "kg",
        minThreshold: parseFloat(body.minThreshold),
        cost: body.cost ? parseFloat(body.cost) : null,
        supplier: body.supplier || null,
        lastRestocked: body.lastRestocked ? new Date(body.lastRestocked) : null,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      },
    });
    return NextResponse.json(feedInventory);
  } catch (error) {
    console.error("Error updating feed inventory:", error);
    return NextResponse.json(
      { error: "Failed to update feed inventory" },
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
    await db.feedInventory.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting feed inventory:", error);
    return NextResponse.json(
      { error: "Failed to delete feed inventory" },
      { status: 500 }
    );
  }
}

