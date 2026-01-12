import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    console.log("Fetching cattle from database...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "NOT SET");
    
    const cattle = await db.cattle.findMany({
      include: {
        offspring: {
          select: {
            id: true,
            tagNumber: true,
            name: true,
          },
        },
        healthRecords: {
          where: {
            status: {
              in: ["PENDING", "OVERDUE"],
            },
          },
          orderBy: {
            scheduledDate: "asc",
          },
          take: 1,
        },
        milkRecords: {
          orderBy: {
            date: "desc",
          },
          take: 30, // Last 30 records for average calculation
        },
        _count: {
          select: {
            offspring: true,
            milkRecords: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    console.log(`Found ${cattle.length} cattle records`);
    return NextResponse.json(cattle);
  } catch (error) {
    console.error("Error fetching cattle:", error);
    
    // Better error extraction
    let errorMessage = "Unknown error";
    let errorCode = null;
    let errorDetails = null;
    let errorStack: string | undefined = undefined;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = error.stack;
      
      // Check for Prisma error codes
      if ('code' in error) {
        errorCode = (error as any).code;
      }
      
      // Check for Prisma meta information
      if ('meta' in error) {
        errorDetails = (error as any).meta;
      }
    }
    
    console.error("Error details:", {
      message: errorMessage,
      code: errorCode,
      meta: errorDetails,
      stack: errorStack
    });
    
    // Check for common database errors
    if (errorMessage.includes("Can't reach database") || 
        errorMessage.includes("P1001") ||
        errorCode === "P1001") {
      return NextResponse.json(
        { 
          error: "Database connection failed", 
          details: "Please check if the database is running and DATABASE_URL is correct",
          message: errorMessage,
          code: errorCode
        },
        { status: 500 }
      );
    }
    
    // Check for Prisma client not generated
    if (errorMessage.includes("PrismaClient") || 
        errorMessage.includes("Cannot find module") ||
        errorMessage.includes("generated")) {
      return NextResponse.json(
        { 
          error: "Prisma client not generated", 
          details: "Please run 'npx prisma generate' to generate the Prisma client",
          message: errorMessage,
          code: errorCode
        },
        { status: 500 }
      );
    }
    
    // Check for schema mismatch
    if (errorCode?.startsWith("P2") || errorMessage.includes("Unknown arg") || errorMessage.includes("Invalid")) {
      return NextResponse.json(
        { 
          error: "Database schema mismatch", 
          details: "Please run 'npx prisma migrate dev' to sync the database schema",
          message: errorMessage,
          code: errorCode
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to fetch cattle", 
        details: errorMessage,
        code: errorCode,
        meta: errorDetails,
        stack: process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validation
    if (!body.tagNumber) {
      return NextResponse.json(
        { error: "Tag number is required" },
        { status: 400 }
      );
    }
    if (!body.gender || !["MALE", "FEMALE"].includes(body.gender)) {
      return NextResponse.json(
        { error: "Valid gender (MALE or FEMALE) is required" },
        { status: 400 }
      );
    }
    if (!body.breed) {
      return NextResponse.json(
        { error: "Breed is required" },
        { status: 400 }
      );
    }
    if (!body.dateOfBirth) {
      return NextResponse.json(
        { error: "Date of birth is required" },
        { status: 400 }
      );
    }
    if (!body.category || !["BULL", "COW", "HEIFER", "CALF", "STEER"].includes(body.category)) {
      return NextResponse.json(
        { error: "Valid category is required" },
        { status: 400 }
      );
    }
    
    const cattle = await db.cattle.create({
      data: {
        tagNumber: body.tagNumber,
        name: body.name || null,
        gender: body.gender,
        breed: body.breed,
        dateOfBirth: new Date(body.dateOfBirth),
        weight: body.weight ? parseFloat(body.weight) : null,
        imageUrl: body.imageUrl || null,
        status: body.status || "ACTIVE",
        category: body.category,
        motherId: body.motherId || null,
      },
      include: {
        mother: {
          select: {
            id: true,
            tagNumber: true,
            name: true,
          },
        },
      },
    });
    return NextResponse.json(cattle, { status: 201 });
  } catch (error: any) {
    console.error("Error creating cattle:", error);
    
    // Handle duplicate tag number
    if (error.code === "P2002" && error.meta?.target?.includes("tagNumber")) {
      return NextResponse.json(
        { error: "A cattle with this tag number already exists" },
        { status: 409 }
      );
    }
    
    // Handle invalid mother reference
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Invalid mother reference" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to create cattle",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}