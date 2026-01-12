import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const recordType = searchParams.get("recordType");
    
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (recordType) {
      where.recordType = recordType;
    }
    
    const healthRecords = await db.healthRecord.findMany({
      where,
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
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(healthRecords);
  } catch (error) {
    console.error("Error fetching health records:", error);
    return NextResponse.json(
      { error: "Failed to fetch health records" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validation
    if (!body.cattleId) {
      return NextResponse.json(
        { error: "Cattle ID is required" },
        { status: 400 }
      );
    }
    if (!body.recordType || !["VACCINATION", "DEWORMING", "CHECKUP", "TREATMENT", "SURGERY"].includes(body.recordType)) {
      return NextResponse.json(
        { error: "Valid record type is required" },
        { status: 400 }
      );
    }
    if (!body.description) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }
    if (!body.scheduledDate) {
      return NextResponse.json(
        { error: "Scheduled date is required" },
        { status: 400 }
      );
    }
    
    // Validate vaccination type if record type is VACCINATION
    if (body.recordType === "VACCINATION" && body.vaccinationType) {
      const validVaccinationTypes = ["FMD", "BRUCELLOSIS", "ANTHRAX", "BLACKLEG", "RABIES", "OTHER"];
      if (!validVaccinationTypes.includes(body.vaccinationType)) {
        return NextResponse.json(
          { error: "Invalid vaccination type" },
          { status: 400 }
        );
      }
    }
    
    const healthRecord = await db.healthRecord.create({
      data: {
        cattleId: body.cattleId,
        recordType: body.recordType,
        vaccinationType: body.vaccinationType || null,
        description: body.description,
        scheduledDate: new Date(body.scheduledDate),
        completedDate: body.completedDate ? new Date(body.completedDate) : null,
        status: body.status || "PENDING",
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
    return NextResponse.json(healthRecord, { status: 201 });
  } catch (error: any) {
    console.error("Error creating health record:", error);
    
    // Handle invalid cattle reference
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Invalid cattle ID" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to create health record",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}

