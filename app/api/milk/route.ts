import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cattleId = searchParams.get("cattleId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const session = searchParams.get("session");

    const where: any = {};

    if (cattleId) {
      where.cattleId = cattleId;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (session && session !== "all") {
      where.session = session;
    }

    const milkRecords = await db.milkRecord.findMany({
      where,
      include: {
        cattle: {
          select: {
            id: true,
            tagNumber: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(milkRecords);
  } catch (error) {
    console.error("Error fetching milk records:", error);
    return NextResponse.json(
      { error: "Failed to fetch milk records" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validation
    if (!body.date) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }
    if (!body.liters || isNaN(parseFloat(body.liters)) || parseFloat(body.liters) <= 0) {
      return NextResponse.json(
        { error: "Valid liters amount (greater than 0) is required" },
        { status: 400 }
      );
    }
    if (!body.session || !["MORNING", "AFTERNOON", "EVENING"].includes(body.session)) {
      return NextResponse.json(
        { error: "Valid session (MORNING, AFTERNOON, or EVENING) is required" },
        { status: 400 }
      );
    }
    if (body.quality && !["EXCELLENT", "GOOD", "FAIR", "POOR"].includes(body.quality)) {
      return NextResponse.json(
        { error: "Invalid quality value" },
        { status: 400 }
      );
    }
    
    // Validate cattle ID if provided
    if (body.cattleId) {
      const cattle = await db.cattle.findUnique({
        where: { id: body.cattleId },
      });
      if (!cattle) {
        return NextResponse.json(
          { error: "Invalid cattle ID" },
          { status: 400 }
        );
      }
    }
    
    const milkRecord = await db.milkRecord.create({
      data: {
        cattleId: body.cattleId || null,
        date: new Date(body.date),
        liters: parseFloat(body.liters),
        session: body.session,
        quality: body.quality || "GOOD",
        notes: body.notes || null,
      },
      include: {
        cattle: {
          select: {
            id: true,
            tagNumber: true,
            name: true,
            category: true,
          },
        },
      },
    });
    return NextResponse.json(milkRecord, { status: 201 });
  } catch (error: any) {
    console.error("Error creating milk record:", error);
    
    // Handle invalid cattle reference
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Invalid cattle ID" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to create milk record",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}

