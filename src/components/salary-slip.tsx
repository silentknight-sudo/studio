import type { SalarySlip } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArogyaBioLogo } from '@/components/icons';
import { Badge } from './ui/badge';

interface SalarySlipDisplayProps {
  slip: SalarySlip;
}

export function SalarySlipDisplay({ slip }: SalarySlipDisplayProps) {
  const { employeeDetails, salaryMonth, grossSalary, advanceDeduction, netPayableSalary, explanation } = slip;

  return (
    <div className="bg-card text-card-foreground" id="salary-slip-printable">
        <style type="text/css">
        {\`
        @media print {
            body * {
                visibility: hidden;
            }
            #salary-slip-printable, #salary-slip-printable * {
                visibility: visible;
            }
            #salary-slip-printable {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
            }
            @page {
                size: auto;
                margin: 0.5in;
            }
        }
        \`}
        </style>
      <Card className="w-full border-2 border-primary shadow-2xl">
        <CardHeader className="bg-primary/5">
          <div className="flex items-center justify-between">
            <ArogyaBioLogo className="h-12 w-auto" />
            <div className="text-right">
              <CardTitle className="font-headline text-2xl text-primary">Salary Slip</CardTitle>
              <p className="text-muted-foreground">{salaryMonth}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-primary">Employee Details</h3>
              <Separator className="my-2" />
              <p><strong>Employee ID:</strong> {employeeDetails.employeeId}</p>
              <p><strong>Full Name:</strong> {employeeDetails.fullName}</p>
              <p><strong>Department:</strong> {employeeDetails.department}</p>
              <p><strong>Date of Joining:</strong> {employeeDetails.dateOfJoining}</p>
            </div>
             <div>
              <h3 className="font-semibold text-primary">Company Details</h3>
              <Separator className="my-2" />
              <p><strong>Arogya Bio</strong></p>
              <p>123 Biotech Lane</p>
              <p>Science City, SC 45678</p>
            </div>
          </div>
          
          <Separator className="my-6" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="mb-2 font-semibold">Earnings</h3>
              <div className="flex justify-between border-b py-2">
                <span>Gross Salary</span>
                <span>{grossSalary.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 })}</span>
              </div>
               <div className="flex justify-between font-bold pt-2">
                <span>Total Earnings</span>
                <span>{grossSalary.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Deductions</h3>
              <div className="flex justify-between border-b py-2">
                <span>Advance Deduction</span>
                <span>{advanceDeduction.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold pt-2">
                <span>Total Deductions</span>
                <span>{advanceDeduction.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 rounded-lg bg-primary/5 p-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">NET PAYABLE SALARY</p>
            <p className="font-headline text-3xl font-bold text-primary">{netPayableSalary.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 })}</p>
          </div>

          {explanation && (
            <div className="mt-6">
              <h3 className="font-semibold text-primary">Notes & Explanations</h3>
              <Separator className="my-2" />
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p>{explanation}</p>
              </div>
            </div>
          )}

          <div className="mt-8 text-center text-xs text-muted-foreground">
            This is a computer-generated salary slip and does not require a signature.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
