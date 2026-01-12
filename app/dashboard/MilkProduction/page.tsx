"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Award, Calendar, Droplet, Plus, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/theme-toggle';
import DateRangePicker from "@/components/ui/date-range-picker";
import { ChartContainer } from "@/components/ui/chart";

interface MilkRecord {
  id: string;
  cattleId: string | null;
  date: string;
  liters: number;
  session: string;
  quality: string;
  notes: string | null;
  cattle: {
    id: string;
    tagNumber: string;
    name: string | null;
    category: string;
  } | null;
}

interface Cattle {
  id: string;
  tagNumber: string;
  name: string | null;
  category: string;
}

export default function MilkProductionPage() {
  const [view, setView] = useState('daily');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [milkRecords, setMilkRecords] = useState<MilkRecord[]>([]);
  const [cattle, setCattle] = useState<Cattle[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchCattle();
    fetchMilkRecords();
  }, []);

  const fetchCattle = async () => {
    try {
      const response = await fetch('/api/cattle');
      if (response.ok) {
        const data = await response.json();
        // Filter only cows
        const cows = data.filter((c: any) => c.category === 'COW' && c.status === 'ACTIVE');
        setCattle(cows);
      }
    } catch (error) {
      console.error('Error fetching cattle:', error);
    }
  };

  const fetchMilkRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange.start && dateRange.end) {
        params.append('startDate', dateRange.start);
        params.append('endDate', dateRange.end);
      } else if (view === 'monthly') {
        const start = new Date();
        start.setMonth(start.getMonth() - 5);
        start.setDate(1);
        params.append('startDate', start.toISOString().slice(0, 10));
      } else if (view === 'weekly') {
        const start = new Date();
        start.setDate(start.getDate() - 27);
        params.append('startDate', start.toISOString().slice(0, 10));
      }

      if (selectedSession !== 'all') {
        params.append('session', selectedSession);
      }
      const response = await fetch(`/api/milk?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMilkRecords(data);
      }
    } catch (error) {
      console.error('Error fetching milk records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilkRecords();
  }, [dateRange, selectedSession, view]);

  const [formData, setFormData] = useState({
    cattleId: '',
    date: new Date().toISOString().slice(0, 10),
    liters: '',
    session: 'MORNING',
    quality: 'GOOD',
    notes: ''
  });

  // Generate chart data from milk records
  const generateChartData = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);

    if (dateRange.start && dateRange.end) {
      startDate = new Date(dateRange.start);
      endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // End of day
    } else {
      switch (view) {
        case 'daily':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 6);
          startDate.setHours(0, 0, 0, 0); // Start of day
          break;
        case 'weekly':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 27); // 4 weeks
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 5); // 6 months
          startDate.setDate(1); // Start of month
          startDate.setHours(0, 0, 0, 0);
          break;
        default:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 6);
          startDate.setHours(0, 0, 0, 0);
      }
    }

    const chartData: { period: string; liters: number }[] = [];
    const periodMap = new Map<string, number>();

    // Sort milk records to ensure chronology
    const sortedRecords = [...milkRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Determine the relevant records for the current view
    const filteredRecords = sortedRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= endDate;
    });

    // Pre-fill periods to ensure no gaps
    const current = new Date(startDate);

    // Safety check to prevent infinite loops
    let iterations = 0;
    while (current <= endDate && iterations < 500) {
      iterations++;
      let period: string;
      if (view === 'daily') {
        period = current.toLocaleDateString('en-US', { weekday: 'short' });
        current.setDate(current.getDate() + 1);
      } else if (view === 'weekly') {
        const diffTime = Math.abs(current.getTime() - startDate.getTime());
        const weekNum = Math.ceil((diffTime / (1000 * 60 * 60 * 24) + 1) / 7);
        period = `W${weekNum}`;
        current.setDate(current.getDate() + 7);
      } else {
        period = current.toLocaleDateString('en-US', { month: 'short' });
        current.setMonth(current.getMonth() + 1);
      }
      if (!periodMap.has(period)) {
        periodMap.set(period, 0);
      }
    }

    filteredRecords.forEach((record) => {
      const recordDate = new Date(record.date);
      let period: string;
      if (view === 'daily') {
        period = recordDate.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (view === 'weekly') {
        const diffTime = Math.abs(recordDate.getTime() - startDate.getTime());
        const weekNum = Math.ceil((diffTime / (1000 * 60 * 60 * 24) + 1) / 7);
        period = `W${weekNum}`;
      } else {
        period = recordDate.toLocaleDateString('en-US', { month: 'short' });
      }

      if (periodMap.has(period)) {
        periodMap.set(period, periodMap.get(period)! + record.liters);
      }
    });

    periodMap.forEach((liters, period) => {
      chartData.push({ period, liters });
    });

    const sortedData = chartData;

    // Calculate trends for each period
    return sortedData.map((item, index) => {
      let trend = 0;
      if (index > 0) {
        const currentLiters = Number(item.liters) || 0;
        const previousLiters = Number(sortedData[index - 1].liters) || 0;
        if (previousLiters > 0 && !isNaN(currentLiters) && !isNaN(previousLiters)) {
          trend = ((currentLiters - previousLiters) / previousLiters) * 100;
          // Clamp to reasonable values to avoid Infinity
          if (!isFinite(trend)) {
            trend = previousLiters === 0 && currentLiters > 0 ? 100 : 0;
          }
          // Clamp to -100% to 1000% to avoid extreme values
          trend = Math.max(-100, Math.min(1000, trend));
        }
      }
      return { ...item, trend: isNaN(trend) ? 0 : trend };
    });
  };

  const currentData = generateChartData();
  const totalProduction = currentData.reduce((sum, item) => {
    const liters = Number(item.liters) || 0;
    return sum + (isNaN(liters) ? 0 : liters);
  }, 0);
  const avgProduction = currentData.length > 0 ? (totalProduction / currentData.length) : 0;
  const safeAvgProduction = isNaN(avgProduction) ? 0 : avgProduction;

  // Calculate overall trend (compare last period with previous period)
  const calculateOverallTrend = (): number => {
    if (currentData.length < 2) return 0;
    const lastPeriod = Number(currentData[currentData.length - 1]?.liters) || 0;
    const previousPeriod = Number(currentData[currentData.length - 2]?.liters) || 0;

    // Safety checks
    if (isNaN(lastPeriod) || isNaN(previousPeriod) || !isFinite(lastPeriod) || !isFinite(previousPeriod)) {
      return 0;
    }

    if (previousPeriod === 0) {
      // If previous was 0 and current is > 0, show 100% increase, otherwise 0
      return lastPeriod > 0 ? 100 : 0;
    }

    const trend = ((lastPeriod - previousPeriod) / previousPeriod) * 100;

    // Clamp to reasonable values to avoid Infinity
    if (!isFinite(trend) || isNaN(trend)) {
      return 0;
    }

    // Clamp extreme values
    return Math.max(-100, Math.min(1000, trend));
  };

  const overallTrend = calculateOverallTrend();
  const safeOverallTrend = isNaN(overallTrend) ? 0 : overallTrend;

  const filteredRecords = milkRecords.filter(record => {
    const cattleName = record.cattle?.name || '';
    const tagNumber = record.cattle?.tagNumber || '';
    const matchesSearch = cattleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tagNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSession = selectedSession === 'all' || record.session === selectedSession;
    return matchesSearch && matchesSession;
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (!sortColumn) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortColumn) {
      case 'cow':
        aValue = (a.cattle?.name || a.cattle?.tagNumber || '').toLowerCase();
        bValue = (b.cattle?.name || b.cattle?.tagNumber || '').toLowerCase();
        break;
      case 'tag':
        aValue = (a.cattle?.tagNumber || '').toLowerCase();
        bValue = (b.cattle?.tagNumber || '').toLowerCase();
        break;
      case 'date':
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
        break;
      case 'session':
        aValue = a.session;
        bValue = b.session;
        break;
      case 'liters':
        aValue = a.liters;
        bValue = b.liters;
        break;
      case 'quality':
        aValue = a.quality;
        bValue = b.quality;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortableHeader = ({ column, children, align = 'left' }: { column: string; children: React.ReactNode; align?: 'left' | 'right' }) => {
    const isSorted = sortColumn === column;
    return (
      <th
        className={`${align === 'right' ? 'text-right' : 'text-left'} py-3 px-2 text-sm font-semibold text-foreground cursor-pointer hover:bg-muted/70 transition-colors select-none`}
        onClick={() => handleSort(column)}
      >
        <div className={`flex items-center gap-2 ${align === 'right' ? 'justify-end' : ''}`}>
          {children}
          {isSorted ? (
            sortDirection === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )
          ) : (
            <ArrowUpDown className="h-4 w-4 text-muted-foreground opacity-50" />
          )}
        </div>
      </th>
    );
  };

  // Calculate top performers from actual data
  const calculateTopPerformers = () => {
    const cowStats = new Map<string, {
      total: number;
      count: number;
      tagNumber: string;
      name: string;
      recentTotal: number;
      recentCount: number;
      previousTotal: number;
      previousCount: number;
    }>();

    const now = new Date();
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);

    milkRecords.forEach((record) => {
      if (record.cattle) {
        const cowId = record.cattle.id;
        const recordDate = new Date(record.date);
        const existing = cowStats.get(cowId) || {
          total: 0,
          count: 0,
          tagNumber: record.cattle.tagNumber,
          name: record.cattle.name || '',
          recentTotal: 0,
          recentCount: 0,
          previousTotal: 0,
          previousCount: 0
        };
        const liters = Number(record.liters) || 0;
        if (!isNaN(liters)) {
          existing.total += liters;
          existing.count += 1;

          // Separate recent (last week) and previous (week before) for trend calculation
          if (recordDate >= oneWeekAgo) {
            existing.recentTotal += liters;
            existing.recentCount += 1;
          } else if (recordDate >= twoWeeksAgo && recordDate < oneWeekAgo) {
            existing.previousTotal += liters;
            existing.previousCount += 1;
          }
        }
        cowStats.set(cowId, existing);
      }
    });

    return Array.from(cowStats.entries())
      .map(([id, stats]) => {
        const avgDaily = stats.count > 0 ? (stats.total / stats.count) : 0;

        // Calculate trend: compare recent week vs previous week
        let trend = 0;
        const recentAvg = stats.recentCount > 0 ? (stats.recentTotal / stats.recentCount) : 0;
        const previousAvg = stats.previousCount > 0 ? (stats.previousTotal / stats.previousCount) : 0;

        if (previousAvg > 0 && !isNaN(recentAvg) && !isNaN(previousAvg)) {
          trend = ((recentAvg - previousAvg) / previousAvg) * 100;
          // Clamp to reasonable values
          if (!isFinite(trend)) {
            trend = previousAvg === 0 && recentAvg > 0 ? 100 : 0;
          }
          trend = Math.max(-100, Math.min(1000, trend));
        }

        return {
          id,
          tagNumber: stats.tagNumber,
          name: stats.name,
          avgDaily: isNaN(avgDaily) ? 0 : avgDaily,
          total: isNaN(stats.total) ? 0 : stats.total,
          trend: isNaN(trend) ? 0 : trend,
        };
      })
      .sort((a, b) => b.avgDaily - a.avgDaily)
      .slice(0, 5);
  };

  const topPerformers = calculateTopPerformers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/milk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cattleId: formData.cattleId || null,
          date: formData.date,
          liters: formData.liters,
          session: formData.session,
          quality: formData.quality,
          notes: formData.notes || null,
        }),
      });

      if (response.ok) {
        await fetchMilkRecords();
        setShowAddModal(false);
        setFormData({
          cattleId: '',
          date: new Date().toISOString().slice(0, 10),
          liters: '',
          session: 'MORNING',
          quality: 'GOOD',
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error creating milk record:', error);
    }
  };

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
            <h1 className="text-base font-medium">Milk Production</h1>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <Button onClick={() => setShowAddModal(true)} className="cursor-pointer bg-chart-2 hover:bg-chart-2/90 text-white rounded-bl-md transition-colors">
                <Plus className="h-4 w-4" />
                Record Collection
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Global Filter Toolbar */}
          {/* Global Filter Toolbar */}
          {/* Header & Stats Overview (cards) */}

          {/* Header & Stats Overview (cards) */}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Card className="border-border bg-card shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Production</CardTitle>
                <div className="rounded-full bg-chart-2/10 p-1.5">
                  <Droplet className="h-3.5 w-3.5 text-chart-2" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xl font-bold">{totalProduction.toLocaleString()} L</div>
                <div className="text-xs text-muted-foreground">{view === 'daily' ? 'Last 7 days' : view === 'weekly' ? 'Last 4 weeks' : 'Last 5 months'}</div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Per Period</CardTitle>
                <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-1.5">
                  <Calendar className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xl font-bold">{safeAvgProduction.toFixed(1)} L</div>
                <div className="text-xs text-muted-foreground">Per {view === 'daily' ? 'day' : view === 'weekly' ? 'week' : 'month'}</div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Trend</CardTitle>
                <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-1.5">
                  {safeOverallTrend >= 0 ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> : <TrendingDown className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className={`text-xl font-bold ${safeOverallTrend >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>{safeOverallTrend >= 0 ? '+' : ''}{safeOverallTrend.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">vs previous period</div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Producer</CardTitle>
                <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-1.5">
                  <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xl font-bold">
                  {topPerformers.length > 0 ? topPerformers[0].name : 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {topPerformers.length > 0 ? `${topPerformers[0].avgDaily.toFixed(1)} L/day average` : 'No data'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Chart */}
          <Card className="shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle>Production Trends</CardTitle>
                  <CardDescription>Milk collection over time</CardDescription>
                </div>
                <div className="flex gap-1">
                  {['daily', 'weekly', 'monthly'].map((v) => (
                    <Button
                      key={v}
                      variant={view === v ? "default" : "outline"}
                      size="sm"
                      onClick={() => setView(v)}
                      className="capitalize"
                    >
                      {v}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="h-80">
                <svg className="w-full h-full" viewBox="0 0 800 300">
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <line
                      key={i}
                      x1="80"
                      y1={60 + i * 50}
                      x2="780"
                      y2={60 + i * 50}
                      stroke="currentColor"
                      className="text-border"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Bars */}
                  {currentData.map((item: any, i: number) => {
                    const maxLiters = currentData.length > 0
                      ? Math.max(...currentData.map((d: any) => Number(d.liters) || 0))
                      : 1;
                    const safeMaxLiters = maxLiters > 0 && isFinite(maxLiters) ? maxLiters : 1;
                    const itemLiters = Number(item.liters) || 0;
                    const safeItemLiters = isNaN(itemLiters) || !isFinite(itemLiters) ? 0 : itemLiters;
                    const barHeight = (safeItemLiters / safeMaxLiters) * 200;
                    const safeBarHeight = isNaN(barHeight) || !isFinite(barHeight) ? 0 : Math.max(0, barHeight);
                    const barWidth = currentData.length > 0 ? (600 / currentData.length - 20) : 50;
                    const x = 100 + (i * (currentData.length > 0 ? (600 / currentData.length) : 50));
                    const y = 260 - safeBarHeight;

                    return (
                      <g key={i}>
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          className="fill-chart-2 hover:fill-chart-2/90 transition-colors cursor-pointer"
                          rx="4"
                        />
                        <text
                          x={x + barWidth / 2}
                          y={y - 10}
                          textAnchor="middle"
                          className="text-xs font-semibold fill-foreground"
                        >
                          {safeItemLiters.toFixed(1)}L
                        </text>
                        <text
                          x={x + barWidth / 2}
                          y={280}
                          textAnchor="middle"
                          className="text-sm fill-muted-foreground"
                        >
                          {item.period}
                        </text>
                        {item.trend !== undefined && !isNaN(item.trend) && isFinite(item.trend) && (
                          <text
                            x={x + barWidth / 2}
                            y={y - 25}
                            textAnchor="middle"
                            className={`text-xs font-semibold ${item.trend >= 0 ? 'fill-emerald-600 dark:fill-emerald-400' : 'fill-red-600 dark:fill-red-400'}`}
                          >
                            {item.trend >= 0 ? '+' : ''}{item.trend.toFixed(1)}%
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Y-axis labels */}
                  {[0, 25, 50, 75, 100].map((percent: number, i: number) => (
                    <text
                      key={i}
                      x="70"
                      y={260 - (percent * 2)}
                      textAnchor="end"
                      className="text-xs fill-muted-foreground"
                    >
                      {Math.round((Math.max(...currentData.map((d: any) => d.liters)) * percent) / 100)}
                    </text>
                  ))}
                </svg>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex w-full items-center justify-between gap-2 text-sm">
                <div className="grid gap-2">
                  <div className="flex items-center gap-2 leading-none font-medium text-muted-foreground">
                    <Droplet className="h-4 w-4" />
                    <span>
                      {dateRange.start && dateRange.end ? `${dateRange.start} — ${dateRange.end}` : 'Select a date range'}
                    </span>
                  </div>
                </div>

                <DateRangePicker
                  start={dateRange.start}
                  end={dateRange.end}
                  onStartChange={(v) => setDateRange({ ...dateRange, start: v })}
                  onEndChange={(v) => setDateRange({ ...dateRange, end: v })}
                  label="Select Period"
                />
              </div>
            </CardFooter>
          </Card >

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Top Performers */}
            <Card className="lg:col-span-1 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
              <CardHeader>
                <CardTitle className="mb-0 flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  Top Performers
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {topPerformers.map((cow, index) => (
                    <div
                      key={cow.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0
                            ? "bg-amber-500 text-white"
                            : index === 1
                              ? "bg-muted text-foreground"
                              : index === 2
                                ? "bg-orange-600 text-white"
                                : "bg-muted text-foreground"
                            }`}
                        >
                          {index + 1}
                        </div>

                        <div>
                          <p className="font-semibold text-foreground">
                            {cow.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {cow.tagNumber}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-foreground">{cow.avgDaily.toFixed(1)} L</p>
                        {cow.trend !== undefined && !isNaN(cow.trend) && isFinite(cow.trend) && (
                          <p
                            className={`text-xs ${cow.trend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                              }`}
                          >
                            {cow.trend >= 0 ? "+" : ""}
                            {cow.trend.toFixed(1)}%
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Records */}
            <Card className="lg:col-span-2 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <CardTitle>Recent Collections</CardTitle>

                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                      />
                    </div>

                    <select
                      value={selectedSession}
                      onChange={(e) => setSelectedSession(e.target.value)}
                      className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    >
                      <option value="all">All Sessions</option>
                      <option value="MORNING">Morning</option>
                      <option value="AFTERNOON">Afternoon</option>
                      <option value="EVENING">Evening</option>
                    </select>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="overflow-auto max-h-96">
                  <table className="w-full">
                    <thead className="border-b border-border bg-muted/50 sticky">
                      <tr>
                        <SortableHeader column="cow">Cow</SortableHeader>
                        <SortableHeader column="tag">Tag</SortableHeader>
                        <SortableHeader column="date">Date</SortableHeader>
                        <SortableHeader column="session">Session</SortableHeader>
                        <SortableHeader column="liters" align="right">Liters</SortableHeader>
                        <SortableHeader column="quality">Quality</SortableHeader>
                      </tr>
                    </thead>

                    <tbody>
                      {sortedRecords.map((record) => (
                        <tr
                          key={record.id}
                          className="border-b border-border hover:bg-muted/30"
                        >
                          {/* Cow */}
                          <td className="py-3 px-2 text-sm text-foreground font-medium">
                            {record.cattle?.name || 'N/A'}
                          </td>

                          {/* Tag */}
                          <td className="py-3 px-2 text-sm text-foreground">
                            {record.cattle?.tagNumber || 'N/A'}
                          </td>

                          {/* Date */}
                          <td className="py-3 px-2 text-sm text-foreground">
                            {record.date}
                          </td>

                          {/* Session */}
                          <td className="py-3 px-2">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${record.session === "MORNING"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-100"
                                : record.session === "AFTERNOON"
                                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-100"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-100"
                                }`}
                            >
                              {record.session}
                            </span>
                          </td>


                          {/* Liters */}
                          <td className="py-3 px-2 text-sm font-semibold text-right text-foreground">
                            {record.liters} L
                          </td>

                          {/* Quality */}
                          <td className="py-3 px-2">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${record.quality === "EXCELLENT"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-100"
                                : record.quality === "GOOD"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-100"
                                  : record.quality === "FAIR"
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-100"
                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-100"
                                }`}
                            >
                              {record.quality}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>


          {/* Add Record Modal */}
          {
            showAddModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-card rounded-xl p-6 max-w-md w-full shadow-2xl border border-border">
                  <h3 className="text-xl font-semibold text-foreground mb-4">Record Milk Collection</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Select Cow
                      </label>
                      <select
                        required
                        value={formData.cattleId}
                        onChange={(e) => setFormData({ ...formData, cattleId: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                      >
                        <option value="">Choose a cow...</option>
                        {cattle.map((cow) => (
                          <option key={cow.id} value={cow.id}>
                            {cow.name || 'Unnamed'} ({cow.tagNumber})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Liters
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={formData.liters}
                          onChange={(e) => setFormData({ ...formData, liters: e.target.value })}
                          placeholder="0.0"
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Session
                        </label>
                        <select
                          value={formData.session}
                          onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                        >
                          <option value="MORNING">Morning</option>
                          <option value="AFTERNOON">Afternoon</option>
                          <option value="EVENING">Evening</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Quality
                        </label>
                        <select
                          value={formData.quality}
                          onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                        >
                          <option value="EXCELLENT">Excellent</option>
                          <option value="GOOD">Good</option>
                          <option value="FAIR">Fair</option>
                          <option value="POOR">Poor</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Any additional observations..."
                        rows={3}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground resize-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-chart-2 hover:bg-chart-2/90 text-white rounded-lg transition-colors"
                      >
                        Save Record
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )
          }
        </div >
      </SidebarInset >
    </SidebarProvider >
  );
}