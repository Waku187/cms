import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const feedInventory = await db.feedInventory.findMany({
      include: {
        feedRecords: {
          orderBy: {
            date: "desc",
          },
          take: 10, // Last 10 usage records
        },
        _count: {
          select: {
            feedRecords: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(feedInventory);
  } catch (error) {
    console.error("Error fetching feed inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed inventory" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validation
    if (!body.feedType || !["HAY", "CONCENTRATE", "SILAGE", "MINERAL_SUPPLEMENT", "GRAIN", "OTHER"].includes(body.feedType)) {
      return NextResponse.json(
        { error: "Valid feed type is required" },
        { status: 400 }
      );
    }
    if (!body.quantity || isNaN(parseFloat(body.quantity)) || parseFloat(body.quantity) <= 0) {
      return NextResponse.json(
        { error: "Valid quantity (greater than 0) is required" },
        { status: 400 }
      );
    }
    if (!body.minThreshold || isNaN(parseFloat(body.minThreshold)) || parseFloat(body.minThreshold) < 0) {
      return NextResponse.json(
        { error: "Valid minimum threshold (0 or greater) is required" },
        { status: 400 }
      );
    }
    
    const feedInventory = await db.feedInventory.create({
      data: {
        feedType: body.feedType,
        quantity: parseFloat(body.quantity),
        unit: body.unit || "kg",
        minThreshold: parseFloat(body.minThreshold),
        cost: body.cost ? parseFloat(body.cost) : null,
        supplier: body.supplier || null,
        lastRestocked: body.lastRestocked ? new Date(body.lastRestocked) : new Date(),
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      },
    });
    return NextResponse.json(feedInventory, { status: 201 });
  } catch (error: any) {
    console.error("Error creating feed inventory:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to create feed inventory",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}

