"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  Syringe,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Activity,
  Stethoscope,
  Pill,
  Heart,
  Scissors,
  User,
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

interface Cattle {
  id: string;
  tagNumber: string;
  name: string | null;
  breed: string;
  category: string;
}

interface HealthRecord {
  id: string;
  cattleId: string;
  cattle: Cattle;
  recordType: string;
  vaccinationType: string | null;
  description: string;
  scheduledDate: string;
  completedDate: string | null;
  status: string;
  veterinarian: string | null;
  cost: number | null;
  notes: string | null;
}

export default function HealthManagementPage() {
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [cattle, setCattle] = useState<Cattle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [formData, setFormData] = useState({
    cattleId: '',
    recordType: 'VACCINATION',
    vaccinationType: '',
    description: '',
    scheduledDate: new Date().toISOString().slice(0, 10),
    completedDate: '',
    status: 'PENDING',
    veterinarian: '',
    cost: '',
    notes: '',
  });

  useEffect(() => {
    fetchHealthRecords();
    fetchCattle();
  }, []);

  const fetchHealthRecords = async () => {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        const data = await response.json();
        setHealthRecords(data);
      }
    } catch (error) {
      console.error('Error fetching health records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCattle = async () => {
    try {
      const response = await fetch('/api/cattle');
      if (response.ok) {
        const data = await response.json();
        setCattle(data);
      }
    } catch (error) {
      console.error('Error fetching cattle:', error);
    }
  };

  const getDaysUntilDue = (scheduledDate: string): number => {
    const scheduled = new Date(scheduledDate);
    const today = new Date();
    const diffTime = scheduled.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case 'VACCINATION':
        return <Syringe className="h-4 w-4" />;
      case 'DEWORMING':
        return <Pill className="h-4 w-4" />;
      case 'CHECKUP':
        return <Stethoscope className="h-4 w-4" />;
      case 'TREATMENT':
        return <Heart className="h-4 w-4" />;
      case 'SURGERY':
        return <Scissors className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const filteredRecords = healthRecords.filter((record) => {
    const matchesSearch = 
      record.cattle.tagNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (record.cattle.name && record.cattle.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      record.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesType = typeFilter === 'all' || record.recordType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
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
      case 'cattle':
        aValue = (a.cattle.name || a.cattle.tagNumber).toLowerCase();
        bValue = (b.cattle.name || b.cattle.tagNumber).toLowerCase();
        break;
      case 'recordType':
        aValue = a.recordType;
        bValue = b.recordType;
        break;
      case 'description':
        aValue = a.description.toLowerCase();
        bValue = b.description.toLowerCase();
        break;
      case 'scheduledDate':
        aValue = new Date(a.scheduledDate).getTime();
        bValue = new Date(b.scheduledDate).getTime();
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'veterinarian':
        aValue = (a.veterinarian || '').toLowerCase();
        bValue = (b.veterinarian || '').toLowerCase();
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
    total: healthRecords.length,
    pending: healthRecords.filter(r => r.status === 'PENDING').length,
    overdue: healthRecords.filter(r => r.status === 'OVERDUE').length,
    completed: healthRecords.filter(r => r.status === 'COMPLETED').length,
    dueToday: healthRecords.filter(r => {
      const days = getDaysUntilDue(r.scheduledDate);
      return days === 0 && r.status === 'PENDING';
    }).length,
    dueThisWeek: healthRecords.filter(r => {
      const days = getDaysUntilDue(r.scheduledDate);
      return days <= 7 && days >= 0 && r.status === 'PENDING';
    }).length,
    totalCost: healthRecords.reduce((sum, r) => sum + (r.cost || 0), 0),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          vaccinationType: formData.vaccinationType || null,
          completedDate: formData.completedDate || null,
          veterinarian: formData.veterinarian || null,
          cost: formData.cost ? parseFloat(formData.cost) : null,
          notes: formData.notes || null,
        }),
      });

      if (response.ok) {
        await fetchHealthRecords();
        setShowAddModal(false);
        setFormData({
          cattleId: '',
          recordType: 'VACCINATION',
          vaccinationType: '',
          description: '',
          scheduledDate: new Date().toISOString().slice(0, 10),
          completedDate: '',
          status: 'PENDING',
          veterinarian: '',
          cost: '',
          notes: '',
        });
      }
    } catch (error) {
      console.error('Error creating health record:', error);
    }
  };

  const handleEdit = (record: HealthRecord) => {
    setSelectedRecord(record);
    setFormData({
      cattleId: record.cattleId,
      recordType: record.recordType,
      vaccinationType: record.vaccinationType || '',
      description: record.description,
      scheduledDate: new Date(record.scheduledDate).toISOString().slice(0, 10),
      completedDate: record.completedDate ? new Date(record.completedDate).toISOString().slice(0, 10) : '',
      status: record.status,
      veterinarian: record.veterinarian || '',
      cost: record.cost?.toString() || '',
      notes: record.notes || '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    
    try {
      const response = await fetch(`/api/health/${selectedRecord.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          vaccinationType: formData.vaccinationType || null,
          completedDate: formData.completedDate || null,
          veterinarian: formData.veterinarian || null,
          cost: formData.cost ? parseFloat(formData.cost) : null,
          notes: formData.notes || null,
        }),
      });

      if (response.ok) {
        await fetchHealthRecords();
        setShowEditModal(false);
        setSelectedRecord(null);
        setFormData({
          cattleId: '',
          recordType: 'VACCINATION',
          vaccinationType: '',
          description: '',
          scheduledDate: new Date().toISOString().slice(0, 10),
          completedDate: '',
          status: 'PENDING',
          veterinarian: '',
          cost: '',
          notes: '',
        });
      }
    } catch (error) {
      console.error('Error updating health record:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this health record?')) return;
    
    try {
      const response = await fetch(`/api/health/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchHealthRecords();
      }
    } catch (error) {
      console.error('Error deleting health record:', error);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const response = await fetch('/api/health/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        await fetchHealthRecords();
      }
    } catch (error) {
      console.error('Error completing health record:', error);
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
            <h1 className="text-base font-medium">Health Monitoring</h1>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <Button 
                onClick={() => setShowAddModal(true)} 
                className="cursor-pointer bg-chart-2 hover:bg-chart-2/90 text-white rounded-bl-md transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Record
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Card className="border-border bg-card shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 pt-2 px-2.5">
                <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                <div className="rounded-full bg-chart-4/10 p-1">
                  <Activity className="h-4 w-4 text-chart-4" />
                </div>
              </CardHeader>
              <CardContent className="px-2.5 pb-2 pt-0">
                <div className="text-xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">
                  {stats.completed} completed
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 pt-2 px-2.5">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-1">
                  <Clock className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent className="px-2.5 pb-2 pt-0">
                <div className="text-xl font-bold">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">
                  {stats.dueThisWeek} due this week
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 pt-2 px-2.5">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-1">
                  <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
                </div>
              </CardHeader>
              <CardContent className="px-2.5 pb-2 pt-0">
                <div className="text-xl font-bold">{stats.overdue}</div>
                <div className="text-xs text-muted-foreground">Requires attention</div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 pt-2 px-2.5">
                <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-1">
                  <Activity className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent className="px-2.5 pb-2 pt-0">
                <div className="text-xl font-bold">${stats.totalCost.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Health expenses</div>
              </CardContent>
            </Card>
          </div>

          {/* Health Records Table */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 border-b border-border">
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by tag, name, or description..."
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
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                >
                  <option value="all">All Types</option>
                  <option value="VACCINATION">Vaccination</option>
                  <option value="DEWORMING">Deworming</option>
                  <option value="CHECKUP">Checkup</option>
                  <option value="TREATMENT">Treatment</option>
                  <option value="SURGERY">Surgery</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <SortableHeader column="cattle">Cattle</SortableHeader>
                      <SortableHeader column="recordType">Record Type</SortableHeader>
                      <SortableHeader column="description">Description</SortableHeader>
                      <SortableHeader column="scheduledDate">Scheduled Date</SortableHeader>
                      <SortableHeader column="status">Status</SortableHeader>
                      <SortableHeader column="veterinarian">Veterinarian</SortableHeader>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRecords.map((record) => {
                      const daysUntilDue = getDaysUntilDue(record.scheduledDate);
                      const isOverdue = daysUntilDue < 0 && record.status === 'PENDING';
                      const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0 && record.status === 'PENDING';

                      return (
                        <tr key={record.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-foreground">
                                {record.cattle.name || 'Unnamed'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {record.cattle.tagNumber} • {record.cattle.breed}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {getRecordTypeIcon(record.recordType)}
                              <span className="text-sm text-foreground">{record.recordType}</span>
                              {record.vaccinationType && (
                                <span className="text-xs text-muted-foreground">
                                  ({record.vaccinationType})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-foreground">
                            {record.description}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className={`h-4 w-4 ${
                                isOverdue
                                  ? 'text-red-500 dark:text-red-400'
                                  : isDueSoon
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-muted-foreground'
                              }`} />
                              <span className={isOverdue ? 'text-red-500 dark:text-red-400 font-medium' : isDueSoon ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}>
                                {new Date(record.scheduledDate).toLocaleDateString()}
                              </span>
                            </div>
                            {isOverdue && (
                              <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                                {Math.abs(daysUntilDue)} days overdue
                              </div>
                            )}
                            {isDueSoon && daysUntilDue > 0 && (
                              <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                {daysUntilDue} days remaining
                              </div>
                            )}
                            {daysUntilDue === 0 && record.status === 'PENDING' && (
                              <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                Due today
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {record.status === 'PENDING' && (
                              <Badge className="bg-amber-500 text-white">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                            {record.status === 'COMPLETED' && (
                              <Badge className="bg-emerald-500 text-white">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                            {record.status === 'OVERDUE' && (
                              <Badge className="bg-red-500 text-white">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Overdue
                              </Badge>
                            )}
                            {record.status === 'CANCELLED' && (
                              <Badge className="bg-slate-500 text-white">
                                <XCircle className="h-3 w-3 mr-1" />
                                Cancelled
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-foreground">
                            {record.veterinarian || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              {record.status === 'PENDING' && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => handleComplete(record.id)}
                                  title="Mark as Completed"
                                >
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleEdit(record)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(record.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {sortedRecords.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No health records found matching your filters.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Add Record Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl p-6 max-w-2xl w-full shadow-2xl border border-border max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-foreground mb-4">Add Health Record</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Select Cattle *
                    </label>
                    <select
                      required
                      value={formData.cattleId}
                      onChange={(e) => setFormData({...formData, cattleId: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    >
                      <option value="">Choose a cattle...</option>
                      {cattle.map((cow) => (
                        <option key={cow.id} value={cow.id}>
                          {cow.tagNumber} {cow.name ? `(${cow.name})` : ''} - {cow.breed}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Record Type *
                    </label>
                    <select
                      required
                      value={formData.recordType}
                      onChange={(e) => setFormData({...formData, recordType: e.target.value, vaccinationType: ''})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    >
                      <option value="VACCINATION">Vaccination</option>
                      <option value="DEWORMING">Deworming</option>
                      <option value="CHECKUP">Checkup</option>
                      <option value="TREATMENT">Treatment</option>
                      <option value="SURGERY">Surgery</option>
                    </select>
                  </div>
                </div>

                {formData.recordType === 'VACCINATION' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Vaccination Type
                    </label>
                    <select
                      value={formData.vaccinationType}
                      onChange={(e) => setFormData({...formData, vaccinationType: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    >
                      <option value="">Select type...</option>
                      <option value="FMD">FMD (Foot and Mouth Disease)</option>
                      <option value="BRUCELLOSIS">Brucellosis</option>
                      <option value="ANTHRAX">Anthrax</option>
                      <option value="BLACKLEG">Blackleg</option>
                      <option value="RABIES">Rabies</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="e.g., Annual FMD vaccination"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Scheduled Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="OVERDUE">Overdue</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                {formData.status === 'COMPLETED' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Completed Date
                    </label>
                    <input
                      type="date"
                      value={formData.completedDate}
                      onChange={(e) => setFormData({...formData, completedDate: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Veterinarian
                    </label>
                    <input
                      type="text"
                      value={formData.veterinarian}
                      onChange={(e) => setFormData({...formData, veterinarian: e.target.value})}
                      placeholder="Veterinarian name"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Cost
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({...formData, cost: e.target.value})}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Any additional notes..."
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
                    Add Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Record Modal */}
        {showEditModal && selectedRecord && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl p-6 max-w-2xl w-full shadow-2xl border border-border max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-foreground mb-4">Edit Health Record</h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Select Cattle *
                    </label>
                    <select
                      required
                      value={formData.cattleId}
                      onChange={(e) => setFormData({...formData, cattleId: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    >
                      {cattle.map((cow) => (
                        <option key={cow.id} value={cow.id}>
                          {cow.tagNumber} {cow.name ? `(${cow.name})` : ''} - {cow.breed}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Record Type *
                    </label>
                    <select
                      required
                      value={formData.recordType}
                      onChange={(e) => setFormData({...formData, recordType: e.target.value, vaccinationType: e.target.value === 'VACCINATION' ? formData.vaccinationType : ''})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    >
                      <option value="VACCINATION">Vaccination</option>
                      <option value="DEWORMING">Deworming</option>
                      <option value="CHECKUP">Checkup</option>
                      <option value="TREATMENT">Treatment</option>
                      <option value="SURGERY">Surgery</option>
                    </select>
                  </div>
                </div>

                {formData.recordType === 'VACCINATION' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Vaccination Type
                    </label>
                    <select
                      value={formData.vaccinationType}
                      onChange={(e) => setFormData({...formData, vaccinationType: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    >
                      <option value="">Select type...</option>
                      <option value="FMD">FMD (Foot and Mouth Disease)</option>
                      <option value="BRUCELLOSIS">Brucellosis</option>
                      <option value="ANTHRAX">Anthrax</option>
                      <option value="BLACKLEG">Blackleg</option>
                      <option value="RABIES">Rabies</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="e.g., Annual FMD vaccination"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Scheduled Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="OVERDUE">Overdue</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                {formData.status === 'COMPLETED' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Completed Date
                    </label>
                    <input
                      type="date"
                      value={formData.completedDate}
                      onChange={(e) => setFormData({...formData, completedDate: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Veterinarian
                    </label>
                    <input
                      type="text"
                      value={formData.veterinarian}
                      onChange={(e) => setFormData({...formData, veterinarian: e.target.value})}
                      placeholder="Veterinarian name"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Cost
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({...formData, cost: e.target.value})}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Any additional notes..."
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedRecord(null);
                    }}
                    className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-chart-2 hover:bg-chart-2/90 text-white rounded-lg transition-colors"
                  >
                    Update Record
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

