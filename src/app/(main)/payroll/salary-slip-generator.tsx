'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { Employee, SalarySlip, Department, Team } from '@/lib/types';
import { generateSalarySlipAction } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SalarySlipDisplay } from '@/components/salary-slip';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';

export function SalarySlipGenerator({ employee }: { employee: Employee }) {
  const [isOpen, setIsOpen] = useState(false);
  const [advanceDeduction, setAdvanceDeduction] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [slip, setSlip] = useState<SalarySlip | null>(null);
  const [error, setError] = useState<string | null>(null);

  const firestore = useFirestore();
  const { data: department } = useDoc<Department>(doc(firestore, 'departments', employee.departmentId));
  const { data: team } = useDoc<Team>(employee.teamId ? doc(firestore, 'teams', employee.teamId) : null);

  const handleGenerate = () => {
    startTransition(async () => {
      setError(null);
      setSlip(null);
      const result = await generateSalarySlipAction({
        employeeId: employee.id!,
        advanceDeduction: advanceDeduction,
      }, employee, department, team);

      if (result.success && result.data) {
        setSlip(result.data);
      } else {
        setError(result.error || 'An unknown error occurred.');
      }
    });
  };

  const resetState = () => {
    setSlip(null);
    setError(null);
    setAdvanceDeduction(0);
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
    }
    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Generate Slip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Generate Salary Slip</DialogTitle>
          <DialogDescription>
            For {employee.fullName} for the current month.
          </DialogDescription>
        </DialogHeader>
        
        {slip ? (
           <ScrollArea className="max-h-[60vh] p-1">
             <SalarySlipDisplay slip={slip} />
           </ScrollArea>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="base-salary" className="text-right">
                Base Salary
              </Label>
              <Input id="base-salary" value={`₹${employee.monthlyBaseSalary.toLocaleString('en-IN')}`} disabled className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="advance-deduction" className="text-right">
                Advance Deduction
              </Label>
              <Input
                id="advance-deduction"
                type="number"
                value={advanceDeduction}
                onChange={(e) => setAdvanceDeduction(parseFloat(e.target.value) || 0)}
                className="col-span-3"
              />
            </div>
          </div>
        )}

        {error && (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        <DialogFooter>
          {slip ? (
            <>
                <Button type="button" variant="secondary" onClick={resetState}>Generate New</Button>
                <Button type="button" onClick={() => window.print()}>Print Slip</Button>
            </>
          ) : (
            <Button type="button" onClick={handleGenerate} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate with AI
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
