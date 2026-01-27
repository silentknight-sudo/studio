'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/firebase';
import { updatePassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Moon, Sun, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const passwordSchema = z.object({
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

function AccountSettings() {
    const auth = useAuth();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
    });

    const onSubmit = async (data: PasswordFormData) => {
        if (!auth.currentUser) return;
        
        setIsSaving(true);
        try {
            await updatePassword(auth.currentUser, data.newPassword);
            toast({
                title: 'Password updated',
                description: 'Your password has been successfully changed.',
            });
            reset();
        } catch (error: any) {
            console.error('Error updating password:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to update password. You might need to sign in again.',
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password. It's recommended to use a strong, unique password.</CardDescription>
            </CardHeader>
            <CardContent>
                 <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" type="password" {...register('newPassword')} />
                        {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
                        {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

function AppearanceSettings() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        const initialTheme = storedTheme || 'light';
        setTheme(initialTheme);
        document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    }, []);

    const handleThemeChange = (isDark: boolean) => {
        const newTheme = isDark ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel of the application.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                        <h3 className="font-medium">Theme</h3>
                        <p className="text-sm text-muted-foreground">Select between light and dark mode.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Sun className="h-5 w-5" />
                        <Switch
                            checked={theme === 'dark'}
                            onCheckedChange={handleThemeChange}
                        />
                        <Moon className="h-5 w-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}


export default function SettingsPage() {
    return (
        <div className="w-full space-y-6">
            <h1 className="text-3xl font-bold font-headline">Settings</h1>
             <Tabs defaultValue="account" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="appearance">Appearance</TabsTrigger>
                </TabsList>
                <TabsContent value="account" className="mt-6">
                    <AccountSettings />
                </TabsContent>
                <TabsContent value="appearance" className="mt-6">
                    <AppearanceSettings />
                </TabsContent>
            </Tabs>
        </div>
    );
}
