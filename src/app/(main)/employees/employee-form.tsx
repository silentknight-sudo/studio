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
import { Textarea } from '@/components/ui/textarea';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Employee, Department } from '@/lib/types';
import React from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, CollectionReference } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';

const employeeSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  role: z.enum(['Admin', 'Manager', 'Employee']),
  departmentId: z.string().min(1, 'Department is required'),
  monthlyBaseSalary: z.coerce.number().min(0, 'Salary must be a positive number'),
  dateOfJoining: z.string().min(1, 'Date of joining is required'),
  status: z.enum(['Active', 'Inactive']),
  profilePhotoUrl: z.string().url('Invalid photo URL').or(z.literal('')).optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;

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

  const firestore = useFirestore();
  const { data: departments } = useCollection<Department>(
    collection(firestore, 'departments') as CollectionReference<Department>
  );

  React.useEffect(() => {
    if (isOpen) {
        reset({
            fullName: employee?.fullName || '',
            email: employee?.email || '',
            phone: employee?.phone || '',
            role: employee?.role || 'Employee',
            departmentId: employee?.departmentId || '',
            monthlyBaseSalary: employee?.monthlyBaseSalary || 0,
            dateOfJoining: employee?.dateOfJoining || new Date().toISOString().split('T')[0],
            status: employee?.status || 'Active',
            profilePhotoUrl: employee?.profilePhotoUrl || '',
            address: employee?.address || '',
            emergencyContact: employee?.emergencyContact || '',
        });
    }
  }, [isOpen, employee, reset]);

  const onSubmit = (data: EmployeeFormData) => {
    onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="font-headline text-2xl">{employee ? 'Edit Full Record' : 'Enroll New Employee'}</DialogTitle>
          <DialogDescription>
            Modify comprehensive employment details and contact information.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" {...register('fullName')} />
                  {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Employment Status</Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Work Email</Label>
                  <Input id="email" type="email" {...register('email')} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" {...register('phone')} />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Designation</Label>
                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departmentId">Department</Label>
                  <Controller
                    name="departmentId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="departmentId">
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments?.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id!}>{dept.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfJoining">Date of Joining</Label>
                  <Input id="dateOfJoining" type="text" placeholder="YYYY-MM-DD" {...register('dateOfJoining')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyBaseSalary">Monthly Salary (INR)</Label>
                  <Input id="monthlyBaseSalary" type="number" {...register('monthlyBaseSalary')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profilePhotoUrl">Profile Photo URL</Label>
                <Input id="profilePhotoUrl" placeholder="https://images.unsplash.com/..." {...register('profilePhotoUrl')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact Details</Label>
                <Input id="emergencyContact" placeholder="Name - Phone Number" {...register('emergencyContact')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Permanent Address</Label>
                <Textarea id="address" {...register('address')} rows={3} />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 bg-muted/30">
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save Full Record</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
