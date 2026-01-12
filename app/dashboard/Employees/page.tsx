"use client";

import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    Plus,
    Mail,
    Shield,
    Calendar,
    MoreHorizontal,
    Trash2,
    UserPlus
} from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ThemeToggle from '@/components/theme-toggle';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRouter } from 'next/navigation';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetClose
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'WORKER'
    });

    const router = useRouter();

    useEffect(() => {
        fetch("/api/auth/session")
            .then(res => res.json())
            .then(data => {
                if (!data.user || data.user.role !== "ADMIN") {
                    router.push("/dashboard");
                    return;
                }
                setCurrentUser(data.user);
                fetchEmployees();
            })
            .catch(() => router.push("/login"));
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/users');
            if (response.ok) {
                const data = await response.json();
                setEmployees(data);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            toast.error('Failed to fetch employees');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (user: User) => {
        setEditingId(user.id);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role
        });
        setIsEditing(true);
        setIsOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this employee?')) return;

        try {
            const response = await fetch(`/api/users/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('Employee deleted successfully');
                fetchEmployees();
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to delete employee');
            }
        } catch (error) {
            console.error('Error deleting employee:', error);
            toast.error('An error occurred');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const url = isEditing ? `/api/users/${editingId}` : '/api/users';
            const method = isEditing ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`Employee ${isEditing ? 'updated' : 'created'} successfully`);
                setIsOpen(false);
                resetForm();
                fetchEmployees();
            } else {
                toast.error(data.error || 'Something went wrong');
            }
        } catch (error) {
            console.error('Error saving employee:', error);
            toast.error('An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'WORKER'
        });
        setIsEditing(false);
        setEditingId(null);
    };

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!currentUser) return null;

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
                        <h1 className="text-base font-medium">Employees</h1>
                        <div className="ml-auto flex items-center gap-2">
                            <ThemeToggle />
                            <Button
                                onClick={() => {
                                    resetForm();
                                    setIsOpen(true);
                                }}
                                className="cursor-pointer bg-primary text-white rounded-md transition-colors"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Employee
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search employees..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <Card className="border-border bg-card shadow-sm">
                        <CardHeader>
                            <CardTitle>Employee Directory</CardTitle>
                            <CardDescription>Manage your farm staff and their access levels.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="py-10 text-center text-muted-foreground animate-pulse flex flex-col items-center gap-2">
                                    <Users className="h-8 w-8 opacity-20" />
                                    Loading employees...
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Joined</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredEmployees.map((emp) => (
                                            <TableRow key={emp.id} className="hover:bg-muted/50 transition-colors group">
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase shadow-sm">
                                                            {emp.name.charAt(0)}
                                                        </div>
                                                        <span className="group-hover:text-primary transition-colors">{emp.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                                        <Mail className="h-3.5 w-3.5" />
                                                        {emp.email}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={emp.role === 'ADMIN' ? 'default' : 'secondary'} className="font-semibold text-[10px] uppercase tracking-wider py-0.5 px-2">
                                                        {emp.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {new Date(emp.createdAt).toLocaleDateString()}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted rounded-full">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleEdit(emp)} className="cursor-pointer">
                                                                Edit Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(emp.id)}
                                                                className="text-destructive focus:text-destructive cursor-pointer"
                                                                disabled={emp.id === currentUser.id}
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete Employee
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredEmployees.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center gap-2 opacity-50">
                                                        <Users className="h-10 w-10 mb-2" />
                                                        <p>No employees found matching your search.</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent className="sm:max-w-md">
                    <SheetHeader className="mb-6">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                            <UserPlus className="h-6 w-6" />
                        </div>
                        <SheetTitle className="text-2xl font-bold">{isEditing ? 'Edit Employee' : 'Add New Employee'}</SheetTitle>
                        <SheetDescription className="text-base">
                            {isEditing ? 'Make changes to the employee profile below.' : 'Create a new account and assign a role to your staff member.'}
                        </SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-semibold">Full Name</Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="bg-muted/50 focus:bg-background transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                className="bg-muted/50 focus:bg-background transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-semibold">
                                {isEditing ? 'New Password' : 'Password'}
                                {isEditing && <span className="text-xs font-normal text-muted-foreground ml-2">(optional)</span>}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required={!isEditing}
                                className="bg-muted/50 focus:bg-background transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role" className="text-sm font-semibold">System Role</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(v) => setFormData({ ...formData, role: v })}
                            >
                                <SelectTrigger className="bg-muted/50 focus:bg-background transition-colors">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="MANAGER">Manager</SelectItem>
                                    <SelectItem value="WORKER">Worker</SelectItem>
                                    <SelectItem value="VETERINARIAN">Veterinarian</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <SheetFooter className="mt-10 flex-col sm:flex-row gap-2">
                            <SheetClose asChild>
                                <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
                            </SheetClose>
                            <Button type="submit" disabled={submitting} className="w-full sm:w-auto min-w-[120px]">
                                {submitting ? 'Processing...' : (isEditing ? 'Save Changes' : 'Create Account')}
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>
        </SidebarProvider>
    );
}
