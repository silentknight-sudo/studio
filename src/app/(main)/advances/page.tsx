'use client'

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, MoreHorizontal } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Advance, Employee } from '@/lib/types';
import { AdvanceForm, AdvanceFormData } from './advance-form';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { useFirestore, useCollection } from '@/firebase';
import { addDoc, collection, doc, serverTimestamp, updateDoc, deleteDoc, CollectionReference } from 'firebase/firestore';
import { addOrUpdateDoc, deleteDocument } from '@/lib/firebase-utils';

export default function AdvancesPage() {
    const firestore = useFirestore();
    const { data: advances, loading: loadingAdvances } = useCollection<Advance>(collection(firestore, 'advances'));
    const { data: employees, loading: loadingEmployees } = useCollection<Employee>(collection(firestore, 'employees'));
    
    const [editingAdvance, setEditingAdvance] = React.useState<Advance | undefined>(undefined);
    const [isFormOpen, setIsFormOpen] = React.useState(false);

    const handleSaveAdvance = async (data: AdvanceFormData) => {
        const docData = {
            ...data,
            issueDate: new Date().toISOString().split('T')[0],
        };

        if (editingAdvance) {
            await addOrUpdateDoc(
                firestore, 
                `advances/${editingAdvance.id}`, 
                {...docData, remainingBalance: data.amount - (editingAdvance.amount - editingAdvance.remainingBalance)}
            );
        } else {
            await addOrUpdateDoc(firestore, 'advances', { ...docData, remainingBalance: data.amount });
        }
    }

    const handleDeleteAdvance = async (advanceId: string) => {
        await deleteDocument(firestore, `advances/${advanceId}`);
    }

    const handleMarkAsPaid = async (advanceId: string) => {
        const advanceRef = doc(firestore, 'advances', advanceId);
        await updateDoc(advanceRef, { remainingBalance: 0 });
    }

    const handleEditClick = (advance: Advance) => {
        setEditingAdvance(advance);
        setIsFormOpen(true);
    }

    const handleNewClick = () => {
        setEditingAdvance(undefined);
        setIsFormOpen(true);
    }
    
    const getEmployee = (employeeId: string) => employees?.find(e => e.id === employeeId);

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold font-headline">Salary Advances</h1>
                <Button onClick={handleNewClick}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Advance
                </Button>
            </div>
            <AdvanceForm 
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSave={handleSaveAdvance}
                advance={editingAdvance}
            />
            <Card>
                <CardHeader>
                    <CardTitle>Advance History</CardTitle>
                    <CardDescription>Track all salary advances issued to employees.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Issue Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead className="hidden md:table-cell">Repayment</TableHead>
                                <TableHead>Remaining</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(loadingAdvances || loadingEmployees) ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                                </TableRow>
                            ) : (
                                advances?.map(advance => {
                                    const employee = getEmployee(advance.employeeId);
                                    const isPaid = advance.remainingBalance <= 0;
                                    return (
                                        <TableRow key={advance.id}>
                                            <TableCell>
                                                <div className="font-medium">{employee?.fullName}</div>
                                                <div className="text-sm text-muted-foreground">{employee?.email}</div>
                                            </TableCell>
                                            <TableCell>{advance.issueDate}</TableCell>
                                            <TableCell>${advance.amount.toLocaleString()}</TableCell>
                                            <TableCell className="hidden md:table-cell">{advance.repaymentType} ({advance.installments}x)</TableCell>
                                            <TableCell>${advance.remainingBalance.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge variant={isPaid ? 'default' : 'secondary'}>
                                                    {isPaid ? 'Paid' : 'Unpaid'}
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
                                                        <DropdownMenuItem onClick={() => handleEditClick(advance)}>Edit</DropdownMenuItem>
                                                        {!isPaid && <DropdownMenuItem onClick={() => handleMarkAsPaid(advance.id!)}>Mark as Paid</DropdownMenuItem>}
                                                        <DeleteConfirmationDialog
                                                            onConfirm={() => handleDeleteAdvance(advance.id!)}
                                                            itemName={`advance for ${employee?.fullName}`}
                                                            itemType="advance"
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
