import { db } from "@/lib/db";
import { NextResponse } from "next/server";

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
    if (!body.quantityAdded || isNaN(parseFloat(body.quantityAdded)) || parseFloat(body.quantityAdded) <= 0) {
      return NextResponse.json(
        { error: "Valid quantity added (greater than 0) is required" },
        { status: 400 }
      );
    }
    
    // Get current inventory
    const inventory = await db.feedInventory.findUnique({
      where: { id: body.inventoryId },
    });
    
    if (!inventory) {
      return NextResponse.json(
        { error: "Feed inventory not found" },
        { status: 404 }
      );
    }
    
    const quantityAdded = parseFloat(body.quantityAdded);
    
    // Update inventory with new stock
    const updatedInventory = await db.feedInventory.update({
      where: { id: body.inventoryId },
      data: {
        quantity: inventory.quantity + quantityAdded,
        lastRestocked: new Date(),
        cost: body.cost ? parseFloat(body.cost) : inventory.cost,
        supplier: body.supplier || inventory.supplier,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : inventory.expiryDate,
      },
    });
    
    return NextResponse.json(updatedInventory, { status: 200 });
  } catch (error: any) {
    console.error("Error restocking feed:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to restock feed",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}

