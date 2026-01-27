'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Advance } from '@/lib/types';
import { employees } from '@/lib/mock-data';
import React from 'react';

const advanceSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  repaymentType: z.enum(['Single-month', 'Multi-month']),
  installments: z.coerce.number().min(1).optional(),
});

type AdvanceFormData = z.infer<typeof advanceSchema>;

interface AdvanceFormProps {
  advance?: Advance;
  onSave: (data: AdvanceFormData) => void;
  children: React.ReactNode;
}

export function AdvanceForm({ advance, onSave, children }: AdvanceFormProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<AdvanceFormData>({
    resolver: zodResolver(advanceSchema),
    defaultValues: {
        employeeId: advance?.employeeId || '',
        amount: advance?.amount || 0,
        repaymentType: advance?.repaymentType || 'Single-month',
        installments: advance?.installments || 1,
    },
  });

  const repaymentType = watch('repaymentType');

  const onSubmit = (data: AdvanceFormData) => {
    if (data.repaymentType === 'Single-month') {
        data.installments = 1;
    }
    onSave(data);
    setIsOpen(false);
    reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{advance ? 'Edit Advance' : 'New Advance'}</DialogTitle>
          <DialogDescription>
            {advance ? 'Update the salary advance details.' : 'Issue a new salary advance.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div>
            <Label htmlFor="employeeId">Employee</Label>
            <Controller
              name="employeeId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger id="employeeId">
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.employeeId && <p className="text-sm text-destructive">{errors.employeeId.message}</p>}
          </div>
           <div>
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" type="number" {...register('amount')} />
            {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
          </div>
          <div>
            <Label htmlFor="repaymentType">Repayment Type</Label>
            <Controller
              name="repaymentType"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger id="repaymentType">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single-month">Single-month</SelectItem>
                    <SelectItem value="Multi-month">Multi-month</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          {repaymentType === 'Multi-month' && (
            <div>
              <Label htmlFor="installments">Installments</Label>
              <Input id="installments" type="number" min="2" {...register('installments')} />
              {errors.installments && <p className="text-sm text-destructive">{errors.installments.message}</p>}
            </div>
          )}
          <DialogFooter>
             <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
