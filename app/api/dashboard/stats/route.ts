import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const milkView = searchParams.get("milkView") || "daily";
    const cattleView = searchParams.get("cattleView") || "daily";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Get all cattle counts
    const totalCattle = await db.cattle.count({
      where: { status: "ACTIVE" },
    });

    const maleCount = await db.cattle.count({
      where: { status: "ACTIVE", gender: "MALE" },
    });

    const femaleCount = await db.cattle.count({
      where: { status: "ACTIVE", gender: "FEMALE" },
    });

    const calfCount = await db.cattle.count({
      where: { status: "ACTIVE", category: "CALF" },
    });

    // Calculate milk date range
    const now = new Date();
    let milkStart: Date;
    let milkEnd: Date = new Date(now);

    if (milkView === "daily" && startDate && endDate) {
      milkStart = new Date(startDate);
      milkEnd = new Date(endDate);
    } else {
      switch (milkView) {
        case "daily":
          milkStart = new Date(now);
          milkStart.setDate(now.getDate() - 6);
          break;
        case "monthly":
          milkStart = new Date(now);
          milkStart.setMonth(now.getMonth() - 5);
          milkStart.setDate(1); // Start of the month 5 months ago
          break;
        case "yearly":
          milkStart = new Date(now);
          milkStart.setFullYear(now.getFullYear() - 4);
          milkStart.setMonth(0, 1); // Jan 1st 4 years ago
          break;
        default:
          milkStart = new Date(now);
          milkStart.setDate(now.getDate() - 6);
      }
    }

    // Calculate cattle date range
    let cattleStart: Date;
    let cattleEnd: Date = new Date(now);

    switch (cattleView) {
      case "daily":
        cattleStart = new Date(now);
        cattleStart.setDate(now.getDate() - 6);
        break;
      case "monthly":
        cattleStart = new Date(now);
        cattleStart.setMonth(now.getMonth() - 5);
        cattleStart.setDate(1);
        break;
      case "yearly":
        cattleStart = new Date(now);
        cattleStart.setFullYear(now.getFullYear() - 4);
        cattleStart.setMonth(0, 1);
        break;
      default:
        cattleStart = new Date(now);
        cattleStart.setDate(now.getDate() - 6);
    }

    // Get milk production data
    const milkRecords = await db.milkRecord.findMany({
      where: {
        date: {
          gte: milkStart,
          lte: milkEnd,
        },
      },
      include: {
        cattle: {
          select: {
            id: true,
            tagNumber: true,
            name: true,
          },
        },
      },
    });

    // Calculate today's milk
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayMilk = await db.milkRecord.aggregate({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: {
        liters: true,
      },
    });

    // Calculate this week's milk
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    const weekMilk = await db.milkRecord.aggregate({
      where: {
        date: {
          gte: weekStart,
          lte: now,
        },
      },
      _sum: {
        liters: true,
      },
    });

    // Calculate average per cow
    const activeCows = await db.cattle.count({
      where: {
        status: "ACTIVE",
        category: "COW",
      },
    });

    const avgPerCow = activeCows > 0 && weekMilk._sum.liters
      ? (weekMilk._sum.liters / activeCows / 7).toFixed(1)
      : "0";

    // Group milk data by period
    const milkData: { period: string; liters: number }[] = [];

    if (milkView === "daily") {
      // Group by day
      const dayMap = new Map<string, number>();
      milkRecords.forEach((record) => {
        const day = record.date.toISOString().slice(0, 10);
        dayMap.set(day, (dayMap.get(day) || 0) + record.liters);
      });

      // Fill in missing days
      for (let d = new Date(milkStart); d <= milkEnd; d.setDate(d.getDate() + 1)) {
        const day = d.toISOString().slice(0, 10);
        const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
        milkData.push({
          period: dayName,
          liters: Math.round(dayMap.get(day) || 0),
        });
      }
    } else if (milkView === "monthly") {
      // Group by month
      const monthMap = new Map<string, number>();
      milkRecords.forEach((record) => {
        const month = record.date.toISOString().slice(0, 7); // yyyy-mm
        monthMap.set(month, (monthMap.get(month) || 0) + record.liters);
      });

      // Fill in missing months
      for (let d = new Date(milkStart); d <= milkEnd; d.setMonth(d.getMonth() + 1)) {
        const monthKey = d.toISOString().slice(0, 7);
        const monthLabel = d.toLocaleDateString("en-US", { month: "short" });
        milkData.push({
          period: monthLabel,
          liters: Math.round(monthMap.get(monthKey) || 0),
        });
      }
    } else {
      // Group by year
      const yearMap = new Map<string, number>();
      milkRecords.forEach((record) => {
        const year = record.date.getFullYear().toString();
        yearMap.set(year, (yearMap.get(year) || 0) + record.liters);
      });

      // Fill in missing years
      for (let d = new Date(milkStart); d <= milkEnd; d.setFullYear(d.getFullYear() + 1)) {
        const year = d.getFullYear().toString();
        milkData.push({
          period: year,
          liters: Math.round(yearMap.get(year) || 0),
        });
      }
    }

    // Get cattle count over time (using DailySummary)
    const summaries = await db.dailySummary.findMany({
      where: {
        date: {
          gte: cattleStart,
          lte: cattleEnd,
        },
      },
      orderBy: { date: "asc" },
    });

    const cattleData: { period: string; count: number }[] = [];

    if (cattleView === "daily") {
      const summaryMap = new Map(
        summaries.map((s) => [s.date.toISOString().slice(0, 10), s.totalCattle])
      );
      for (let d = new Date(cattleStart); d <= cattleEnd; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        cattleData.push({
          period: d.toLocaleDateString("en-US", { weekday: "short" }),
          count: summaryMap.get(key) || totalCattle, // fallback to total for now if no summary
        });
      }
    } else if (cattleView === "monthly") {
      const monthMap = new Map<string, number>();
      summaries.forEach((s) => {
        const key = s.date.toISOString().slice(0, 7);
        // For monthly, we take the average or the last record of the month
        monthMap.set(key, s.totalCattle);
      });

      for (let d = new Date(cattleStart); d <= cattleEnd; d.setMonth(d.getMonth() + 1)) {
        const key = d.toISOString().slice(0, 7);
        cattleData.push({
          period: d.toLocaleDateString("en-US", { month: "short" }),
          count: monthMap.get(key) || totalCattle,
        });
      }
    } else {
      const yearMap = new Map<string, number>();
      summaries.forEach((s) => {
        const key = s.date.getFullYear().toString();
        yearMap.set(key, s.totalCattle);
      });

      for (let d = new Date(cattleStart); d <= cattleEnd; d.setFullYear(d.getFullYear() + 1)) {
        const key = d.getFullYear().toString();
        cattleData.push({
          period: key,
          count: yearMap.get(key) || totalCattle,
        });
      }
    }

    // Get health records due
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);

    const healthDue = await db.healthRecord.count({
      where: {
        status: "PENDING",
        scheduledDate: {
          lte: weekEnd,
          gte: now,
        },
      },
    });

    // Get feed inventory
    const feedInventory = await db.feedInventory.findMany({
      select: {
        feedType: true,
        quantity: true,
        minThreshold: true,
      },
    });

    const totalFeed = feedInventory.reduce((sum, feed) => sum + feed.quantity, 0);
    const hayFeed = feedInventory.find((f) => f.feedType === "HAY")?.quantity || 0;
    const concentrateFeed =
      feedInventory.find((f) => f.feedType === "CONCENTRATE")?.quantity || 0;
    const silageFeed = feedInventory.find((f) => f.feedType === "SILAGE")?.quantity || 0;
    const silageThreshold =
      feedInventory.find((f) => f.feedType === "SILAGE")?.minThreshold || 0;

    return NextResponse.json({
      cattle: {
        total: totalCattle,
        male: maleCount,
        female: femaleCount,
        calves: calfCount,
        chartData: cattleData,
      },
      milk: {
        today: todayMilk._sum.liters || 0,
        thisWeek: weekMilk._sum.liters || 0,
        avgPerCow: parseFloat(avgPerCow),
        chartData: milkData,
      },
      health: {
        due: healthDue,
      },
      feed: {
        total: totalFeed,
        hay: hayFeed,
        concentrate: concentrateFeed,
        silage: silageFeed,
        silageLow: silageFeed < silageThreshold,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}

