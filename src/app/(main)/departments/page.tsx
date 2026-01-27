'use client'

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, MoreHorizontal } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Department, Employee } from '@/lib/types';
import { DepartmentForm, DepartmentFormData } from './department-form';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { useFirestore, useCollection } from '@/firebase';
import { collection } from 'firebase/firestore';
import { addOrUpdateDoc, deleteDocument } from '@/lib/firebase-utils';

export default function DepartmentsPage() {
    const firestore = useFirestore();
    const { data: departments, loading: loadingDepartments } = useCollection<Department>(collection(firestore, 'departments'));
    const { data: employees, loading: loadingEmployees } = useCollection<Employee>(collection(firestore, 'employees'));

    const [editingDepartment, setEditingDepartment] = React.useState<Department | undefined>(undefined);
    const [isFormOpen, setIsFormOpen] = React.useState(false);

    const handleSaveDepartment = async (data: DepartmentFormData) => {
        if (editingDepartment) {
            await addOrUpdateDoc(firestore, `departments/${editingDepartment.id}`, data);
        } else {
            await addOrUpdateDoc(firestore, 'departments', data);
        }
    }

    const handleDeleteDepartment = async (departmentId: string) => {
        await deleteDocument(firestore, `departments/${departmentId}`);
    }

    const handleEditClick = (department: Department) => {
        setEditingDepartment(department);
        setIsFormOpen(true);
    }

    const handleNewClick = () => {
        setEditingDepartment(undefined);
        setIsFormOpen(true);
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold font-headline">Departments</h1>
                <Button onClick={handleNewClick}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Department
                </Button>
            </div>

            <DepartmentForm 
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSave={handleSaveDepartment}
                department={editingDepartment}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Department List</CardTitle>
                    <CardDescription>Manage your company's departments.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Department Name</TableHead>
                                <TableHead>Employee Count</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingDepartments || loadingEmployees ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">Loading...</TableCell>
                                </TableRow>
                            ) : (
                                departments?.map(dept => {
                                    const employeeCount = employees?.filter(e => e.departmentId === dept.id).length || 0;
                                    return (
                                        <TableRow key={dept.id}>
                                            <TableCell className="font-medium">{dept.name}</TableCell>
                                            <TableCell>{employeeCount}</TableCell>
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
                                                        <DropdownMenuItem onClick={() => handleEditClick(dept)}>Edit</DropdownMenuItem>
                                                        <DeleteConfirmationDialog
                                                            onConfirm={() => handleDeleteDepartment(dept.id!)}
                                                            itemName={dept.name}
                                                            itemType="department"
                                                        >
                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Delete</DropdownMenuItem>
                                                        </DeleteConfirmationDialog>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
