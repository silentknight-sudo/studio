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
import type { Employee } from '@/lib/types';
import { departments, teams } from '@/lib/mock-data';
import React from 'react';

const employeeSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['Admin', 'Manager', 'Employee']),
  departmentId: z.string().min(1, 'Department is required'),
  teamId: z.string().optional(),
  monthlyBaseSalary: z.coerce.number().min(0, 'Salary must be a positive number'),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  employee?: Employee;
  onSave: (data: EmployeeFormData) => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function EmployeeForm({ employee, onSave, isOpen, onOpenChange }: EmployeeFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
  });

  React.useEffect(() => {
    if (isOpen) {
        reset({
            fullName: employee?.fullName || '',
            email: employee?.email || '',
            role: employee?.role || 'Employee',
            departmentId: employee?.departmentId || '',
            teamId: employee?.teamId || undefined,
            monthlyBaseSalary: employee?.monthlyBaseSalary || 0,
        });
    }
  }, [isOpen, employee, reset]);


  const onSubmit = (data: EmployeeFormData) => {
    onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{employee ? 'Edit Employee' : 'New Employee'}</DialogTitle>
          <DialogDescription>
            {employee ? 'Update the details of the employee.' : 'Add a new employee to the system.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" {...register('fullName')} />
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
           <div>
            <Label htmlFor="role">Role</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Employee">Employee</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
          </div>
          <div>
            <Label htmlFor="departmentId">Department</Label>
            <Controller
              name="departmentId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger id="departmentId">
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.departmentId && <p className="text-sm text-destructive">{errors.departmentId.message}</p>}
          </div>
          <div>
            <Label htmlFor="monthlyBaseSalary">Monthly Salary</Label>
            <Input id="monthlyBaseSalary" type="number" {...register('monthlyBaseSalary')} />
            {errors.monthlyBaseSalary && <p className="text-sm text-destructive">{errors.monthlyBaseSalary.message}</p>}
          </div>
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
