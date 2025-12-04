'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/components/ui/use-toast';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { LoadingButton } from '../buttons/loading-button';
import { createClient } from '@/lib/supabase/client';

const formSchema = z.object({
    phone_no: z.string().min(10, 'Please enter a valid phone number'),
    first_name: z.string().min(1, 'Please enter a valid first name'),
    last_name: z.string().min(1, 'Please enter a valid last name'),
    email: z.string().email('Please enter a valid email address').optional(),
    role: z.enum(['admin', 'user', 'operator'], {
        required_error: 'Please select a role'
    })
}).refine((data) => {
    // Make email required for admin and user roles, optional for operator
    if ((data.role === 'admin' || data.role === 'user') && (!data.email || data.email.trim() === '')) {
        return false;
    }
    return true;
}, {
    message: 'Email is required for this role',
    path: ['email']
});

type FormValues = z.infer<typeof formSchema>;

export const UserForm = ({ handleClose }: { handleClose?: () => void }) => {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const supabase = createClient();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            phone_no: '',
            first_name: '',
            last_name: '',
            email: undefined,
            role: 'user'
        }
    });

    const onSubmit = async (data: FormValues) => {
        try {
            setLoading(true);
            const user = await supabase.auth.getUser();
            const org_id = user.data.user?.user_metadata?.org_id;
            const response = await fetch(`${process.env.NEXT_PUBLIC_UPLOAD_PDF_URL}organization/user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    body: {
                        requestType: "invitation",
                        phoneNumber: data.phone_no,
                        firstName: data.first_name,
                        lastName: data.last_name,
                        email: data.email || undefined,
                        role: data.role,
                        url: `https://${window.location.host}`,
                        orgId: org_id
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            toast({
                title: 'Success',
                variant: 'success',
                description: 'Phone number registered successfully'
            });
            handleClose?.();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="phone_no"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">+91</span>
                                    <Input
                                        maxLength={10}
                                        type="tel"
                                        placeholder="Enter phone number"
                                        disabled={loading}
                                        {...field}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Enter first name"
                                    disabled={loading}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Enter last name"
                                    disabled={loading}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input
                                    type="email"
                                    placeholder="Enter email address"
                                    disabled={loading}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="operator">Operator</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <LoadingButton loading={loading} type="submit">
                        Submit
                    </LoadingButton>
                </div>
            </form>
        </Form>
    );
}; 