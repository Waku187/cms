import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const inventoryId = searchParams.get("inventoryId");
    
    const where = inventoryId ? { inventoryId } : {};
    
    const feedRecords = await db.feedRecord.findMany({
      where,
      include: {
        inventory: {
          select: {
            id: true,
            feedType: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
      take: 100,
    });
    return NextResponse.json(feedRecords);
  } catch (error) {
    console.error("Error fetching feed records:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed records" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validation
    if (!body.inventoryId) {
      return NextResponse.json(
        { error: "Inventory ID is required" },
        { status: 400 }
      );
    }
    if (!body.date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }
    if (!body.quantityUsed || isNaN(parseFloat(body.quantityUsed)) || parseFloat(body.quantityUsed) <= 0) {
      return NextResponse.json(
        { error: "Valid quantity used (greater than 0) is required" },
        { status: 400 }
      );
    }
    
    // Check if inventory exists
    const inventory = await db.feedInventory.findUnique({
      where: { id: body.inventoryId },
    });
    
    if (!inventory) {
      return NextResponse.json(
        { error: "Feed inventory not found" },
        { status: 404 }
      );
    }
    
    const quantityUsed = parseFloat(body.quantityUsed);
    
    // Check if there's enough inventory
    if (inventory.quantity < quantityUsed) {
      return NextResponse.json(
        { 
          error: "Insufficient inventory",
          available: inventory.quantity,
          requested: quantityUsed
        },
        { status: 400 }
      );
    }
    
    // Create the feed record
    const feedRecord = await db.feedRecord.create({
      data: {
        inventoryId: body.inventoryId,
        date: new Date(body.date),
        quantityUsed: quantityUsed,
        notes: body.notes || null,
      },
      include: {
        inventory: {
          select: {
            id: true,
            feedType: true,
          },
        },
      },
    });
    
    // Update the inventory quantity
    const newQuantity = inventory.quantity - quantityUsed;
    await db.feedInventory.update({
      where: { id: body.inventoryId },
      data: {
        quantity: Math.max(0, newQuantity), // Ensure quantity doesn't go negative
      },
    });
    
    return NextResponse.json(feedRecord, { status: 201 });
  } catch (error: any) {
    console.error("Error creating feed record:", error);
    
    // Handle invalid inventory reference
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Invalid inventory ID" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to create feed record",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}

