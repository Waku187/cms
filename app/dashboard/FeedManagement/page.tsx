"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  Wheat,
  AlertTriangle,
  TrendingDown,
  Package,
  DollarSign,
  Edit,
  Trash2,
  ShoppingCart,
  Activity,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';

interface FeedRecord {
  id: string;
  date: string;
  quantityUsed: number;
  notes: string | null;
}

interface FeedInventory {
  id: string;
  feedType: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  cost: number | null;
  supplier: string | null;
  lastRestocked: string | null;
  expiryDate: string | null;
  feedRecords: FeedRecord[];
  _count: {
    feedRecords: number;
  };
}

export default function FeedManagementPage() {
  const [feedInventory, setFeedInventory] = useState<FeedInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState<FeedInventory | null>(null);
  const [formData, setFormData] = useState({
    feedType: 'HAY',
    quantity: '',
    unit: 'kg',
    minThreshold: '',
    cost: '',
    supplier: '',
    lastRestocked: new Date().toISOString().slice(0, 10),
    expiryDate: '',
  });
  const [usageData, setUsageData] = useState({
    inventoryId: '',
    date: new Date().toISOString().slice(0, 10),
    quantityUsed: '',
    notes: '',
  });
  const [restockData, setRestockData] = useState({
    inventoryId: '',
    quantityAdded: '',
    cost: '',
    supplier: '',
    expiryDate: '',
  });

  useEffect(() => {
    fetchFeedInventory();
  }, []);

  const fetchFeedInventory = async () => {
    try {
      const response = await fetch('/api/feed');
      if (response.ok) {
        const data = await response.json();
        setFeedInventory(data);
      }
    } catch (error) {
      console.error('Error fetching feed inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysUntilRestock = (feed: FeedInventory): number | null => {
    if (feed.feedRecords.length === 0) return null;
    
    // Calculate average daily usage from last 7 records
    const recentRecords = feed.feedRecords.slice(0, 7);
    const totalUsed = recentRecords.reduce((sum, record) => sum + record.quantityUsed, 0);
    const days = recentRecords.length;
    const avgDailyUsage = totalUsed / days;
    
    if (avgDailyUsage <= 0) return null;
    
    // Calculate days until quantity reaches minThreshold
    const remainingQuantity = feed.quantity - feed.minThreshold;
    const daysUntilRestock = Math.floor(remainingQuantity / avgDailyUsage);
    
    return daysUntilRestock;
  };

  const getStockStatus = (feed: FeedInventory): 'low' | 'good' | 'expired' => {
    if (feed.expiryDate) {
      const expiry = new Date(feed.expiryDate);
      const today = new Date();
      if (expiry < today) return 'expired';
    }
    
    if (feed.quantity <= feed.minThreshold) return 'low';
    return 'good';
  };

  const isExpiringSoon = (expiryDate: string | null): boolean => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const filteredFeed = feedInventory.filter((feed) => {
    const matchesSearch = 
      feed.feedType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (feed.supplier && feed.supplier.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'all' || feed.feedType === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    totalItems: feedInventory.length,
    lowStock: feedInventory.filter(f => getStockStatus(f) === 'low').length,
    expired: feedInventory.filter(f => getStockStatus(f) === 'expired').length,
    totalValue: feedInventory.reduce((sum, f) => sum + (f.cost ? f.cost * f.quantity : 0), 0),
    totalQuantity: feedInventory.reduce((sum, f) => sum + f.quantity, 0),
    expiringSoon: feedInventory.filter(f => isExpiringSoon(f.expiryDate)).length,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/feed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseFloat(formData.quantity),
          minThreshold: parseFloat(formData.minThreshold),
          cost: formData.cost ? parseFloat(formData.cost) : null,
          supplier: formData.supplier || null,
          lastRestocked: formData.lastRestocked || null,
          expiryDate: formData.expiryDate || null,
        }),
      });

      if (response.ok) {
        await fetchFeedInventory();
        setShowAddModal(false);
        setFormData({
          feedType: 'HAY',
          quantity: '',
          unit: 'kg',
          minThreshold: '',
          cost: '',
          supplier: '',
          lastRestocked: new Date().toISOString().slice(0, 10),
          expiryDate: '',
        });
      }
    } catch (error) {
      console.error('Error creating feed inventory:', error);
    }
  };

  const handleEdit = (feed: FeedInventory) => {
    setSelectedFeed(feed);
    setFormData({
      feedType: feed.feedType,
      quantity: feed.quantity.toString(),
      unit: feed.unit,
      minThreshold: feed.minThreshold.toString(),
      cost: feed.cost?.toString() || '',
      supplier: feed.supplier || '',
      lastRestocked: feed.lastRestocked ? new Date(feed.lastRestocked).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      expiryDate: feed.expiryDate ? new Date(feed.expiryDate).toISOString().slice(0, 10) : '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeed) return;
    
    try {
      const response = await fetch(`/api/feed/${selectedFeed.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseFloat(formData.quantity),
          minThreshold: parseFloat(formData.minThreshold),
          cost: formData.cost ? parseFloat(formData.cost) : null,
          supplier: formData.supplier || null,
          lastRestocked: formData.lastRestocked || null,
          expiryDate: formData.expiryDate || null,
        }),
      });

      if (response.ok) {
        await fetchFeedInventory();
        setShowEditModal(false);
        setSelectedFeed(null);
        setFormData({
          feedType: 'HAY',
          quantity: '',
          unit: 'kg',
          minThreshold: '',
          cost: '',
          supplier: '',
          lastRestocked: new Date().toISOString().slice(0, 10),
          expiryDate: '',
        });
      }
    } catch (error) {
      console.error('Error updating feed inventory:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feed inventory?')) return;
    
    try {
      const response = await fetch(`/api/feed/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchFeedInventory();
      }
    } catch (error) {
      console.error('Error deleting feed inventory:', error);
    }
  };

  const handleUsageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/feed/usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...usageData,
          quantityUsed: parseFloat(usageData.quantityUsed),
          notes: usageData.notes || null,
        }),
      });

      if (response.ok) {
        await fetchFeedInventory();
        setShowUsageModal(false);
        setUsageData({
          inventoryId: '',
          date: new Date().toISOString().slice(0, 10),
          quantityUsed: '',
          notes: '',
        });
      }
    } catch (error) {
      console.error('Error recording feed usage:', error);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/feed/restock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...restockData,
          quantityAdded: parseFloat(restockData.quantityAdded),
          cost: restockData.cost ? parseFloat(restockData.cost) : null,
          supplier: restockData.supplier || null,
          expiryDate: restockData.expiryDate || null,
        }),
      });

      if (response.ok) {
        await fetchFeedInventory();
        setShowRestockModal(false);
        setRestockData({
          inventoryId: '',
          quantityAdded: '',
          cost: '',
          supplier: '',
          expiryDate: '',
        });
      }
    } catch (error) {
      console.error('Error restocking feed:', error);
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
            <h1 className="text-base font-medium">Feed Management</h1>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <Button 
                onClick={() => setShowAddModal(true)} 
                className="cursor-pointer bg-chart-2 hover:bg-chart-2/90 text-white rounded-bl-md transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Feed
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Card className="border-border bg-card shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 pt-2 px-2.5">
                <CardTitle className="text-sm font-medium">Total Feed Types</CardTitle>
                <div className="rounded-full bg-chart-2/10 p-1">
                  <Package className="h-4 w-4 text-chart-2" />
                </div>
              </CardHeader>
              <CardContent className="px-2.5 pb-2 pt-0">
                <div className="text-xl font-bold">{stats.totalItems}</div>
                <div className="text-xs text-muted-foreground">
                  {stats.totalQuantity.toFixed(1)} kg total
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 pt-2 px-2.5">
                <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-1">
                  <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
                </div>
              </CardHeader>
              <CardContent className="px-2.5 pb-2 pt-0">
                <div className="text-xl font-bold">{stats.lowStock}</div>
                <div className="text-xs text-muted-foreground">Need restocking</div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 pt-2 px-2.5">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-1">
                  <DollarSign className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent className="px-2.5 pb-2 pt-0">
                <div className="text-xl font-bold">${stats.totalValue.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Inventory value</div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 pt-2 px-2.5">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-1">
                  <Clock className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                </div>
              </CardHeader>
              <CardContent className="px-2.5 pb-2 pt-0">
                <div className="text-xl font-bold">{stats.expiringSoon}</div>
                <div className="text-xs text-muted-foreground">Next 30 days</div>
              </CardContent>
            </Card>
          </div>

          {/* Feed Inventory Table */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 border-b border-border">
              <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by feed type or supplier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                  />
                </div>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                >
                  <option value="all">All Types</option>
                  <option value="HAY">Hay</option>
                  <option value="CONCENTRATE">Concentrate</option>
                  <option value="SILAGE">Silage</option>
                  <option value="MINERAL_SUPPLEMENT">Mineral Supplement</option>
                  <option value="GRAIN">Grain</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Feed Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Quantity</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Days Until Restock</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Expiry Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Supplier</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFeed.map((feed) => {
                      const status = getStockStatus(feed);
                      const daysUntilRestock = calculateDaysUntilRestock(feed);
                      const expiringSoon = isExpiringSoon(feed.expiryDate);

                      return (
                        <tr key={feed.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-medium text-foreground">{feed.feedType.replace('_', ' ')}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              <span className="font-semibold text-foreground">{feed.quantity.toFixed(1)}</span>
                              <span className="text-muted-foreground ml-1">{feed.unit}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Min: {feed.minThreshold} {feed.unit}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {status === 'low' && (
                              <Badge className="bg-red-500 text-white">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Low Stock
                              </Badge>
                            )}
                            {status === 'expired' && (
                              <Badge className="bg-red-600 text-white">
                                <XCircle className="h-3 w-3 mr-1" />
                                Expired
                              </Badge>
                            )}
                            {status === 'good' && (
                              <Badge className="bg-emerald-500 text-white">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Good
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {daysUntilRestock !== null ? (
                              <div className="flex items-center gap-1 text-sm">
                                {daysUntilRestock <= 7 ? (
                                  <AlertTriangle className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                                ) : (
                                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                )}
                                <span className={daysUntilRestock <= 7 ? 'text-red-500 dark:text-red-400 font-medium' : 'text-foreground'}>
                                  {daysUntilRestock} days
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">No usage data</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {feed.expiryDate ? (
                              <div className="text-sm">
                                <div className={expiringSoon ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-foreground'}>
                                  {new Date(feed.expiryDate).toLocaleDateString()}
                                </div>
                                {expiringSoon && (
                                  <div className="text-xs text-amber-600 dark:text-amber-400">Expiring soon</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">No expiry</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-foreground">
                            {feed.supplier || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => {
                                  setUsageData({ ...usageData, inventoryId: feed.id });
                                  setShowUsageModal(true);
                                }}
                                title="Record Usage"
                              >
                                <Activity className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => {
                                  setRestockData({ 
                                    ...restockData, 
                                    inventoryId: feed.id,
                                    supplier: feed.supplier || '',
                                    cost: feed.cost?.toString() || '',
                                  });
                                  setShowRestockModal(true);
                                }}
                                title="Restock"
                              >
                                <ShoppingCart className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleEdit(feed)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(feed.id)}
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

          {filteredFeed.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No feed inventory found matching your filters.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Add Feed Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl p-6 max-w-2xl w-full shadow-2xl border border-border max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-foreground mb-4">Add Feed Inventory</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Feed Type *
                    </label>
                    <select
                      required
                      value={formData.feedType}
                      onChange={(e) => setFormData({...formData, feedType: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    >
                      <option value="HAY">Hay</option>
                      <option value="CONCENTRATE">Concentrate</option>
                      <option value="SILAGE">Silage</option>
                      <option value="MINERAL_SUPPLEMENT">Mineral Supplement</option>
                      <option value="GRAIN">Grain</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Unit *
                    </label>
                    <select
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    >
                      <option value="kg">Kilograms (kg)</option>
                      <option value="tons">Tons</option>
                      <option value="bags">Bags</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      placeholder="0.0"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Minimum Threshold *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.minThreshold}
                      onChange={(e) => setFormData({...formData, minThreshold: e.target.value})}
                      placeholder="0.0"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Cost per Unit
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

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Supplier
                    </label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                      placeholder="Supplier name"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Last Restocked
                    </label>
                    <input
                      type="date"
                      value={formData.lastRestocked}
                      onChange={(e) => setFormData({...formData, lastRestocked: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
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
                    Add Feed
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Feed Modal */}
        {showEditModal && selectedFeed && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl p-6 max-w-2xl w-full shadow-2xl border border-border max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-foreground mb-4">Edit Feed Inventory</h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Feed Type *
                    </label>
                    <select
                      required
                      value={formData.feedType}
                      onChange={(e) => setFormData({...formData, feedType: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    >
                      <option value="HAY">Hay</option>
                      <option value="CONCENTRATE">Concentrate</option>
                      <option value="SILAGE">Silage</option>
                      <option value="MINERAL_SUPPLEMENT">Mineral Supplement</option>
                      <option value="GRAIN">Grain</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Unit *
                    </label>
                    <select
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    >
                      <option value="kg">Kilograms (kg)</option>
                      <option value="tons">Tons</option>
                      <option value="bags">Bags</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      placeholder="0.0"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Minimum Threshold *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formData.minThreshold}
                      onChange={(e) => setFormData({...formData, minThreshold: e.target.value})}
                      placeholder="0.0"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Cost per Unit
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

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Supplier
                    </label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                      placeholder="Supplier name"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Last Restocked
                    </label>
                    <input
                      type="date"
                      value={formData.lastRestocked}
                      onChange={(e) => setFormData({...formData, lastRestocked: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedFeed(null);
                    }}
                    className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-chart-2 hover:bg-chart-2/90 text-white rounded-lg transition-colors"
                  >
                    Update Feed
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Record Usage Modal */}
        {showUsageModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl p-6 max-w-md w-full shadow-2xl border border-border">
              <h3 className="text-xl font-semibold text-foreground mb-4">Record Feed Usage</h3>
              <form onSubmit={handleUsageSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Feed Type *
                  </label>
                  <select
                    required
                    value={usageData.inventoryId}
                    onChange={(e) => setUsageData({...usageData, inventoryId: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                  >
                    <option value="">Select feed type...</option>
                    {feedInventory.map((feed) => (
                      <option key={feed.id} value={feed.id}>
                        {feed.feedType.replace('_', ' ')} ({feed.quantity} {feed.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={usageData.date}
                      onChange={(e) => setUsageData({...usageData, date: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Quantity Used *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={usageData.quantityUsed}
                      onChange={(e) => setUsageData({...usageData, quantityUsed: e.target.value})}
                      placeholder="0.0"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={usageData.notes}
                    onChange={(e) => setUsageData({...usageData, notes: e.target.value})}
                    placeholder="Any additional notes..."
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUsageModal(false)}
                    className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-chart-2 hover:bg-chart-2/90 text-white rounded-lg transition-colors"
                  >
                    Record Usage
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Restock Modal */}
        {showRestockModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl p-6 max-w-md w-full shadow-2xl border border-border">
              <h3 className="text-xl font-semibold text-foreground mb-4">Restock Feed</h3>
              <form onSubmit={handleRestockSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Feed Type *
                  </label>
                  <select
                    required
                    value={restockData.inventoryId}
                    onChange={(e) => {
                      const selected = feedInventory.find(f => f.id === e.target.value);
                      setRestockData({
                        ...restockData,
                        inventoryId: e.target.value,
                        supplier: selected?.supplier || '',
                        cost: selected?.cost?.toString() || '',
                      });
                    }}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                  >
                    <option value="">Select feed type...</option>
                    {feedInventory.map((feed) => (
                      <option key={feed.id} value={feed.id}>
                        {feed.feedType.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Quantity to Add *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={restockData.quantityAdded}
                    onChange={(e) => setRestockData({...restockData, quantityAdded: e.target.value})}
                    placeholder="0.0"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Cost per Unit
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={restockData.cost}
                      onChange={(e) => setRestockData({...restockData, cost: e.target.value})}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Supplier
                    </label>
                    <input
                      type="text"
                      value={restockData.supplier}
                      onChange={(e) => setRestockData({...restockData, supplier: e.target.value})}
                      placeholder="Supplier name"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={restockData.expiryDate}
                    onChange={(e) => setRestockData({...restockData, expiryDate: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-chart-2 focus:border-chart-2 text-foreground"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRestockModal(false)}
                    className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-chart-2 hover:bg-chart-2/90 text-white rounded-lg transition-colors"
                  >
                    Restock
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

