'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import type { Advance, Employee } from '@/lib/types';
import React from 'react';
import { useCollection } from '@/firebase';
import { CollectionReference, collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const advanceSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  issueDate: z.string().min(1, 'Issue date is required'),
  repaymentType: z.enum(['Single-month', 'Multi-month']),
  installments: z.coerce.number().min(1).optional(),
});

export type AdvanceFormData = z.infer<typeof advanceSchema>;

interface AdvanceFormProps {
  advance?: Advance;
  onSave: (data: AdvanceFormData) => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AdvanceForm({ advance, onSave, isOpen, onOpenChange }: AdvanceFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<AdvanceFormData>({
    resolver: zodResolver(advanceSchema),
  });

  const repaymentType = watch('repaymentType');
  const firestore = useFirestore();
  const { data: employees } = useCollection(
    collection(firestore, 'employees') as CollectionReference<Employee>
  );

  React.useEffect(() => {
    if (isOpen) {
      reset({
          employeeId: advance?.employeeId || '',
          amount: advance?.amount || 0,
          issueDate: advance?.issueDate || new Date().toISOString().split('T')[0],
          repaymentType: advance?.repaymentType || 'Single-month',
          installments: advance?.installments || 1,
      });
    }
  }, [isOpen, advance, reset]);

  const onSubmit = (data: AdvanceFormData) => {
    if (data.repaymentType === 'Single-month') {
        data.installments = 1;
    }
    onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!advance}>
                  <SelectTrigger id="employeeId">
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees?.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id!}>
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
            <Label htmlFor="issueDate">Issue Date</Label>
            <Controller
              name="issueDate"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(new Date(field.value), 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.issueDate && <p className="text-sm text-destructive">{errors.issueDate.message}</p>}
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
