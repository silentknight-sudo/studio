'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, LineChart } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { 
  Banknote, 
  Users, 
  Activity, 
  CreditCard, 
  TrendingUp,
  ArrowRight,
  UserPlus
} from 'lucide-react';
import type { Employee, Payroll, Department, Advance, UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCollection, useFirestore, useUser, useDoc } from '@/firebase';
import { collection, doc, query, orderBy, limit } from 'firebase/firestore';

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
  const totalPayrollAllTime = payrolls?.reduce((sum, p) => sum + p.netPayableSalary, 0) || 0;
  const outstandingAdvances = advances?.reduce((sum, a) => sum + a.remainingBalance, 0) || 0;

  // Monthly Payroll Trend (Last 6 months)
  const monthlyStats = useMemo(() => {
    if (!payrolls) return [];
    const stats: Record<string, number> = {};
    payrolls.forEach(p => {
        stats[p.month] = (stats[p.month] || 0) + p.netPayableSalary;
    });
    return Object.entries(stats)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-6)
        .map(([name, total]) => ({ name, total }));
  }, [payrolls]);

  const employeesByDept = useMemo(() => {
    return departments?.map(dept => ({
      name: dept.name,
      total: employees?.filter(e => e.departmentId === dept.id).length || 0,
    })).filter(d => d.total > 0);
  }, [departments, employees]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Layer Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-80">Workforce</CardTitle>
            <Users className="h-4 w-4 opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalEmployees}</div>
            <p className="text-xs opacity-70 flex items-center mt-1">
                <Activity className="h-3 w-3 mr-1" /> {activeEmployees} Active Employees
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Outflow</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(monthlyStats[monthlyStats.length-1]?.total || 0).toLocaleString('en-IN')} INR</div>
            <p className="text-xs text-muted-foreground">Recent disbursement</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Advance Liability</CardTitle>
            <Banknote className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outstandingAdvances.toLocaleString('en-IN')} INR</div>
            <p className="text-xs text-muted-foreground">Total awaiting recovery</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Disbursement</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayrollAllTime.toLocaleString('en-IN')} INR</div>
            <p className="text-xs text-muted-foreground">Lifetime payroll value</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Layer */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-sm border-none bg-muted/30">
          <CardHeader>
            <CardTitle className='font-headline text-xl'>Payroll Trend</CardTitle>
            <CardDescription>Salary outflow history (Last 6 months).</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ total: { label: "Disbursed", color: "hsl(var(--primary))" } }} className="h-[280px] w-full">
              <LineChart data={monthlyStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="total" stroke="var(--color-total)" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className='font-headline text-xl'>Dept. Headcount</CardTitle>
            <CardDescription>Staff distribution per department.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={{ total: { label: "Employees", color: "hsl(var(--accent))" } }} className="h-[280px] w-full">
                <BarChart data={employeesByDept} layout="vertical" margin={{ left: -20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={12} width={100} />
                    <Tooltip content={<ChartTooltipContent />} cursor={false} />
                    <Bar dataKey="total" fill="var(--color-total)" radius={[0, 4, 4, 0]} />
                </BarChart>
             </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tables Layer */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className='font-headline'>Recent Payroll Activity</CardTitle>
                <CardDescription>Latest processed salary slips.</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
                <Link href="/payroll">View All <ArrowRight className="ml-2 h-3 w-3"/></Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead className='text-right'>Net Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrolls?.sort((a, b) => b.month.localeCompare(a.month)).slice(0, 5).map(p => {
                  const employee = employees?.find(e => e.id === p.employeeId);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link href={`/employees/${p.employeeId}`} className="font-medium hover:underline text-primary">
                            {employee?.fullName || 'Deleted Employee'}
                        </Link>
                      </TableCell>
                      <TableCell>{p.month}</TableCell>
                      <TableCell className='text-right font-bold'>{p.netPayableSalary.toLocaleString('en-IN')} INR</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className='font-headline'>Latest Hires</CardTitle>
                    <CardDescription>New additions to the workforce.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/employees"><UserPlus className="h-4 w-4"/></Link>
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {employees?.sort((a, b) => b.dateOfJoining.localeCompare(a.dateOfJoining)).slice(0, 5).map(emp => (
                    <div key={emp.id} className="flex items-center gap-4">
                        <Badge variant="outline" className="h-8 w-8 rounded-full p-0 flex items-center justify-center font-bold">
                            {emp.fullName[0]}
                        </Badge>
                        <div className="flex-1 overflow-hidden">
                            <Link href={`/employees/${emp.id}`} className="text-sm font-semibold hover:underline block truncate">{emp.fullName}</Link>
                            <p className="text-xs text-muted-foreground truncate">{emp.role} • Joined {emp.dateOfJoining}</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ManagerDashboard = ({ employees }: { employees: Employee[] | null }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className='font-headline'>Team Overview</CardTitle>
                <CardDescription>Status of your direct reports.</CardDescription>
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
                        {employees?.slice(0, 10).map(e => (
                            <TableRow key={e.id}>
                                <TableCell className="font-medium">{e.fullName}</TableCell>
                                <TableCell><Badge variant={e.status === 'Active' ? 'default' : 'secondary'}>{e.status}</Badge></TableCell>
                                <TableCell className='text-right'>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/employees/${e.id}`}>Profile</Link>
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
    const firestore = useFirestore();
    const { data: allEmployees } = useCollection<Employee>(collection(firestore, 'employees'));
    const myRecord = allEmployees?.find(e => e.email === me?.email);
    const myPayrolls = useMemo(() => {
        return payrolls?.filter(p => p.employeeId === myRecord?.id).sort((a, b) => b.month.localeCompare(a.month));
    }, [payrolls, myRecord]);

    return (
        <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-1 border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle className='font-headline text-2xl'>Welcome Back!</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center gap-6">
                    <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center text-4xl font-bold text-primary-foreground shadow-lg">
                        {me?.displayName?.[0] || me?.email[0].toUpperCase()}
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{me?.displayName || 'User'}</div>
                        <div className="text-sm text-muted-foreground">{me?.email}</div>
                        <Badge variant="secondary" className="mt-2 px-4">{me?.role}</Badge>
                    </div>
                    {myRecord && (
                        <Button className="w-full" asChild>
                            <Link href={`/employees/${myRecord.id}`}>View My Profile</Link>
                        </Button>
                    )}
                </CardContent>
            </Card>
            <Card className="md:col-span-2 shadow-sm">
                <CardHeader className="border-b">
                    <CardTitle className='font-headline'>My Earnings</CardTitle>
                    <CardDescription>Recent salary disbursements.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="pl-6">Month</TableHead>
                                <TableHead>Gross</TableHead>
                                <TableHead className="text-right pr-6">Net Paid</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {myPayrolls?.slice(0, 5).map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium pl-6">{p.month}</TableCell>
                                    <TableCell>{p.grossSalary.toLocaleString('en-IN')} INR</TableCell>
                                    <TableCell className="text-right font-bold text-primary pr-6">
                                        {p.netPayableSalary.toLocaleString('en-IN')} INR
                                    </TableCell>
                                </TableRow>
                            ))}
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
    return <div className="flex h-[50vh] items-center justify-center">Analyzing dashboard data...</div>;
  }

  if (!userProfile || !userProfile.role) {
      return (
        <div className="w-full text-center py-20">
          <Card className="max-w-md mx-auto p-10">
              <h2 className="text-xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-4">Your account doesn't have a valid role assigned yet.</p>
              <Button onClick={() => window.location.reload()}>Retry Access</Button>
          </Card>
        </div>
      );
  }
  
  const USER_ROLE = userProfile.role.toLowerCase() as 'admin' | 'manager' | 'employee';

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-4xl font-bold font-headline">Operations Control</h1>
            <p className="text-muted-foreground mt-1">Real-time intelligence for Arogya Bio management.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium bg-muted px-4 py-2 rounded-full">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            Live System Data
        </div>
      </div>
      
      {USER_ROLE === 'admin' && (
        <AdminDashboard 
            employees={employees} 
            payrolls={payrolls} 
            departments={departments} 
            advances={advances} 
        />
      )}

      {USER_ROLE === 'manager' && (
        <ManagerDashboard employees={employees} />
      )}

      {USER_ROLE === 'employee' && (
        <EmployeeDashboard payrolls={payrolls} me={userProfile} />
      )}
    </div>
  );
}
