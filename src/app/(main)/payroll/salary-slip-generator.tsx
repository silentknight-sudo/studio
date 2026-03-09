'use client';

import React, { useState, useTransition, useEffect, useMemo, useCallback } from 'react';
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
import { Loader2, Download, Printer } from 'lucide-react';
import type { Employee, SalarySlip, Department, Team, Advance, Payroll } from '@/lib/types';
import { generateSalarySlipAction } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SalarySlipDisplay } from '@/components/salary-slip';
import { useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, query, collection, where } from 'firebase/firestore';
import { addOrUpdateDoc } from '@/lib/firebase-utils';

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

  const advancesQuery = useMemo(() => {
    if (!firestore || !employee.id) return null;
    return query(collection(firestore, 'advances'), where('employeeId', '==', employee.id));
  }, [firestore, employee.id]);
  
  const { data: advances, loading: loadingAdvances } = useCollection<Advance>(advancesQuery);

  useEffect(() => {
    if (advances && advances.length > 0) {
        const unpaidAdvances = advances.filter(a => a.remainingBalance > 0);
        if (unpaidAdvances.length > 0) {
            const advance = unpaidAdvances[0];
            setActiveAdvance(advance);
            const monthlyInstallment = advance.amount / (advance.installments || 1);
            const deduction = Math.min(advance.remainingBalance, monthlyInstallment);
            setAdvanceDeduction(Math.round(deduction * 100) / 100);
        } else {
            setActiveAdvance(null);
            setAdvanceDeduction(0);
        }
    }
  }, [advances]);

  const handleGenerate = useCallback(() => {
    startTransition(async () => {
      setError(null);
      try {
        const result = await generateSalarySlipAction({
          employeeId: employee.id!,
          advanceDeduction: advanceDeduction,
        }, employee, department || null, team || null);

        if (result.success && result.data) {
          setSlip(result.data);

          // Atomic persistence of payroll record
          await addOrUpdateDoc<Omit<Payroll, 'id'>>(firestore, 'payrolls', {
              employeeId: employee.id!,
              month: result.data.salaryMonth,
              grossSalary: result.data.grossSalary,
              advanceDeduction: result.data.advanceDeduction,
              netPayableSalary: result.data.netPayableSalary,
          });

          // Balance reduction for advances
          if (activeAdvance && advanceDeduction > 0) {
              const newRemainingBalance = Math.max(0, activeAdvance.remainingBalance - advanceDeduction);
              await addOrUpdateDoc<Partial<Advance>>(firestore, `advances/${activeAdvance.id}`, {
                  remainingBalance: newRemainingBalance,
              });
          }
        } else {
          setError(result.error || 'The AI service is temporarily unavailable.');
        }
      } catch (err) {
        setError('System failure while processing payroll. Please check your connection.');
      }
    });
  }, [employee, advanceDeduction, department, team, activeAdvance, firestore]);

  const resetState = () => {
    setSlip(null);
    setError(null);
  };

  /**
   * PDF Generation with Hosting Optimization
   * Uses dynamic imports to prevent SSR issues and reduce initial bundle size.
   */
  const handleDownloadPdf = async () => {
    const slipElement = document.getElementById('salary-slip-printable');
    if (!slipElement) return;

    try {
      // Dynamic imports for heavy PDF libraries
      const [html2canvas, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);

      const canvas = await html2canvas.default(slipElement, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Payslip_${employee.fullName.replace(/\s+/g, '_')}_${slip?.salaryMonth}.pdf`);
    } catch (err) {
      console.error('PDF Render Error:', err);
      setError('Failed to render PDF. Please try printing instead.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open) resetState(); setIsOpen(open); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Generate Slip</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl text-primary">Arogya Payroll Engine</DialogTitle>
          <DialogDescription>Generates an audit-ready salary slip with AI verification.</DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {slip ? (
             <ScrollArea className="h-full pr-4">
               <SalarySlipDisplay slip={slip} />
             </ScrollArea>
          ) : (
            <div className="space-y-6 py-4">
              {activeAdvance && (
                <Alert className="bg-primary/5 border-primary/20">
                  <AlertTitle className="text-primary font-bold">Active Advance Policy Applied</AlertTitle>
                  <AlertDescription>
                    Outstanding: {activeAdvance.remainingBalance.toLocaleString('en-IN')} INR. 
                    Calculated installment: {advanceDeduction.toLocaleString('en-IN')} INR.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Base Salary</Label>
                  <div className="col-span-3 font-mono bg-muted p-2 rounded text-sm font-bold">
                    {employee.monthlyBaseSalary.toLocaleString('en-IN')} INR
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="advance-deduction" className="text-right font-semibold">Deduction</Label>
                  <div className="col-span-3">
                    <Input
                      id="advance-deduction"
                      type="number"
                      value={advanceDeduction}
                      onChange={(e) => setAdvanceDeduction(parseFloat(e.target.value) || 0)}
                      className="border-primary/30"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Adjust if manual override is required.</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4 pt-4 border-t">
                  <Label className="text-right font-bold text-primary">Net Payable</Label>
                  <div className="col-span-3 text-2xl font-bold text-primary">
                    {(employee.monthlyBaseSalary - advanceDeduction).toLocaleString('en-IN')} INR
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4 animate-in fade-in slide-in-from-top-1">
              <AlertTitle>Operation Failed</AlertTitle>
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="mt-6 sm:justify-between">
          {slip ? (
            <>
              <Button type="button" variant="ghost" onClick={resetState}>Recalculate</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4"/>Print</Button>
                <Button onClick={handleDownloadPdf}><Download className="mr-2 h-4 w-4"/>PDF</Button>
              </div>
            </>
          ) : (
            <Button onClick={handleGenerate} disabled={isPending || loadingAdvances} className="w-full">
                {(isPending || loadingAdvances) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? 'Processing AI Logic...' : 'Generate & Persist Payroll'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
