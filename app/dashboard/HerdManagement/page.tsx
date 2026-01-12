"use client";

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Calendar,
  Droplet,
  Heart,
  Users,

  Edit,
  Trash2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Grid3x3,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';

interface HealthRecord {
  id: string;
  scheduledDate: string;
  recordType: string;
  status: string;
  description: string;
}

interface MilkRecord {
  id: string;
  liters: number;
  date: string;
}

interface Offspring {
  id: string;
  tagNumber: string;
  name: string | null;
}

interface Cattle {
  id: string;
  tagNumber: string;
  name: string | null;
  gender: string;
  breed: string;
  dateOfBirth: string;
  weight: number | null;
  imageUrl: string | null;
  status: string;
  category: string;
  motherId: string | null;
  offspring: Offspring[];
  healthRecords: HealthRecord[];
  milkRecords: MilkRecord[];
  _count: {
    offspring: number;
    milkRecords: number;
  };
}

export default function HerdManagementPage() {
  const [cattle, setCattle] = useState<Cattle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCattle, setSelectedCattle] = useState<Cattle | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [formData, setFormData] = useState({
    tagNumber: '',
    name: '',
    gender: 'FEMALE',
    breed: '',
    dateOfBirth: '',
    weight: '',
    imageUrl: '',
    status: 'ACTIVE',
    category: 'COW',
    motherId: '',
  });

  useEffect(() => {
    fetchCattle();
  }, []);

  const fetchCattle = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cattle');

      if (!response.ok) {
        let errorData;
        try {
          const text = await response.text();
          console.error('Error response text:', text);
          errorData = text ? JSON.parse(text) : { error: `HTTP ${response.status}` };
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorData = {
            error: `HTTP ${response.status}: ${response.statusText}`,
            details: 'Failed to parse error response'
          };
        }
        console.error('Error fetching cattle:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        });
        const errorMessage = errorData.error || errorData.details || `HTTP ${response.status} error`;
        alert(`Failed to fetch cattle: ${errorMessage}${errorData.code ? ` (Code: ${errorData.code})` : ''}`);
        setCattle([]);
        return;
      }

      const data = await response.json();
      console.log('Fetched cattle data:', data); // Debug log

      if (Array.isArray(data)) {
        setCattle(data);
      } else {
        console.error('Invalid data format:', data);
        setCattle([]);
      }
    } catch (error) {
      console.error('Error fetching cattle:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Network error: ${errorMessage}`);
      setCattle([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: string): number => {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getTotalMilkProduction = (milkRecords: MilkRecord[]): number => {
    if (!milkRecords || milkRecords.length === 0) return 0;
    return milkRecords.reduce((sum, record) => {
      const liters = Number(record.liters) || 0;
      return sum + (isNaN(liters) ? 0 : liters);
    }, 0);
  };

  const getAverageDailyMilk = (milkRecords: MilkRecord[]): number => {
    if (!milkRecords || milkRecords.length === 0) return 0;
    const total = getTotalMilkProduction(milkRecords);
    const avg = total / milkRecords.length;
    return isNaN(avg) ? 0 : avg;
  };

  const getNextMedicationDue = (healthRecords: HealthRecord[]): HealthRecord | null => {
    if (healthRecords.length === 0) return null;
    return healthRecords[0];
  };

  const getDaysUntilDue = (scheduledDate: string): number => {
    const scheduled = new Date(scheduledDate);
    const today = new Date();
    const diffTime = scheduled.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredCattle = cattle.filter((cow) => {
    const matchesSearch =
      cow.tagNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cow.name && cow.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      cow.breed.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cow.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || cow.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedCattle = [...filteredCattle].sort((a, b) => {
    if (!sortColumn) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortColumn) {
      case 'tag':
        aValue = a.tagNumber;
        bValue = b.tagNumber;
        break;
      case 'name':
        aValue = a.name || '';
        bValue = b.name || '';
        break;
      case 'breed':
        aValue = a.breed;
        bValue = b.breed;
        break;
      case 'age':
        aValue = new Date(a.dateOfBirth).getTime();
        bValue = new Date(b.dateOfBirth).getTime();
        break;
      case 'category':
        aValue = a.category;
        bValue = b.category;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'milk':
        aValue = getAverageDailyMilk(a.milkRecords);
        bValue = getAverageDailyMilk(b.milkRecords);
        break;
      case 'offspring':
        aValue = a._count.offspring;
        bValue = b._count.offspring;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortableHeader = ({ column, children }: { column: string; children: React.ReactNode }) => {
    const isSorted = sortColumn === column;
    return (
      <th
        className="text-left py-3 px-4 text-sm font-semibold text-foreground cursor-pointer hover:bg-muted/70 transition-colors select-none"
        onClick={() => handleSort(column)}
      >
        <div className="flex items-center gap-2">
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

  const stats = {
    total: cattle.length,
    active: cattle.filter(c => c.status === 'ACTIVE').length,
    females: cattle.filter(c => c.gender === 'FEMALE').length,
    males: cattle.filter(c => c.gender === 'MALE').length,
    totalOffspring: cattle.reduce((sum, c) => sum + c._count.offspring, 0),
    totalMilk: cattle.reduce((sum, c) => sum + getTotalMilkProduction(c.milkRecords), 0),
    medicationDue: cattle.filter(c => {
      const nextMed = getNextMedicationDue(c.healthRecords);
      if (!nextMed) return false;
      const days = getDaysUntilDue(nextMed.scheduledDate);
      return days <= 7 && days >= 0;
    }).length,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/cattle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          motherId: formData.motherId || null,
        }),
      });

      if (response.ok) {
        await fetchCattle();
        setShowAddModal(false);
        setFormData({
          tagNumber: '',
          name: '',
          gender: 'FEMALE',
          breed: '',
          dateOfBirth: '',
          weight: '',
          imageUrl: '',
          status: 'ACTIVE',
          category: 'COW',
          motherId: '',
        });
      }
    } catch (error) {
      console.error('Error creating cattle:', error);
    }
  };

  const handleEdit = (cow: Cattle) => {
    setSelectedCattle(cow);
    setFormData({
      tagNumber: cow.tagNumber,
      name: cow.name || '',
      gender: cow.gender,
      breed: cow.breed,
      dateOfBirth: cow.dateOfBirth.split('T')[0],
      weight: cow.weight?.toString() || '',
      imageUrl: cow.imageUrl || '',
      status: cow.status,
      category: cow.category,
      motherId: cow.motherId || '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCattle) return;

    try {
      const response = await fetch(`/api/cattle/${selectedCattle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          motherId: formData.motherId || null,
        }),
      });

      if (response.ok) {
        await fetchCattle();
        setShowEditModal(false);
        setSelectedCattle(null);
        setFormData({
          tagNumber: '',
          name: '',
          gender: 'FEMALE',
          breed: '',
          dateOfBirth: '',
          weight: '',
          imageUrl: '',
          status: 'ACTIVE',
          category: 'COW',
          motherId: '',
        });
      }
    } catch (error) {
      console.error('Error updating cattle:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cattle record?')) return;

    try {
      const response = await fetch(`/api/cattle/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCattle();
      }
    } catch (error) {
      console.error('Error deleting cattle:', error);
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-screen">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
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
            <h1 className="text-base font-medium">Herd Management</h1>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <Button
                onClick={() => setShowAddModal(true)}
                className="cursor-pointer bg-chart-2 hover:bg-chart-2/90 text-white rounded-bl-md transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Cattle
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Stats Overview - Compact */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Card className="border-border bg-card shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 pt-2 px-2.5">
                <CardTitle className="text-sm font-medium">Total Cattle</CardTitle>
                <div className="rounded-full bg-chart-2/10 p-1">
                  <Users className="h-4 w-4 text-chart-2" />
                </div>
              </CardHeader>
              <CardContent className="px-2.5 pb-2 pt-0">
                <div className="text-xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">
                  {stats.active} active
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 pt-2 px-2.5">
                <CardTitle className="text-sm font-medium">Females</CardTitle>
                <div className="rounded-full bg-pink-100 dark:bg-pink-900/30 p-1">
                  <Heart className="h-4 w-4 text-pink-500 dark:text-pink-400" />
                </div>
              </CardHeader>
              <CardContent className="px-2.5 pb-2 pt-0">
                <div className="text-xl font-bold">{stats.females}</div>
                <div className="text-xs text-muted-foreground">
                  {stats.males} males
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 pt-2 px-2.5">
                <CardTitle className="text-sm font-medium">Total Offspring</CardTitle>
                <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-1">
                  <Users className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent className="px-2.5 pb-2 pt-0">
                <div className="text-xl font-bold">{stats.totalOffspring}</div>
                <div className="text-xs text-muted-foreground">Total calves</div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 pt-2 px-2.5">
                <CardTitle className="text-sm font-medium">Medication Due</CardTitle>
                <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-1">
                  <AlertCircle className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent className="px-2.5 pb-2 pt-0">
                <div className="text-xl font-bold">{stats.medicationDue}</div>
                <div className="text-xs text-muted-foreground">Next 7 days</div>
              </CardContent>
            </Card>
          </div>

          {/* Cattle Table/Grid View */}
          {viewMode === 'table' ? (
            <Card className="shadow-sm">
              <CardHeader className="pb-2 border-b border-border">
                <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search by tag, name, or breed..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                  >
                    <option value="all">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SOLD">Sold</option>
                    <option value="DECEASED">Deceased</option>
                    <option value="QUARANTINED">Quarantined</option>
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                  >
                    <option value="all">All Categories</option>
                    <option value="BULL">Bull</option>
                    <option value="COW">Cow</option>
                    <option value="HEIFER">Heifer</option>
                    <option value="CALF">Calf</option>
                    <option value="STEER">Steer</option>
                  </select>

                  <div className="flex gap-2 border border-border rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('table')}
                      className="p-2 rounded transition-colors bg-chart-2 text-white"
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className="p-2 rounded transition-colors text-muted-foreground hover:bg-muted"
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-foreground w-12"></th>
                        <SortableHeader column="tag">Tag / Name</SortableHeader>
                        <SortableHeader column="breed">Breed</SortableHeader>
                        <SortableHeader column="age">Age</SortableHeader>
                        <SortableHeader column="category">Category</SortableHeader>
                        <SortableHeader column="status">Status</SortableHeader>
                        <SortableHeader column="milk">Milk (L/day)</SortableHeader>
                        <SortableHeader column="offspring">Offspring</SortableHeader>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Medication</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedCattle.map((cow) => {
                        const age = calculateAge(cow.dateOfBirth);
                        const avgMilk = getAverageDailyMilk(cow.milkRecords);
                        const totalMilk = getTotalMilkProduction(cow.milkRecords);
                        const nextMed = getNextMedicationDue(cow.healthRecords);
                        const daysUntilDue = nextMed ? getDaysUntilDue(nextMed.scheduledDate) : null;
                        const offspringCount = cow._count.offspring;
                        const isExpanded = expandedRows.has(cow.id);

                        return (
                          <React.Fragment key={cow.id}>
                            <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                              <td className="py-3 px-4">
                                <button
                                  onClick={() => {
                                    const newExpanded = new Set(expandedRows);
                                    if (isExpanded) {
                                      newExpanded.delete(cow.id);
                                    } else {
                                      newExpanded.add(cow.id);
                                    }
                                    setExpandedRows(newExpanded);
                                  }}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </button>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={cow.imageUrl || "/cow_image_1.webp"}
                                    alt={cow.name || cow.tagNumber}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                  <div>
                                    <div className="font-medium text-foreground">
                                      {cow.name || 'Unnamed'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {cow.tagNumber}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-foreground">{cow.breed}</td>
                              <td className="py-3 px-4 text-sm text-foreground">{age} years</td>
                              <td className="py-3 px-4">
                                <Badge variant="outline" className="text-xs">
                                  {cow.category}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <Badge
                                  className={
                                    cow.status === 'ACTIVE'
                                      ? 'bg-emerald-500 text-white'
                                      : cow.status === 'QUARANTINED'
                                        ? 'bg-amber-500 text-white'
                                        : cow.status === 'SOLD'
                                          ? 'bg-blue-500 text-white'
                                          : 'bg-slate-500 text-white'
                                  }
                                >
                                  {cow.status}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                {cow.gender === 'FEMALE' ? (
                                  <div className="flex items-center gap-1 text-sm">
                                    <Droplet className="h-3.5 w-3.5 text-chart-2" />
                                    <span className="font-medium">{(isNaN(avgMilk) ? 0 : avgMilk).toFixed(1)}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1 text-sm">
                                  <Users className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                                  <span>{offspringCount}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {nextMed ? (
                                  <div className="flex items-center gap-1">
                                    <Calendar className={`h-3.5 w-3.5 ${daysUntilDue !== null && daysUntilDue < 0
                                      ? 'text-red-500'
                                      : daysUntilDue !== null && daysUntilDue <= 7
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-muted-foreground'
                                      }`} />
                                    <span className={`text-xs ${daysUntilDue !== null && daysUntilDue < 0
                                      ? 'text-red-500 font-medium'
                                      : daysUntilDue !== null && daysUntilDue <= 7
                                        ? 'text-amber-500 dark:text-amber-400 font-medium'
                                        : 'text-muted-foreground'
                                      }`}>
                                      {daysUntilDue !== null && daysUntilDue < 0
                                        ? `${Math.abs(daysUntilDue)}d overdue`
                                        : daysUntilDue !== null && daysUntilDue === 0
                                          ? 'Today'
                                          : daysUntilDue !== null
                                            ? `${daysUntilDue}d`
                                            : 'None'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-xs">None</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => handleEdit(cow)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => handleDelete(cow.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-muted/20">
                                <td colSpan={10} className="py-4 px-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <div className="text-muted-foreground mb-1">Weight</div>
                                      <div className="font-medium">
                                        {cow.weight ? `${cow.weight} kg` : 'Not recorded'}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-muted-foreground mb-1">Gender</div>
                                      <div className="font-medium">{cow.gender}</div>
                                    </div>
                                    {cow.gender === 'FEMALE' && (
                                      <div>
                                        <div className="text-muted-foreground mb-1">Total Milk</div>
                                        <div className="font-medium">
                                          {(isNaN(totalMilk) ? 0 : totalMilk).toFixed(1)} L
                                        </div>
                                      </div>
                                    )}
                                    {nextMed && (
                                      <div>
                                        <div className="text-muted-foreground mb-1">Next Medication</div>
                                        <div className="font-medium text-xs">
                                          {nextMed.recordType}: {nextMed.description}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {new Date(nextMed.scheduledDate).toLocaleDateString()}
                                        </div>
                                      </div>
                                    )}
                                    {offspringCount > 0 && (
                                      <div className="md:col-span-2 lg:col-span-4">
                                        <div className="text-muted-foreground mb-2">Offspring</div>
                                        <div className="flex flex-wrap gap-2">
                                          {cow.offspring.map((child) => (
                                            <Badge key={child.id} variant="outline" className="text-xs">
                                              {child.tagNumber} {child.name ? `(${child.name})` : ''}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="shadow-sm">
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search by tag, name, or breed..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    >
                      <option value="all">All Status</option>
                      <option value="ACTIVE">Active</option>
                      <option value="SOLD">Sold</option>
                      <option value="DECEASED">Deceased</option>
                      <option value="QUARANTINED">Quarantined</option>
                    </select>

                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    >
                      <option value="all">All Categories</option>
                      <option value="BULL">Bull</option>
                      <option value="COW">Cow</option>
                      <option value="HEIFER">Heifer</option>
                      <option value="CALF">Calf</option>
                      <option value="STEER">Steer</option>
                    </select>

                    <div className="flex gap-2 border border-border rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('table')}
                        className="p-2 rounded transition-colors text-muted-foreground hover:bg-muted"
                      >
                        <List className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className="p-2 rounded transition-colors bg-chart-2 text-white"
                      >
                        <Grid3x3 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedCattle.map((cow) => {
                  const age = calculateAge(cow.dateOfBirth);
                  const totalMilk = getTotalMilkProduction(cow.milkRecords);
                  const avgMilk = getAverageDailyMilk(cow.milkRecords);
                  const nextMed = getNextMedicationDue(cow.healthRecords);
                  const daysUntilDue = nextMed ? getDaysUntilDue(nextMed.scheduledDate) : null;
                  const offspringCount = cow._count.offspring;

                  return (
                    <Card
                      key={cow.id}
                      className="border-border bg-card shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
                    >
                      <div className="relative">
                        <img
                          src={cow.imageUrl || "/cow_image_1.webp"}
                          alt={cow.name || cow.tagNumber}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 bg-background/90 hover:bg-background"
                            onClick={() => handleEdit(cow)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 bg-background/90 hover:bg-background"
                            onClick={() => handleDelete(cow.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="absolute top-2 left-2">
                          <Badge
                            className={
                              cow.status === 'ACTIVE'
                                ? 'bg-emerald-500 text-white'
                                : cow.status === 'QUARANTINED'
                                  ? 'bg-amber-500 text-white'
                                  : cow.status === 'SOLD'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-slate-500 text-white'
                            }
                          >
                            {cow.status}
                          </Badge>
                        </div>
                      </div>

                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {cow.name || 'Unnamed'}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {cow.tagNumber} • {cow.breed}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Age:</span>
                            <span className="ml-2 font-medium">{age} years</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Category:</span>
                            <span className="ml-2 font-medium">{cow.category}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Gender:</span>
                            <span className="ml-2 font-medium">{cow.gender}</span>
                          </div>
                          {cow.weight && (
                            <div>
                              <span className="text-muted-foreground">Weight:</span>
                              <span className="ml-2 font-medium">{cow.weight} kg</span>
                            </div>
                          )}
                        </div>

                        {cow.gender === 'FEMALE' && (
                          <div className="pt-2 border-t border-border">
                            <div className="flex items-center gap-2 text-sm">
                              <Droplet className="h-4 w-4 text-chart-2" />
                              <span className="text-muted-foreground">Milk Production:</span>
                              <span className="font-medium">
                                {(isNaN(avgMilk) ? 0 : avgMilk).toFixed(1)} L/day avg
                              </span>
                            </div>
                            {totalMilk > 0 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Total: {(isNaN(totalMilk) ? 0 : totalMilk).toFixed(1)} L
                              </div>
                            )}
                          </div>
                        )}

                        <div className="pt-2 border-t border-border space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                            <span className="text-muted-foreground">Offspring:</span>
                            <span className="font-medium">{offspringCount}</span>
                          </div>

                          {nextMed && (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                              <span className="text-muted-foreground">Medication:</span>
                              <span
                                className={`font-medium ${daysUntilDue !== null && daysUntilDue < 0
                                  ? 'text-red-500'
                                  : daysUntilDue !== null && daysUntilDue <= 7
                                    ? 'text-amber-500 dark:text-amber-400'
                                    : 'text-foreground'
                                  }`}
                              >
                                {daysUntilDue !== null && daysUntilDue < 0
                                  ? `${Math.abs(daysUntilDue)} days overdue`
                                  : daysUntilDue !== null && daysUntilDue === 0
                                    ? 'Due today'
                                    : daysUntilDue !== null
                                      ? `Due in ${daysUntilDue} days`
                                      : 'No upcoming'}
                              </span>
                            </div>
                          )}
                          {nextMed && (
                            <div className="text-xs text-muted-foreground">
                              {nextMed.recordType}: {nextMed.description}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {sortedCattle.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No cattle found matching your filters.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit Cattle Modal */}
        {showEditModal && selectedCattle && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl p-6 max-w-2xl w-full shadow-2xl border border-border max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Edit Cattle
              </h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Tag Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.tagNumber}
                      onChange={(e) => setFormData({ ...formData, tagNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Gender *
                    </label>
                    <select
                      required
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    >
                      <option value="FEMALE">Female</option>
                      <option value="MALE">Male</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Category *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    >
                      <option value="COW">Cow</option>
                      <option value="BULL">Bull</option>
                      <option value="HEIFER">Heifer</option>
                      <option value="CALF">Calf</option>
                      <option value="STEER">Steer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Breed *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    placeholder="e.g., Holstein, Jersey, Angus"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      placeholder="0.0"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="SOLD">Sold</option>
                      <option value="DECEASED">Deceased</option>
                      <option value="QUARANTINED">Quarantined</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Mother (Tag Number)
                    </label>
                    <select
                      value={formData.motherId}
                      onChange={(e) => setFormData({ ...formData, motherId: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    >
                      <option value="">None</option>
                      {cattle
                        .filter(c => c.gender === 'FEMALE' && c.id !== selectedCattle.id)
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            {c.tagNumber} {c.name ? `(${c.name})` : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedCattle(null);
                    }}
                    className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-chart-2 hover:bg-chart-2/90 text-white rounded-lg transition-colors"
                  >
                    Update Cattle
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Cattle Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl p-6 max-w-2xl w-full shadow-2xl border border-border max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Add New Cattle
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Tag Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.tagNumber}
                      onChange={(e) => setFormData({ ...formData, tagNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Gender *
                    </label>
                    <select
                      required
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    >
                      <option value="FEMALE">Female</option>
                      <option value="MALE">Male</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Category *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    >
                      <option value="COW">Cow</option>
                      <option value="BULL">Bull</option>
                      <option value="HEIFER">Heifer</option>
                      <option value="CALF">Calf</option>
                      <option value="STEER">Steer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Breed *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    placeholder="e.g., Holstein, Jersey, Angus"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      placeholder="0.0"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="SOLD">Sold</option>
                      <option value="DECEASED">Deceased</option>
                      <option value="QUARANTINED">Quarantined</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Mother (Tag Number)
                    </label>
                    <select
                      value={formData.motherId}
                      onChange={(e) => setFormData({ ...formData, motherId: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    >
                      <option value="">None</option>
                      {cattle
                        .filter(c => c.gender === 'FEMALE')
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            {c.tagNumber} {c.name ? `(${c.name})` : ''}
                          </option>
                        ))}
                    </select>
                  </div>
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
                    Add Cattle
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}

