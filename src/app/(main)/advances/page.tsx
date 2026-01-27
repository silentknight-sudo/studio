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
import { advances as mockAdvances, employees } from "@/lib/mock-data"
import type { Advance } from '@/lib/types';
import { AdvanceForm } from './advance-form';

export default function AdvancesPage() {
    const [advances, setAdvances] = React.useState<Advance[]>(mockAdvances);

    const handleSaveAdvance = (data: any) => {
        const newAdvance: Advance = {
            id: `A${String(advances.length + 1).padStart(3, '0')}`,
            issueDate: new Date().toISOString().split('T')[0],
            remainingBalance: data.amount,
            ...data
        };
        setAdvances(prev => [...prev, newAdvance]);
        console.log("New advance data:", newAdvance);
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold font-headline">Salary Advances</h1>
                <AdvanceForm onSave={handleSaveAdvance}>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Advance
                    </Button>
                </AdvanceForm>
            </div>
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
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {advances.map(advance => {
                                const employee = employees.find(e => e.id === advance.employeeId);
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
                                                <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
                                                <DropdownMenuItem>Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
