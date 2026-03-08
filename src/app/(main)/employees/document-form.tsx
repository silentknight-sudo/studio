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
import type { EmployeeDocument } from '@/lib/types';
import React from 'react';

const documentSchema = z.object({
  name: z.string().min(1, 'Document name is required'),
  type: z.enum(['Contract', 'ID Proof', 'Tax Form', 'Other']),
  uploadDate: z.string().min(1, 'Upload date is required'),
  fileUrl: z.string().url('Invalid file URL').or(z.literal('')).optional(),
});

export type DocumentFormData = z.infer<typeof documentSchema>;

interface DocumentFormProps {
  onSave: (data: DocumentFormData) => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function DocumentForm({ onSave, isOpen, onOpenChange }: DocumentFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      name: '',
      type: 'Contract',
      uploadDate: new Date().toISOString().split('T')[0],
      fileUrl: '',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        name: '',
        type: 'Contract',
        uploadDate: new Date().toISOString().split('T')[0],
        fileUrl: '',
      });
    }
  }, [isOpen, reset]);

  const onSubmit = (data: DocumentFormData) => {
    onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Compliance Document</DialogTitle>
          <DialogDescription>
            Attach metadata for a new document to this employee profile.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div>
            <Label htmlFor="docName">Document Name</Label>
            <Input id="docName" placeholder="e.g. Passport Copy" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="docType">Classification</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger id="docType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="ID Proof">ID Proof</SelectItem>
                    <SelectItem value="Tax Form">Tax Form</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label htmlFor="uploadDate">Date of Document</Label>
            <Input id="uploadDate" type="text" placeholder="YYYY-MM-DD" {...register('uploadDate')} />
            {errors.uploadDate && <p className="text-sm text-destructive">{errors.uploadDate.message}</p>}
          </div>
          <div>
            <Label htmlFor="fileUrl">Reference Link (Optional)</Label>
            <Input id="fileUrl" placeholder="https://cloud-storage.com/file" {...register('fileUrl')} />
            {errors.fileUrl && <p className="text-sm text-destructive">{errors.fileUrl.message}</p>}
          </div>
          <DialogFooter>
             <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit">Add Document</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
