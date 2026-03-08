'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useCollection } from '@/firebase';
import { doc, collection, query, where, updateDoc } from 'firebase/firestore';
import type { Employee, Payroll, EmployeeDocument, Department, Advance } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  CreditCard, 
  FileText, 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  Trash2,
  Download,
  HandCoins,
  CheckCircle2
} from 'lucide-react';
import { SalarySlipGenerator } from '../../payroll/salary-slip-generator';
import { EmployeeForm } from '../employee-form';
import { addOrUpdateDoc } from '@/lib/firebase-utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function EmployeeDetailPage() {
  const { employeeId } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  
  const { data: employee, loading: employeeLoading } = useDoc<Employee>(
    employeeId ? doc(firestore, 'employees', employeeId as string) : null
  );

  // Performance Optimization: Fetch and sort Payrolls in-memory to bypass composite index requirements
  const payrollsQuery = useMemo(() => {
    if (!firestore || !employeeId) return null;
    return query(collection(firestore, 'payrolls'), where('employeeId', '==', employeeId));
  }, [firestore, employeeId]);

  const { data: payrollsRaw, loading: payrollsLoading } = useCollection<Payroll>(payrollsQuery);

  const payrolls = useMemo(() => {
    if (!payrollsRaw) return null;
    return [...payrollsRaw].sort((a, b) => b.month.localeCompare(a.month));
  }, [payrollsRaw]);

  // Performance Optimization: Fetch and sort Advances in-memory
  const advancesQuery = useMemo(() => {
    if (!firestore || !employeeId) return null;
    return query(collection(firestore, 'advances'), where('employeeId', '==', employeeId));
  }, [firestore, employeeId]);

  const { data: advancesRaw, loading: advancesLoading } = useCollection<Advance>(advancesQuery);

  const advances = useMemo(() => {
    if (!advancesRaw) return null;
    return [...advancesRaw].sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  }, [advancesRaw]);

  const { data: documents, loading: docsLoading } = useCollection<EmployeeDocument>(
    employeeId ? collection(firestore, 'employees', employeeId as string, 'documents') : null
  );

  const { data: departments } = useCollection<Department>(collection(firestore, 'departments'));

  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  if (employeeLoading) {
    return <div className="flex h-screen items-center justify-center">Loading employee profile...</div>;
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <h2 className="text-2xl font-bold">Employee Not Found</h2>
        <Button onClick={() => router.push('/employees')}>Back to List</Button>
      </div>
    );
  }

  const handleUpdateEmployee = async (data: any) => {
    await addOrUpdateDoc(firestore, `employees/${employee.id}`, data);
  };

  const handleMarkAsPaid = async (advanceId: string) => {
    const advanceRef = doc(firestore, 'advances', advanceId);
    await updateDoc(advanceRef, { remainingBalance: 0 });
  };

  const deptName = departments?.find(d => d.id === employee.departmentId)?.name || 'Unknown Department';

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold font-headline text-primary">Employee Workspace</h1>
      </div>

      {/* Hero Profile Card */}
      <Card className="overflow-hidden border-primary/20 shadow-lg">
        <CardContent className="p-0">
          <div className="bg-primary/5 p-8 flex flex-col md:flex-row items-center gap-8 border-b">
            <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
              <AvatarImage src={employee.profilePhotoUrl} />
              <AvatarFallback className="text-4xl font-bold bg-primary text-primary-foreground">
                {employee.fullName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <h2 className="text-4xl font-bold font-headline">{employee.fullName}</h2>
                <Badge variant={employee.status === 'Active' ? 'default' : 'secondary'} className="w-fit mx-auto md:mx-0">
                  {employee.status}
                </Badge>
              </div>
              <p className="text-xl text-muted-foreground font-medium">{employee.role} • {deptName}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {employee.email}</span>
                <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {employee.phone}</span>
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Joined {employee.dateOfJoining}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <Button onClick={() => setIsEditModalOpen(true)} className="w-full">Edit Profile</Button>
              <SalarySlipGenerator employee={employee} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px] mb-8">
          <TabsTrigger value="details"><User className="mr-2 h-4 w-4" /> Details</TabsTrigger>
          <TabsTrigger value="payroll"><CreditCard className="mr-2 h-4 w-4" /> Payroll</TabsTrigger>
          <TabsTrigger value="advances"><HandCoins className="mr-2 h-4 w-4" /> Advances</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="mr-2 h-4 w-4" /> Documents</TabsTrigger>
        </TabsList>

        {/* DETAILS TAB */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-headline">Employment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 py-3 border-b">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium">{deptName}</span>
                </div>
                <div className="grid grid-cols-2 py-3 border-b">
                  <span className="text-muted-foreground">Monthly Base Salary</span>
                  <span className="font-bold text-primary">{employee.monthlyBaseSalary.toLocaleString('en-IN')} INR</span>
                </div>
                <div className="grid grid-cols-2 py-3 border-b">
                  <span className="text-muted-foreground">Date of Joining</span>
                  <span>{employee.dateOfJoining}</span>
                </div>
                <div className="grid grid-cols-2 py-3">
                  <span className="text-muted-foreground">Current Status</span>
                  <Badge variant={employee.status === 'Active' ? 'default' : 'secondary'}>{employee.status}</Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-headline">Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 py-3 border-b">
                  <span className="text-muted-foreground">Email Address</span>
                  <span className="truncate">{employee.email}</span>
                </div>
                <div className="grid grid-cols-2 py-3 border-b">
                  <span className="text-muted-foreground">Phone Number</span>
                  <span>{employee.phone}</span>
                </div>
                <div className="grid grid-cols-2 py-3 border-b">
                    <span className="text-muted-foreground">Emergency Contact</span>
                    <span>{employee.emergencyContact || 'Not provided'}</span>
                </div>
                <div className="grid grid-cols-2 py-3">
                  <span className="text-muted-foreground">Address</span>
                  <span className="text-sm italic">{employee.address || 'Not provided'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PAYROLL TAB */}
        <TabsContent value="payroll">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">Disbursement History</CardTitle>
              <CardDescription>Comprehensive audit trail of all salary payments for this employee.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Gross Salary</TableHead>
                    <TableHead>Adjustments</TableHead>
                    <TableHead className="text-right">Net Payable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollsLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8">Loading financial records...</TableCell></TableRow>
                  ) : !payrolls || payrolls.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground">No payroll history recorded.</TableCell></TableRow>
                  ) : (
                    payrolls.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.month}</TableCell>
                        <TableCell>{p.grossSalary.toLocaleString('en-IN')} INR</TableCell>
                        <TableCell className="text-destructive font-medium">-{p.advanceDeduction.toLocaleString('en-IN')} INR</TableCell>
                        <TableCell className="text-right font-bold text-primary">{p.netPayableSalary.toLocaleString('en-IN')} INR</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADVANCES TAB */}
        <TabsContent value="advances">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline">Salary Advances</CardTitle>
                <CardDescription>Track loans and recovery status for this employee.</CardDescription>
              </div>
              <HandCoins className="h-8 w-8 text-primary opacity-20" />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Principal Amount</TableHead>
                    <TableHead>Remaining Balance</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advancesLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8">Loading credit records...</TableCell></TableRow>
                  ) : !advances || advances.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">No active or historical advances found.</TableCell></TableRow>
                  ) : (
                    advances.map(a => {
                      const isPaid = a.remainingBalance <= 0;
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">{a.issueDate}</TableCell>
                          <TableCell>{a.amount.toLocaleString('en-IN')} INR</TableCell>
                          <TableCell className={isPaid ? "text-muted-foreground" : "font-bold text-orange-600"}>
                            {a.remainingBalance.toLocaleString('en-IN')} INR
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {a.repaymentType} ({a.installments}x)
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isPaid ? 'default' : 'secondary'}>
                              {isPaid ? 'Cleared' : 'Active'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                             {!isPaid && (
                               <Button variant="ghost" size="sm" onClick={() => handleMarkAsPaid(a.id!)}>
                                 <CheckCircle2 className="h-4 w-4 mr-2" /> Mark as Paid
                               </Button>
                             )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DOCUMENTS TAB */}
        <TabsContent value="documents">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline">Compliance Documents</CardTitle>
                <CardDescription>IDs, contracts, and legal paperwork for this profile.</CardDescription>
              </div>
              <Button size="sm">Add Document</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead className="text-right">Management</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docsLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8">Loading documentation...</TableCell></TableRow>
                  ) : !documents || documents.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground">No compliance documents attached.</TableCell></TableRow>
                  ) : (
                    documents.map(doc => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell><Badge variant="outline">{doc.type}</Badge></TableCell>
                        <TableCell>{doc.uploadDate}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="hover:text-primary"><Download className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EmployeeForm 
        isOpen={isEditModalOpen} 
        onOpenChange={setIsEditModalOpen} 
        onSave={handleUpdateEmployee} 
        employee={employee} 
      />
    </div>
  );
}