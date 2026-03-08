'use client'

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, MoreHorizontal, ExternalLink } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Employee, Department } from '@/lib/types';
import { EmployeeForm, EmployeeFormData } from './employee-form';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { useFirestore, useCollection } from '@/firebase';
import { collection } from 'firebase/firestore';
import { addOrUpdateDoc, deleteDocument } from '@/lib/firebase-utils';
import Link from 'next/link';


export default function EmployeesPage() {
    const firestore = useFirestore();
    const { data: employees, loading: loadingEmployees } = useCollection<Employee>(collection(firestore, 'employees'));
    const { data: departments, loading: loadingDepartments } = useCollection<Department>(collection(firestore, 'departments'));

    const [editingEmployee, setEditingEmployee] = React.useState<Employee | undefined>(undefined);
    const [isFormOpen, setIsFormOpen] = React.useState(false);

    const handleSaveEmployee = async (data: EmployeeFormData) => {
        const cleanData = JSON.parse(JSON.stringify(data));

        if (editingEmployee) {
          await addOrUpdateDoc(firestore, `employees/${editingEmployee.id}`, cleanData);
        } else {
          const docData = {
            ...cleanData,
            status: 'Active',
          } as Omit<Employee, 'id'>;
          await addOrUpdateDoc(firestore, 'employees', docData);
        }
      };

    const handleDeleteEmployee = async (employeeId: string) => {
        await deleteDocument(firestore, `employees/${employeeId}`);
    }

    const handleEditClick = (employee: Employee) => {
        setEditingEmployee(employee);
        setIsFormOpen(true);
    }
    
    const handleNewClick = () => {
        setEditingEmployee(undefined);
        setIsFormOpen(true);
    }

    const getDepartmentName = (departmentId: string) => {
        return departments?.find(d => d.id === departmentId)?.name || 'N/A';
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold font-headline">Employees</h1>
                <Button onClick={handleNewClick}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Employee
                </Button>
            </div>
            <EmployeeForm
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSave={handleSaveEmployee}
                employee={editingEmployee}
            />
            <Card>
                <CardHeader>
                    <CardTitle>Employee List</CardTitle>
                    <CardDescription>Click on an employee to view details or manage their profile.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead className="hidden sm:table-cell">Role</TableHead>
                                <TableHead className="hidden md:table-cell">Department</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingEmployees || loadingDepartments ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-10">Loading employees...</TableCell></TableRow>
                            ) : (
                                employees?.map(employee => (
                                <TableRow key={employee.id} className="group">
                                    <TableCell>
                                        <Link href={`/employees/${employee.id}`} className="hover:underline flex flex-col">
                                            <span className="font-medium text-primary flex items-center gap-1">
                                                {employee.fullName}
                                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </span>
                                            <span className="hidden text-xs text-muted-foreground md:inline">
                                                {employee.email}
                                            </span>
                                        </Link>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">{employee.role}</TableCell>
                                    <TableCell className="hidden md:table-cell">{getDepartmentName(employee.departmentId)}</TableCell>
                                    <TableCell>
                                        <Badge variant={employee.status === 'Active' ? 'default' : 'secondary'}>
                                            {employee.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                            <Button
                                                aria-haspopup="true"
                                                size="icon"
                                                variant="ghost"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Toggle menu</span>
                                            </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/employees/${employee.id}`}>View Details</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleEditClick(employee)}>Quick Edit</DropdownMenuItem>
                                                <DeleteConfirmationDialog
                                                    onConfirm={() => handleDeleteEmployee(employee.id!)}
                                                    itemName={employee.fullName}
                                                    itemType="employee"
                                                >
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Delete</DropdownMenuItem>
                                                </DeleteConfirmationDialog>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
