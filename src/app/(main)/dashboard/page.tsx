'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Banknote, Users, Activity, CreditCard } from 'lucide-react';
import type { Employee, Payroll, Department, Advance, UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCollection, useFirestore, useUser, useDoc } from '@/firebase';
import { collection, CollectionReference, doc } from 'firebase/firestore';

const AdminDashboard = () => {
  const firestore = useFirestore();
  const { data: employees } = useCollection<Employee>(collection(firestore, 'employees'));
  const { data: payrolls } = useCollection<Payroll>(collection(firestore, 'payrolls'));
  const { data: departments } = useCollection<Department>(collection(firestore, 'departments'));
  const { data: advances } = useCollection<Advance>(collection(firestore, 'advances'));
  
  const totalEmployees = employees?.length || 0;
  const activeEmployees = employees?.filter(e => e.status === 'Active').length || 0;
  const totalPayroll = payrolls?.reduce((sum, p) => sum + p.netPayableSalary, 0) || 0;
  const outstandingAdvances = advances?.reduce((sum, a) => sum + a.remainingBalance, 0) || 0;

  const employeesByDept = departments?.map(dept => ({
    name: dept.name,
    total: employees?.filter(e => e.departmentId === dept.id).length || 0,
  }));

  const chartConfig = {
    total: {
      label: "Employees",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">all-time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEmployees}</div>
            <p className="text-xs text-muted-foreground">{totalEmployees - activeEmployees} inactive</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayroll.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('₹', '')} INR</div>
            <p className="text-xs text-muted-foreground">For {new Date().toLocaleString('default', { month: 'long' })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Advances</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outstandingAdvances.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('₹', '')} INR</div>
            <p className="text-xs text-muted-foreground">Across all employees</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className='font-headline'>Recent Payroll</CardTitle>
            <CardDescription>An overview of the most recent payroll runs.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="hidden sm:table-cell">Role</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead className='text-right'>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrolls?.slice(0, 5).map(p => {
                  const employee = employees?.find(e => e.id === p.employeeId);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-medium">{employee?.fullName}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                          {employee?.email}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{employee?.role}</TableCell>
                      <TableCell>{p.netPayableSalary.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('₹', '')} INR</TableCell>
                      <TableCell>{p.month}</TableCell>
                      <TableCell className='text-right'><Badge>Paid</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className='font-headline'>Employees by Department</CardTitle>
            <CardDescription>Distribution of employees across different departments.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart accessibilityLayer data={employeesByDept} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} allowDecimals={false}/>
                <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Bar dataKey="total" fill="var(--color-total)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ManagerDashboard = () => {
    const firestore = useFirestore();
    const { user } = useUser();
    // In a real app, you'd find the manager's team.
    const { data: allEmployees } = useCollection<Employee>(collection(firestore, 'employees'));
    const myTeam = allEmployees?.filter(e => e.teamId === 'T01'); // Hardcoded for now
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className='font-headline'>My Team</CardTitle>
                <CardDescription>Overview of your direct reports.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Check-in</TableHead>
                            <TableHead className='text-right'>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {myTeam?.map(e => (
                            <TableRow key={e.id}>
                                <TableCell>{e.fullName}</TableCell>
                                <TableCell><Badge variant={e.status === 'Active' ? 'default' : 'secondary'}>{e.status}</Badge></TableCell>
                                <TableCell>Today, 9:03 AM</TableCell>
                                <TableCell className='text-right'>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href="#">View</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

const EmployeeDashboard = () => {
    const { user } = useUser();
    const firestore = useFirestore();
    // In a real app, we'd fetch the employee doc corresponding to the user.
    // For demo, we'll just show the user's email from auth.
    const me = user;
    
    return (
        <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle className='font-headline'>My Profile</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center gap-4">
                    <div className="font-semibold">{me?.email}</div>
                    <Button>Edit Profile</Button>
                </CardContent>
            </Card>
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className='font-headline'>My Activity</CardTitle>
                    <CardDescription>Your recent check-ins and salary slips.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center p-4 border rounded-lg mb-4">
                        <div>
                            <p className="font-medium">Today's Status</p>
                            <p className="text-sm text-muted-foreground">You haven't checked in yet.</p>
                        </div>
                        <Button>Check In</Button>
                    </div>
                     <div className="flex justify-between items-center p-4 border rounded-lg">
                        <div>
                            <p className="font-medium">Latest Salary Slip</p>
                            <p className="text-sm text-muted-foreground">June 2024</p>
                        </div>
                        <Button variant="outline">Download</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>(
    user ? doc(firestore, 'users', user.uid) : null
  );
  
  if (userLoading || profileLoading) {
    return <div className="text-center">Loading dashboard...</div>;
  }

  // This is the fix. Explicitly check for the profile and role before using them.
  if (!userProfile || !userProfile.role) {
      return (
        <div className="w-full">
          <h1 className="text-3xl font-bold font-headline mb-6">Dashboard</h1>
          <div>Loading user role... If this persists, you may not have a role assigned.</div>
        </div>
      );
  }
  
  const USER_ROLE = userProfile.role.toLowerCase() as 'admin' | 'manager' | 'employee';

  const renderDashboard = () => {
    switch(USER_ROLE) {
      case 'admin':
        return <AdminDashboard />;
      case 'manager':
        return <ManagerDashboard />;
      case 'employee':
        return <EmployeeDashboard />;
      default:
        return <div>An unexpected error occurred with the user role.</div>;
    }
  }

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold font-headline mb-6">Dashboard</h1>
      {renderDashboard()}
    </div>
  );
}
