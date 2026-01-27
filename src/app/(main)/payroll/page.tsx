'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { SalarySlipGenerator } from "./salary-slip-generator"
import { useFirestore, useCollection } from "@/firebase";
import { collection } from "firebase/firestore";
import { Employee } from "@/lib/types";

export default function PayrollPage() {
    const firestore = useFirestore();
    const { data: employees, loading } = useCollection<Employee>(collection(firestore, 'employees'));

    return (
        <div className="w-full">
            <h1 className="text-3xl font-bold font-headline mb-6">Payroll</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Employee Payroll</CardTitle>
                    <CardDescription>Select an employee to process payroll and generate a salary slip.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Base Salary</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
                            ) : (
                                employees?.map(employee => (
                                    <TableRow key={employee.id}>
                                        <TableCell>
                                            <div className="font-medium">{employee.fullName}</div>
                                            <div className="text-sm text-muted-foreground">{employee.email}</div>
                                        </TableCell>
                                        <TableCell>{employee.role}</TableCell>
                                        <TableCell>${employee.monthlyBaseSalary.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={employee.status === 'Active' ? 'default' : 'secondary'}>
                                                {employee.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <SalarySlipGenerator employee={employee} />
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
