'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseError } from '@/hooks/use-supabase-error';
import { useUserStore } from '@/lib/store/user-store';
import { createClient } from '@/lib/supabase/client';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be less than 200 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description must be less than 5000 characters'),
    category: z.enum(['bug', 'feature', 'support', 'other'], {
        required_error: 'Please select a category'
    })
});

type FormValues = z.infer<typeof formSchema>;

export const IssueReportForm = () => {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const supabase = createClient();
    const { user } = useUserStore();
    const { handleDatabaseError, clearError } = useSupabaseError();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            description: '',
            category: undefined
        }
    });

    const onSubmit = async (data: FormValues) => {
        try {
            setLoading(true);
            clearError();

            // Get current user if not in store
            let currentUser = user;
            if (!currentUser || !currentUser.id) {
                const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();
                
                if (userError) {
                    toast({
                        title: 'Error',
                        description: 'Failed to get user information. Please try again.',
                        variant: 'destructive'
                    });
                    return;
                }
                
                if (!supabaseUser) {
                    toast({
                        title: 'Error',
                        description: 'You must be logged in to report an issue.',
                        variant: 'destructive'
                    });
                    return;
                }
                
                currentUser = supabaseUser;
            }

            const org_id = currentUser.user_metadata?.org_id;
            if (!org_id) {
                toast({
                    title: 'Error',
                    description: 'Organization ID not found. Please contact support.',
                    variant: 'destructive'
                });
                return;
            }

            // Insert issue into database
            const { error: insertError } = await supabase
                .from('issues')
                .insert([
                    {
                        title: data.title.trim(),
                        description: data.description.trim(),
                        category: data.category,
                        created_by: currentUser.id,
                        org_id: org_id,
                        status: 'open'
                    }
                ]);

            if (insertError) {
                const errorMessage = handleDatabaseError(insertError);
                toast({
                    title: 'Error',
                    description: errorMessage || 'Failed to submit issue. Please try again.',
                    variant: 'destructive'
                });
                return;
            }

            // Success
            toast({
                title: 'Success',
                description: 'Issue reported successfully. We will review it soon.',
                variant: 'default'
            });

            // Reset form
            form.reset({
                title: '',
                description: '',
                category: undefined
            });
        } catch (error: any) {
            console.error('Error submitting issue:', error);
            toast({
                title: 'Error',
                description: error?.message || 'An unexpected error occurred. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select 
                                        onValueChange={field.onChange} 
                                        defaultValue={field.value}
                                        disabled={loading}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="bug">Bug</SelectItem>
                                            <SelectItem value="feature">Feature Request</SelectItem>
                                            <SelectItem value="support">Support</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter a brief title for your issue"
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
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Provide a detailed description of the issue or feature request..."
                                            disabled={loading}
                                            className="min-h-[120px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => form.reset()}
                                disabled={loading}
                            >
                                Clear
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Issue'
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
    );
};
