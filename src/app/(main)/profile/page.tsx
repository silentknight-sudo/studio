'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, useUser, useFirestore, useDoc } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { addOrUpdateDoc } from '@/lib/firebase-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const profileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  photoURL: z.string().url('Must be a valid URL').or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>(
    user ? doc(firestore, 'users', user.uid) : null
  );
  const { toast } = useToast();
  const [isSaving, setIsSaving] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  React.useEffect(() => {
    if (user) {
      reset({
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: data.displayName,
        photoURL: data.photoURL,
      });

      // Update Firestore user profile
      await addOrUpdateDoc(firestore, `users/${user.uid}`, {
        displayName: data.displayName,
        photoURL: data.photoURL,
      });

      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update profile.',
      });
    } finally {
        setIsSaving(false);
    }
  };
  
  const isLoading = userLoading || profileLoading;

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold font-headline mb-6">My Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details here.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || ''} />
                        <AvatarFallback>{user?.displayName?.[0] || user?.email?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-xl font-semibold">{user?.displayName}</h2>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                        <p className="text-sm text-muted-foreground">Role: {userProfile?.role}</p>
                    </div>
                </div>

              <div className="grid gap-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input id="displayName" {...register('displayName')} />
                {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="photoURL">Photo URL</Label>
                <Input id="photoURL" placeholder="https://example.com/avatar.png" {...register('photoURL')} />
                {errors.photoURL && <p className="text-sm text-destructive">{errors.photoURL.message}</p>}
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
