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
import { createPublicClient } from '@/lib/supabase/client';
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

            // Note: User requests are now handled through the external API
            // that creates auth users directly. This form submission should
            // trigger the user invitation flow via the external service.
            // For now, we'll show a message that the request has been submitted.
            
            toast({
                title: "Request Submitted",
                description: "Your request has been submitted. An admin will review and approve your access.",
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
        <div className="relative flex min-h-screen flex-col">
            <div className="pointer-events-none absolute inset-0 bg-theme-mesh" aria-hidden="true" />
            <Header />
            <main className="relative z-10 flex flex-1 flex-col pt-24 pb-16">
                <section className="container relative z-10 flex-1 px-4">
                    <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
                        <div className="space-y-6 text-white">
                            <span className="inline-flex w-fit items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white/70">
                                Existing customers
                            </span>
                            <div className="space-y-4">
                                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                                    Request user access
                                </h1>
                                <p className="max-w-xl text-base text-white/70 md:text-lg">
                                    Add teammates to your BridgeIT workspace in a few steps. Share their details and supporting document information so our team can enable secure access quickly.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Button
                                    variant="outline"
                                    className="h-auto justify-start gap-3 rounded-xl border-white/20 bg-white/5 px-6 py-4 text-left text-white transition hover:bg-white/10"
                                    asChild
                                >
                                    <a href="tel:9970257506">
                                        <span className="block text-xs uppercase tracking-wide text-white/60">Call Us</span>
                                        <span className="text-lg font-medium text-primary">+91 99702 57506</span>
                                    </a>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-auto justify-start gap-3 rounded-xl border-white/20 bg-white/5 px-6 py-4 text-left text-white transition hover:bg-white/10"
                                    asChild
                                >
                                    <a href="mailto:support@bridgeit.in">
                                        <span className="block text-xs uppercase tracking-wide text-white/60">Email Us</span>
                                        <span className="text-lg font-medium text-primary">support@bridgeit.in</span>
                                    </a>
                                </Button>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm md:p-8">
                                <h2 className="text-lg font-semibold text-white md:text-xl">What happens next</h2>
                                <ul className="mt-4 space-y-4 text-sm text-white/70 md:text-base">
                                    <li className="flex gap-3">
                                        <span className="mt-2 h-2 w-2 rounded-full bg-primary" />
                                        <div>
                                            <span className="font-medium text-white">Review & verification.</span> We validate the document details you provide to keep your organization&apos;s data secure.
                                        </div>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="mt-2 h-2 w-2 rounded-full bg-primary" />
                                        <div>
                                            <span className="font-medium text-white">Response within 1 business day.</span> Our support team gets in touch with status updates or follow-up questions.
                                        </div>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="mt-2 h-2 w-2 rounded-full bg-primary" />
                                        <div>
                                            <span className="font-medium text-white">Access confirmation.</span> Approved users receive onboarding instructions and login credentials over email.
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <Card className="relative overflow-hidden border border-white/10 bg-white/5 shadow-xl backdrop-blur-sm">
                            <CardHeader className="space-y-2 border-b border-white/10 bg-white/[0.03]">
                                <CardTitle className="text-2xl text-white">Request for User Access</CardTitle>
                                <CardDescription className="text-white/70">
                                    Share the details of the colleague who needs access to your BridgeIT portal.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8">
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                                                                    placeholder="Jordan"
                                                                    {...field}
                                                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:border-primary/60 focus-visible:ring-primary/40"
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
                                                                    placeholder="Singh"
                                                                    {...field}
                                                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:border-primary/60 focus-visible:ring-primary/40"
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
                                                                    placeholder="name@company.com"
                                                                    {...field}
                                                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:border-primary/60 focus-visible:ring-primary/40"
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
                                                                <div className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/40">
                                                                    <span className="text-sm font-medium text-white/80">+91</span>
                                                                    <Input
                                                                        maxLength={10}
                                                                        type="tel"
                                                                        placeholder="9876543210"
                                                                        {...field}
                                                                        className="h-10 border-0 bg-transparent px-0 text-white placeholder:text-white/50 focus-visible:ring-0"
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
                                                                placeholder="BridgeIT Pvt. Ltd."
                                                                {...field}
                                                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:border-primary/60 focus-visible:ring-primary/40"
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
                                                                <SelectTrigger className="bg-white/10 border-white/20 text-white focus:ring-primary/40 focus:border-primary/60">
                                                                    <SelectValue placeholder="Select document type" className="text-white/50" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className="border border-white/10 bg-slate-950/90 backdrop-blur-sm">
                                                                <SelectItem value="gst" className="text-white hover:bg-white/10">GST</SelectItem>
                                                                <SelectItem value="pan" className="text-white hover:bg-white/10">PAN</SelectItem>
                                                                <SelectItem value="cin" className="text-white hover:bg-white/10">CIN</SelectItem>
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
                                                                    placeholder="27ABCDE1234F1Z5"
                                                                    {...field}
                                                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:border-primary/60 focus-visible:ring-primary/40"
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
                                                                    placeholder="ABCDE1234F"
                                                                    {...field}
                                                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:border-primary/60 focus-visible:ring-primary/40"
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
                                                                    placeholder="U12345AB6789CDE123456"
                                                                    {...field}
                                                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:border-primary/60 focus-visible:ring-primary/40"
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
                                            className="w-full bg-primary text-primary-foreground transition hover:bg-primary/90"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                'Submit request'
                                            )}
                                        </Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}

export default function SignUpPage() {
    return (
        <Suspense fallback={<Loading />}>
            <SignUpContent />
        </Suspense>
    );
}
