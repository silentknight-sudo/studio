'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useCollection } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import type { Employee, Payroll, EmployeeDocument, Department } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Building2,
  Trash2,
  Download
} from 'lucide-react';
import { SalarySlipGenerator } from '../../payroll/salary-slip-generator';
import { EmployeeForm } from '../employee-form';
import { addOrUpdateDoc, deleteDocument } from '@/lib/firebase-utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

export default function EmployeeDetailPage() {
  const { employeeId } = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  
  const { data: employee, loading: employeeLoading } = useDoc<Employee>(
    employeeId ? doc(firestore, 'employees', employeeId as string) : null
  );

  const { data: payrolls, loading: payrollsLoading } = useCollection<Payroll>(
    employeeId ? query(collection(firestore, 'payrolls'), where('employeeId', '==', employeeId), orderBy('month', 'desc')) : null
  );

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

  const deptName = departments?.find(d => d.id === employee.departmentId)?.name || 'Unknown Department';

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold font-headline">Employee Profile</h1>
      </div>

      {/* Header Profile Card */}
      <Card className="overflow-hidden border-primary/20">
        <CardContent className="p-0">
          <div className="bg-primary/5 p-8 flex flex-col md:flex-row items-center gap-8 border-b">
            <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
              <AvatarImage src={employee.profilePhotoUrl} />
              <AvatarFallback className="text-4xl font-bold">{employee.fullName[0]}</AvatarFallback>
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
              <Button onClick={() => setIsEditModalOpen(true)}>Edit Profile</Button>
              <SalarySlipGenerator employee={employee} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
          <TabsTrigger value="details"><User className="mr-2 h-4 w-4" /> Details</TabsTrigger>
          <TabsTrigger value="payroll"><CreditCard className="mr-2 h-4 w-4" /> Payroll</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="mr-2 h-4 w-4" /> Documents</TabsTrigger>
        </TabsList>

        {/* DETAILS TAB */}
        <TabsContent value="details" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Employment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 py-2 border-b">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium">{deptName}</span>
                </div>
                <div className="grid grid-cols-2 py-2 border-b">
                  <span className="text-muted-foreground">Monthly Base Salary</span>
                  <span className="font-bold text-primary">{employee.monthlyBaseSalary.toLocaleString('en-IN')} INR</span>
                </div>
                <div className="grid grid-cols-2 py-2 border-b">
                  <span className="text-muted-foreground">Date of Joining</span>
                  <span>{employee.dateOfJoining}</span>
                </div>
                <div className="grid grid-cols-2 py-2">
                  <span className="text-muted-foreground">Employment Role</span>
                  <span>{employee.role}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 py-2 border-b">
                  <span className="text-muted-foreground">Email Address</span>
                  <span>{employee.email}</span>
                </div>
                <div className="grid grid-cols-2 py-2 border-b">
                  <span className="text-muted-foreground">Phone Number</span>
                  <span>{employee.phone}</span>
                </div>
                <div className="grid grid-cols-2 py-2">
                  <span className="text-muted-foreground">Emergency Contact</span>
                  <span>{employee.emergencyContact || 'Not provided'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PAYROLL TAB */}
        <TabsContent value="payroll" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Comprehensive list of all salary payments and slip audit trail.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Gross</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead className="text-right">Net Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollsLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center">Loading payrolls...</TableCell></TableRow>
                  ) : payrolls?.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No payroll history found.</TableCell></TableRow>
                  ) : (
                    payrolls?.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.month}</TableCell>
                        <TableCell>{p.grossSalary.toLocaleString('en-IN')} INR</TableCell>
                        <TableCell className="text-destructive">-{p.advanceDeduction.toLocaleString('en-IN')} INR</TableCell>
                        <TableCell className="text-right font-bold text-primary">{p.netPayableSalary.toLocaleString('en-IN')} INR</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DOCUMENTS TAB */}
        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Employee Documents</CardTitle>
                <CardDescription>Manage IDs, contracts, and compliance paperwork.</CardDescription>
              </div>
              <Button size="sm">Add Metadata</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docsLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center">Loading documents...</TableCell></TableRow>
                  ) : documents?.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No documents attached to this profile.</TableCell></TableRow>
                  ) : (
                    documents?.map(doc => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell><Badge variant="outline">{doc.type}</Badge></TableCell>
                        <TableCell>{doc.uploadDate}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
