"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import DateRangePicker from "@/components/ui/date-range-picker"
import ThemeToggle from "@/components/theme-toggle"
import { Beef, Droplet, Syringe, Wheat, TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import Link from "next/link"
import { useEffect } from "react"
import { useState } from "react"

const milkChartConfig = {
  liters: {
    label: "Liters",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

const cattleChartConfig = {
  count: {
    label: "Cattle",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

interface DashboardStats {
  cattle: {
    total: number;
    male: number;
    female: number;
    calves: number;
    chartData: { period: string; count: number }[];
  };
  milk: {
    today: number;
    thisWeek: number;
    avgPerCow: number;
    chartData: { period: string; liters: number }[];
  };
  health: {
    due: number;
  };
  feed: {
    total: number;
    hay: number;
    concentrate: number;
    silage: number;
    silageLow: boolean;
  };
}

export default function Page() {
  const [milkView, setMilkView] = useState<"daily" | "monthly" | "yearly">("daily")
  const [cattleView, setCattleView] = useState<"daily" | "monthly" | "yearly">("daily")
  const [milkStart, setMilkStart] = useState<string>("")
  const [milkEnd, setMilkEnd] = useState<string>("")
  const [cattleStart, setCattleStart] = useState<string>("")
  const [cattleEnd, setCattleEnd] = useState<string>("")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Helper to format Date -> yyyy-mm-dd for input[type=date]
  const toISODate = (d: Date) => d.toISOString().slice(0, 10)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        milkView: milkView,
        cattleView: cattleView,
      })
      if (milkView === "daily" && milkStart && milkEnd) {
        params.append("startDate", milkStart)
        params.append("endDate", milkEnd)
      }
      const response = await fetch(`/api/dashboard/stats?${params}`)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const today = new Date()
    const lastWeek = new Date(today)
    lastWeek.setDate(today.getDate() - 6)

    if (!milkStart && !milkEnd) {
      setMilkStart(toISODate(lastWeek))
      setMilkEnd(toISODate(today))
    }

    if (!cattleStart && !cattleEnd) {
      setCattleStart(toISODate(lastWeek))
      setCattleEnd(toISODate(today))
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [milkView, cattleView, milkStart, milkEnd])

  const getMilkData = () => {
    return stats?.milk?.chartData || []
  }

  const getCattleData = () => {
    return stats?.cattle?.chartData || []
  }
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex w-full items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <h1 className="text-base font-medium">Dashboard</h1>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {/* Cattle Count Card */}
            <Link href="/dashboard/HerdManagement">
              <Card className="border-border bg-card shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Cattle Count
                  </CardTitle>
                  <div className="rounded-full bg-primary/10 p-1.5">
                    <Beef className="h-3.5 w-3.5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xl font-bold">
                    {loading ? "..." : stats?.cattle?.total || 0}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Males</span>
                      <span className="font-semibold text-foreground">
                        {loading ? "..." : stats?.cattle?.male || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Females</span>
                      <span className="font-semibold text-foreground">
                        {loading ? "..." : stats?.cattle?.female || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Calves</span>
                      <span className="font-semibold text-foreground">
                        {loading ? "..." : stats?.cattle?.calves || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Milk Production Card */}
            <Link href="/dashboard/MilkProduction">
              <Card className="border-border bg-card shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Milk Production
                  </CardTitle>
                  <div className="rounded-full bg-chart-2/10 p-1.5">
                    <Droplet className="h-3.5 w-3.5 text-chart-2" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <div className="text-xl font-bold">
                      {loading ? "..." : `${Math.round(stats?.milk?.today || 0)} L`}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Today's collection
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">This Week</span>
                      <span className="font-semibold text-foreground">
                        {loading ? "..." : `${Math.round(stats?.milk?.thisWeek || 0).toLocaleString()} L`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Avg per Cow</span>
                      <span className="font-semibold text-foreground">
                        {loading ? "..." : `${stats?.milk?.avgPerCow || 0} L`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Health & Vaccinations Card */}
            <Link href="/dashboard/HealthManagement">
              <Card className="border-border bg-card shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Health Status
                  </CardTitle>
                  <div className="rounded-full bg-chart-4/10 p-1.5">
                    <Syringe className="h-3.5 w-3.5 text-chart-4" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <div className="text-xl font-bold">
                      {loading ? "..." : `${stats?.health?.due || 0} Due`}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Vaccinations this week
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Health Records</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-500">
                        {loading ? "..." : `${stats?.health?.due || 0} pending`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Feed Management Card */}
            <Link href="/dashboard/FeedManagement">
              <Card className="border-border bg-card shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Feed Inventory
                  </CardTitle>
                  <div className="rounded-full bg-chart-5/10 p-1.5">
                    <Wheat className="h-3.5 w-3.5 text-chart-5" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <div className="text-xl font-bold">
                      {loading ? "..." : `${Math.round(stats?.feed?.total || 0).toLocaleString()} kg`}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total feed remaining
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Hay</span>
                      <span className="font-semibold text-foreground">
                        {loading ? "..." : `${Math.round(stats?.feed?.hay || 0).toLocaleString()} kg`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Concentrate</span>
                      <span className="font-semibold text-foreground">
                        {loading ? "..." : `${Math.round(stats?.feed?.concentrate || 0).toLocaleString()} kg`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Silage</span>
                      <span className={`font-semibold ${stats?.feed?.silageLow ? "text-red-600 dark:text-red-500" : "text-foreground"}`}>
                        {loading ? "..." : `${Math.round(stats?.feed?.silage || 0).toLocaleString()} kg${stats?.feed?.silageLow ? " (Low)" : ""}`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>


          {/* Charts Section */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Milk Production Chart */}
            <Card className="shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Milk Production</CardTitle>
                    <CardDescription>
                      Tracking production trends
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant={milkView === "daily" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMilkView("daily")}
                    >
                      Daily
                    </Button>
                    <Button
                      variant={milkView === "monthly" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMilkView("monthly")}
                    >
                      Monthly
                    </Button>
                    <Button
                      variant={milkView === "yearly" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMilkView("yearly")}
                    >
                      Yearly
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer config={milkChartConfig}>
                  <AreaChart
                    accessibilityLayer
                    data={getMilkData()}
                    margin={{
                      top: 12,
                      bottom: 6,
                      left: 12,
                      right: 12,
                    }}
                  >
                    <CartesianGrid vertical={false} />
                    <YAxis tickFormatter={(v) =>
                      typeof v === "number" ? v.toLocaleString() : String(v)
                    } width={64} />
                    <XAxis
                      dataKey="period"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="line" />}
                    />
                    <Area
                      dataKey="liters"
                      type="natural"
                      fill="var(--color-liters)"
                      fillOpacity={0.4}
                      stroke="var(--color-liters)"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
              <CardFooter>
                <div className="flex w-full items-center justify-between gap-2 text-sm">
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2 leading-none font-medium text-muted-foreground">
                      <Droplet className="h-4 w-4" />
                      {milkView === "daily" && (
                        <span>
                          {milkStart} — {milkEnd}
                        </span>
                      )}
                      {milkView === "monthly" && "Last 6 months"}
                      {milkView === "yearly" && "Last 5 years"}
                    </div>
                  </div>

                  {/* Date range inputs for daily view */}
                  {milkView === "daily" && (
                    <DateRangePicker
                      start={milkStart}
                      end={milkEnd}
                      onStartChange={setMilkStart}
                      onEndChange={setMilkEnd}
                      onApply={() => {
                        fetchStats()
                      }}
                    />
                  )}
                </div>
              </CardFooter>
            </Card>

            {/* Cattle Count Chart */}
            <Card className="shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer" >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Cattle Population</CardTitle>
                    <CardDescription>
                      Tracking herd growth
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant={cattleView === "daily" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCattleView("daily")}
                    >
                      Daily
                    </Button>
                    <Button
                      variant={cattleView === "monthly" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCattleView("monthly")}
                    >
                      Monthly
                    </Button>
                    <Button
                      variant={cattleView === "yearly" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCattleView("yearly")}
                    >
                      Yearly
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer config={cattleChartConfig}>
                  <AreaChart
                    accessibilityLayer
                    data={getCattleData()}
                    margin={{
                      top: 12,
                      bottom: 6,
                      left: 12,
                      right: 12,
                    }}
                  >
                    <CartesianGrid vertical={false} />
                    <YAxis tickFormatter={(v) =>
                      typeof v === "number" ? v.toLocaleString() : String(v)
                    } width={64} />
                    <XAxis
                      dataKey="period"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="line" />}
                    />
                    <Area
                      dataKey="count"
                      type="natural"
                      fill="var(--color-count)"
                      fillOpacity={0.4}
                      stroke="var(--color-count)"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
              <CardFooter>
                <div className="flex w-full items-center justify-between gap-2 text-sm">
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2 leading-none font-medium text-muted-foreground">
                      <Beef className="h-4 w-4" />
                      {cattleView === "daily" && (
                        <span>
                          {cattleStart} — {cattleEnd}
                        </span>
                      )}
                      {cattleView === "monthly" && "Last 6 months"}
                      {cattleView === "yearly" && "Last 5 years"}
                    </div>
                  </div>

                  {/* Date range inputs for daily view */}
                  {cattleView === "daily" && (
                    <DateRangePicker
                      start={cattleStart}
                      end={cattleEnd}
                      onStartChange={setCattleStart}
                      onEndChange={setCattleEnd}
                      onApply={() => {
                        fetchStats()
                      }}
                    />
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>


        </div>

      </SidebarInset>

    </SidebarProvider>
  )
}