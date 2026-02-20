'use client';

import React, { useState, useTransition, useEffect, useMemo } from 'react';
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
import { Loader2, Download } from 'lucide-react';
import type { Employee, SalarySlip, Department, Team, Advance } from '@/lib/types';
import { generateSalarySlipAction } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SalarySlipDisplay } from '@/components/salary-slip';
import { useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, query, collection, where } from 'firebase/firestore';
import { addOrUpdateDoc } from '@/lib/firebase-utils';
import jsPDF from 'jsPDF';
import html2canvas from 'html2canvas';

export function SalarySlipGenerator({ employee }: { employee: Employee }) {
  const [isOpen, setIsOpen] = useState(false);
  const [advanceDeduction, setAdvanceDeduction] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [slip, setSlip] = useState<SalarySlip | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeAdvance, setActiveAdvance] = useState<Advance | null>(null);

  const firestore = useFirestore();
  const { data: department } = useDoc<Department>(doc(firestore, 'departments', employee.departmentId));
  const { data: team } = useDoc<Team>(employee.teamId ? doc(firestore, 'teams', employee.teamId) : null);

  // Simplified query to avoid composite index requirements
  const advancesQuery = useMemo(() => {
    if (!firestore || !employee.id) return null;
    return query(
      collection(firestore, 'advances'), 
      where('employeeId', '==', employee.id)
    );
  }, [firestore, employee.id]);
  
  const { data: advances, loading: loadingAdvances } = useCollection<Advance>(advancesQuery);

  useEffect(() => {
    if (advances && advances.length > 0) {
        // Filter in-memory to find active advances (remainingBalance > 0)
        // This avoids the "Missing or insufficient permissions" or "Index required" errors for complex queries
        const unpaidAdvances = advances.filter(a => a.remainingBalance > 0);
        
        if (unpaidAdvances.length > 0) {
            const advance = unpaidAdvances[0];
            setActiveAdvance(advance);
            
            // Calculate the installment (total amount / number of months)
            const monthlyInstallment = advance.amount / (advance.installments || 1);
            // Deduction is either the installment or the remaining balance, whichever is smaller
            const deduction = Math.min(advance.remainingBalance, monthlyInstallment);
            setAdvanceDeduction(Math.round(deduction * 100) / 100);
        } else {
            setActiveAdvance(null);
            setAdvanceDeduction(0);
        }
    } else {
        setActiveAdvance(null);
        setAdvanceDeduction(0);
    }
  }, [advances]);


  const handleGenerate = () => {
    startTransition(async () => {
      setError(null);
      setSlip(null);
      
      // Call server action to get AI generation
      const result = await generateSalarySlipAction({
        employeeId: employee.id!,
        advanceDeduction: advanceDeduction,
      }, employee, department || null, team || null);

      if (result.success && result.data) {
        setSlip(result.data);

        // 1. Record the payroll in Firestore
        addOrUpdateDoc(firestore, 'payrolls', {
            employeeId: employee.id,
            month: result.data.salaryMonth,
            grossSalary: result.data.grossSalary,
            advanceDeduction: result.data.advanceDeduction,
            netPayableSalary: result.data.netPayableSalary,
            generatedAt: new Date().toISOString(),
        });

        // 2. Automatically update the advance balance
        if (activeAdvance && advanceDeduction > 0) {
            const newRemainingBalance = activeAdvance.remainingBalance - advanceDeduction;
            addOrUpdateDoc(firestore, `advances/${activeAdvance.id}`, {
                remainingBalance: Math.max(0, newRemainingBalance),
            });
        }
      } else {
        setError(result.error || 'Failed to generate salary slip.');
      }
    });
  };

  const resetState = () => {
    setSlip(null);
    setError(null);
    if (advances && advances.length > 0) {
        const unpaidAdvances = advances.filter(a => a.remainingBalance > 0);
        if (unpaidAdvances.length > 0) {
            const advance = unpaidAdvances[0];
            const monthlyInstallment = advance.amount / (advance.installments || 1);
            const deduction = Math.min(advance.remainingBalance, monthlyInstallment);
            setAdvanceDeduction(Math.round(deduction * 100) / 100);
        }
    } else {
        setAdvanceDeduction(0);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetState();
    setIsOpen(open);
  };
  
  const handleDownloadPdf = () => {
    const slipElement = document.getElementById('salary-slip-printable');
    if (!slipElement) return;

    html2canvas(slipElement, { 
      scale: 2,
      useCORS: true,
      logging: false,
    }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`SalarySlip_${employee.fullName.replace(/\s+/g, '_')}_${slip?.salaryMonth}.pdf`);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Generate Slip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">Process Payroll</DialogTitle>
          <DialogDescription>
            Generate an AI-verified salary slip for {employee.fullName}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {slip ? (
             <ScrollArea className="h-full pr-4">
               <SalarySlipDisplay slip={slip} />
             </ScrollArea>
          ) : (
            <div className="grid gap-6 py-4">
              {activeAdvance && (
                <Alert className="bg-primary/5 border-primary/20">
                  <AlertTitle className="text-primary font-bold">Active Advance Detected</AlertTitle>
                  <AlertDescription>
                    Outstanding balance: {activeAdvance.remainingBalance.toLocaleString('en-IN')} INR.
                    A monthly installment of {advanceDeduction.toLocaleString('en-IN')} INR will be deducted.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="base-salary" className="text-right">Base Salary</Label>
                <Input 
                  id="base-salary" 
                  value={`${employee.monthlyBaseSalary.toLocaleString('en-IN')} INR`} 
                  disabled 
                  className="col-span-3 bg-secondary/50" 
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="advance-deduction" className="text-right font-semibold">Deduction</Label>
                <div className="col-span-3">
                  <Input
                    id="advance-deduction"
                    type="number"
                    value={advanceDeduction}
                    onChange={(e) => setAdvanceDeduction(parseFloat(e.target.value) || 0)}
                    className="border-primary/50 focus:ring-primary"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Repayment amount for this month's payroll.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold text-primary">Net Pay</Label>
                <div className="col-span-3 text-xl font-bold text-primary">
                  {(employee.monthlyBaseSalary - advanceDeduction).toLocaleString('en-IN')} INR
                </div>
              </div>
            </div>
          )}

          {error && (
              <Alert variant="destructive" className="mt-4">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
              </Alert>
          )}
        </div>

        <DialogFooter className="mt-6">
          {slip ? (
            <div className="flex w-full justify-between items-center">
                <Button type="button" variant="ghost" onClick={resetState}>Back to Edit</Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => window.print()}>Print</Button>
                  <Button type="button" onClick={handleDownloadPdf}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
            </div>
          ) : (
            <Button type="button" onClick={handleGenerate} disabled={isPending || loadingAdvances} className="w-full">
                {(isPending || loadingAdvances) ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Generate AI Verified Slip
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}