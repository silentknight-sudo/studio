'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Banknote, Users, Activity, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { Employee, Payroll, Department, Advance, UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCollection, useFirestore, useUser, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

const AdminDashboard = ({ 
  employees, 
  payrolls, 
  departments, 
  advances 
}: { 
  employees: Employee[] | null, 
  payrolls: Payroll[] | null, 
  departments: Department[] | null, 
  advances: Advance[] | null 
}) => {
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
            <p className="text-xs text-muted-foreground">registered in system</p>
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
            <CardTitle className="text-sm font-medium">Total Payroll Paid</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayroll.toLocaleString('en-IN')} INR</div>
            <p className="text-xs text-muted-foreground">all-time disbursements</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Advances</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outstandingAdvances.toLocaleString('en-IN')} INR</div>
            <p className="text-xs text-muted-foreground">to be recovered</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className='font-headline'>Full Payment History</CardTitle>
            <CardDescription>Detailed breakdown of all processed payrolls and deductions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Deduction</TableHead>
                  <TableHead className='text-right'>Net Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrolls?.sort((a, b) => b.month.localeCompare(a.month)).map(p => {
                  const employee = employees?.find(e => e.id === p.employeeId);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-medium">{employee?.fullName || 'Deleted Employee'}</div>
                        <div className="hidden text-xs text-muted-foreground md:inline">
                          {employee?.email}
                        </div>
                      </TableCell>
                      <TableCell>{p.month}</TableCell>
                      <TableCell>{p.grossSalary.toLocaleString('en-IN')} INR</TableCell>
                      <TableCell className="text-destructive">-{p.advanceDeduction.toLocaleString('en-IN')} INR</TableCell>
                      <TableCell className='text-right font-bold'>{p.netPayableSalary.toLocaleString('en-IN')} INR</TableCell>
                    </TableRow>
                  );
                })}
                {(!payrolls || payrolls.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No payment records found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className='font-headline'>Department Distribution</CardTitle>
            <CardDescription>Headcount breakdown across company departments.</CardDescription>
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

const ManagerDashboard = ({ employees }: { employees: Employee[] | null }) => {
    const myTeam = employees?.filter(e => e.teamId === 'T01'); // Mock team filter
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className='font-headline'>Team Overview</CardTitle>
                <CardDescription>Performance and status of your direct reports.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className='text-right'>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {myTeam?.map(e => (
                            <TableRow key={e.id}>
                                <TableCell>{e.fullName}</TableCell>
                                <TableCell><Badge variant={e.status === 'Active' ? 'default' : 'secondary'}>{e.status}</Badge></TableCell>
                                <TableCell className='text-right'>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/employees`}>View Details</Link>
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

const EmployeeDashboard = ({ payrolls, me }: { payrolls: Payroll[] | null, me: UserProfile | null }) => {
    // Filter payrolls for the current logged in employee
    // In this simplified setup, we match by email if the employee record exists
    const firestore = useFirestore();
    const { data: allEmployees } = useCollection<Employee>(collection(firestore, 'employees'));
    const myRecord = allEmployees?.find(e => e.email === me?.email);
    const myPayrolls = payrolls?.filter(p => p.employeeId === myRecord?.id);

    return (
        <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle className='font-headline'>My Profile</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center gap-6">
                    <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center text-3xl font-bold">
                        {me?.displayName?.[0] || me?.email[0].toUpperCase()}
                    </div>
                    <div>
                        <div className="text-xl font-bold">{me?.displayName || 'Set your name'}</div>
                        <div className="text-sm text-muted-foreground">{me?.email}</div>
                        <Badge variant="outline" className="mt-2">{me?.role}</Badge>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                        <Link href="/profile">Edit Profile</Link>
                    </Button>
                </CardContent>
            </Card>
            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className='font-headline'>My Payment History</CardTitle>
                    <CardDescription>A complete log of your salary transfers and advance deductions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Month</TableHead>
                                <TableHead>Gross</TableHead>
                                <TableHead>Deduction</TableHead>
                                <TableHead className="text-right">Net Paid</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {myPayrolls?.sort((a, b) => b.month.localeCompare(a.month)).map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">{p.month}</TableCell>
                                    <TableCell>{p.grossSalary.toLocaleString('en-IN')} INR</TableCell>
                                    <TableCell className="text-destructive">-{p.advanceDeduction.toLocaleString('en-IN')} INR</TableCell>
                                    <TableCell className="text-right font-bold text-primary">
                                        {p.netPayableSalary.toLocaleString('en-IN')} INR
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!myPayrolls || myPayrolls.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">
                                        No payment records found. Payments will appear here once processed.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
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

  const { data: employees } = useCollection<Employee>(collection(firestore, 'employees'));
  const { data: payrolls } = useCollection<Payroll>(collection(firestore, 'payrolls'));
  const { data: departments } = useCollection<Department>(collection(firestore, 'departments'));
  const { data: advances } = useCollection<Advance>(collection(firestore, 'advances'));
  
  if (userLoading || profileLoading) {
    return <div className="flex h-[50vh] items-center justify-center">Loading dashboard...</div>;
  }

  if (!userProfile || !userProfile.role) {
      return (
        <div className="w-full">
          <h1 className="text-3xl font-bold font-headline mb-6">Dashboard</h1>
          <Card className="p-10 text-center text-muted-foreground">
              User role not found. Please contact an administrator.
          </Card>
        </div>
      );
  }
  
  const USER_ROLE = userProfile.role.toLowerCase() as 'admin' | 'manager' | 'employee';

  const renderDashboard = () => {
    switch(USER_ROLE) {
      case 'admin':
        return <AdminDashboard 
                  employees={employees} 
                  payrolls={payrolls} 
                  departments={departments} 
                  advances={advances} 
                />;
      case 'manager':
        return <ManagerDashboard employees={employees} />;
      case 'employee':
        return <EmployeeDashboard payrolls={payrolls} me={userProfile} />;
      default:
        return <div className="p-10 text-center">Unauthorized access level.</div>;
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold font-headline mb-8">Dashboard Overview</h1>
      {renderDashboard()}
    </div>
  );
}
