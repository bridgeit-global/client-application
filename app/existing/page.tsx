'use client';

import { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { createClient, createPublicClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/landing/header';
import Footer from '@/components/layout/landing/footer';
import Loading from '../portal/loading';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

const formSchema = z.object({
    first_name: z.string().min(2, 'First name must be at least 2 characters'),
    last_name: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
    phone: z.string().min(10, 'Please enter a valid phone number').optional().or(z.literal('')),
    company_name: z.string().min(2, 'Company name must be at least 2 characters'),
    document_type: z.enum(['gst', 'pan', 'cin'], {
        required_error: "Please select a document type"
    }),
    gst_number: z.string()
        .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please enter a valid GST number')
        .optional()
        .or(z.literal('')),
    pan_number: z.string()
        .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN number')
        .optional()
        .or(z.literal('')),
    cin_number: z.string()
        .regex(/^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/, 'Please enter a valid CIN number')
        .optional()
        .or(z.literal(''))
}).refine((data) => data.email || data.phone, {
    message: "Either email or phone number is required",
    path: ["email"]
}).refine((data) => {
    if (data.document_type === 'gst') return !!data.gst_number;
    if (data.document_type === 'pan') return !!data.pan_number;
    if (data.document_type === 'cin') return !!data.cin_number;
    return true;
}, {
    message: "Please enter the document number",
    path: ["gst_number"]
});

type FormData = z.infer<typeof formSchema>;

type DocumentType = 'gst' | 'pan' | 'cin';

interface ContactRequest {
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    company_name: string;
    document_type: DocumentType;
    document_number: string;
    created_at: string;
    step_completed: number;
    status: 'pending' | 'approved' | 'rejected';
}

function SignUpContent() {
    const searchParams = useSearchParams();
    const phone = searchParams.get("phone");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const supabase = createPublicClient();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            company_name: '',
            email: '',
            phone: phone || '',
            document_type: undefined,
            gst_number: '',
            pan_number: '',
            cin_number: ''
        }
    });

    const documentType = form.watch('document_type');

    const onSubmit = async (values: FormData) => {
        try {
            setIsSubmitting(true);
            const currentDate = new Date().toISOString();

            const documentNumber = values.document_type === 'gst' ? values.gst_number :
                values.document_type === 'pan' ? values.pan_number :
                    values.cin_number;

            const user = await supabase.auth.getUser();
            const org_id = user.data.user?.user_metadata?.org_id;
            const { error } = await supabase
                .from('user_requests')
                .insert([
                    {
                        first_name: values.first_name,
                        last_name: values.last_name,
                        email: values.email,
                        phone: values.phone,
                        company_name: values.company_name,
                        document_type: values.document_type,
                        document_number: documentNumber,
                        created_at: currentDate,
                        request_type: 'user-request',
                        org_id: org_id
                    }
                ]);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Your request has been submitted successfully",
            });

            router.push('/');
        } catch (error) {
            console.error('Error submitting form:', error);
            toast({
                title: "Error",
                description: "There was an error submitting your request. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Header />
            <div className="w-full relative min-h-screen bg-theme-gradient-animate">
                {/* Mesh overlay */}
                <div className="absolute inset-0 bg-theme-mesh pointer-events-none" />
                <div className="container relative h-screen max-w-2xl overflow-y-auto py-10 pt-16">
                    <Card className="bg-white/10 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-2xl text-white">Request for User Access</CardTitle>
                            <CardDescription className="text-white/80">
                                Get in touch with us to learn more about BridgeIT&apos;s electricity management platform
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <FormField
                                                control={form.control}
                                                name="first_name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-white">First Name *</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter your first name"
                                                                {...field}
                                                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-red-200" />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="last_name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-white">Last Name *</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter your last name"
                                                                {...field}
                                                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-red-200" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-white">Email</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="email"
                                                                placeholder="Enter your email"
                                                                {...field}
                                                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-red-200" />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-white">Phone Number</FormLabel>
                                                        <FormControl>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm text-white/80">+91</p>
                                                                <Input
                                                                    maxLength={10}
                                                                    type="tel"
                                                                    placeholder="Enter phone number"
                                                                    {...field}
                                                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage className="text-red-200" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="company_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-white">Company Name *</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Enter your company name"
                                                            {...field}
                                                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-red-200" />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="document_type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-white">Document Type *</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                                                <SelectValue placeholder="Select document type" className="text-white/50" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="bg-white/10 backdrop-blur-sm border-white/20">
                                                            <SelectItem value="gst" className="text-white hover:bg-white/20">GST</SelectItem>
                                                            <SelectItem value="pan" className="text-white hover:bg-white/20">PAN</SelectItem>
                                                            <SelectItem value="cin" className="text-white hover:bg-white/20">CIN</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage className="text-red-200" />
                                                </FormItem>
                                            )}
                                        />

                                        {documentType === 'gst' && (
                                            <FormField
                                                control={form.control}
                                                name="gst_number"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-white">GST Number *</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter GST number (e.g., 27ABCDE1234F1Z5)"
                                                                {...field}
                                                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-red-200" />
                                                    </FormItem>
                                                )}
                                            />
                                        )}

                                        {documentType === 'pan' && (
                                            <FormField
                                                control={form.control}
                                                name="pan_number"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-white">PAN Number *</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter PAN number (e.g., ABCDE1234F)"
                                                                {...field}
                                                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-red-200" />
                                                    </FormItem>
                                                )}
                                            />
                                        )}

                                        {documentType === 'cin' && (
                                            <FormField
                                                control={form.control}
                                                name="cin_number"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-white">CIN Number *</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter CIN number (e.g., U12345AB6789CDE123456)"
                                                                {...field}
                                                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-red-200" />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            'Submit'
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <Footer />
        </>
    );
}

export default function SignUpPage() {
    return (
        <Suspense fallback={<Loading />}>
            <SignUpContent />
        </Suspense>
    );
}
