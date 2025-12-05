'use client';

import { useState, Suspense, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { createPublicClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/landing/header';
import Footer from '@/components/layout/landing/footer';
import Loading from '../portal/loading';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address').optional(),
  phone: z.string().min(10, 'Please enter a valid phone number').optional(),
  designation: z.string().min(2, 'Please enter your designation'),
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
  business_type: z.string().optional(),
  number_of_locations: z.string().optional(),
  average_monthly_bill: z.string().optional(),
  pan: z.string().min(10, 'Please enter a valid PAN number'),
  gst: z.string().min(15, 'Please enter a valid GST number'),
  cin: z.string().min(15, 'Please enter a valid CIN number')
}).refine((data) => data.email || data.phone, {
  message: "Either email or phone number is required",
  path: ["email"]
});

type FormData = z.infer<typeof formSchema>;

const steps = [
  {
    id: 'contact',
    name: 'Contact Information',
    description: 'Your personal contact details'
  },
  {
    id: 'company',
    name: 'Company Details',
    description: 'Basic information about your company'
  },
  {
    id: 'business',
    name: 'Business Information',
    description: 'Additional business details'
  }
];

function SignUpContent() {
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(undefined);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const router = useRouter();
  const supabasePublic = createPublicClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_name: '',
      business_type: '',
      email: '',
      phone: phone || '',
      number_of_locations: '',
      average_monthly_bill: '',
      name: '',
      designation: ''
    }
  });

  const saveCurrentStep = async (values: Partial<FormData>) => {
    try {
      setIsSubmitting(true);
      const currentDate = new Date().toISOString();

      if (!requestId) {
        // First time saving - create new record
        const { data, error } = await supabasePublic
          .from('contact_requests')
          .insert([
            {
              name: values.name || '',
              email: values.email || '',
              phone: values.phone || '',
              designation: values.designation || '',
              company_name: values.company_name || '',
              business_type: values.business_type || '',
              number_of_locations: values.number_of_locations || '',
              average_monthly_bill: values.average_monthly_bill || '',
              pan: values.pan || '',
              gst: values.gst || '',
              cin: values.cin || '',
              created_at: currentDate,
              step_completed: currentStep
            }
          ])
          .select('id')
          .single();
        if (error) throw error;
        setRequestId(data.id);
      } else {
        // Update existing record
        const { error } = await supabasePublic
          .from('contact_requests')
          .update({
            ...values,
            updated_at: currentDate,
            step_completed: currentStep
          })
          .eq('id', requestId);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving step:', error);
      alert('There was an error saving your progress. Please try again.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
    return true;
  };

  const nextStep = async () => {
    const isLastStep = currentStep === steps.length - 1;

    // Validate captcha on first step
    if (currentStep === 0 && !captchaToken) {
      alert('Please complete the captcha verification before continuing.');
      return;
    }

    // Validate only the current step's fields
    let isValid = false;
    switch (currentStep) {
      case 0:
        isValid = await form.trigger(['name', 'email', 'phone']);
        break;
      case 1:
        isValid = await form.trigger(['company_name', 'designation']);
        break;
      case 2:
        isValid = await form.trigger(['business_type', 'number_of_locations', 'average_monthly_bill']);
        break;
    }

    if (isValid) {
      // Get current step's values
      const currentValues = form.getValues();

      // Save current step data
      const savedSuccessfully = await saveCurrentStep(currentValues);

      if (!savedSuccessfully) {
        // Reset captcha on error for first step
        if (currentStep === 0) {
          setCaptchaToken(undefined);
          turnstileRef.current?.reset();
        }
        return;
      }

      if (isLastStep) {
        // Send email notification only on final step
        try {
          // const response = await fetch('/api/send-contact-email', {
          //   method: 'POST',
          //   headers: {
          //     'Content-Type': 'application/json',
          //   },
          //   body: JSON.stringify(currentValues),
          // });

          // if (!response.ok) throw new Error('Failed to send email notification');

          // Redirect to home page on success
          router.push('/');
        } catch (error) {
          console.error('Error sending email:', error);
          alert('There was an error submitting your request. Please try again.');
        }
      } else {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (

          <div className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Contact Person Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your full name"
                      {...field}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </FormControl>
                  <FormMessage className="text-red-200" />
                </FormItem>
              )}
            />

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
                      <Input
                        type="tel"
                        placeholder="Enter phone number"
                        {...field}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </FormControl>
                    <FormMessage className="text-red-200" />
                  </FormItem>
                )}
              />
            </div>

            {/* Turnstile captcha on first step */}
            <div className="flex justify-center pt-2">
              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                onSuccess={(token) => {
                  setCaptchaToken(token);
                }}
                onError={() => {
                  setCaptchaToken(undefined);
                }}
                onExpire={() => {
                  setCaptchaToken(undefined);
                }}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
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
              name="designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Designation *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your designation"
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
              name="pan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">PAN Number *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter company PAN number"
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
              name="gst"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">GST Number *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter company GST number"
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
              name="cin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">CIN Number *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter company CIN number"
                      {...field}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </FormControl>
                  <FormMessage className="text-red-200" />
                </FormItem>
              )}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="business_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Business Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select business type" className="text-white/50" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white/10 backdrop-blur-sm border-white/20">
                      <SelectItem value="retail" className="text-white hover:bg-white/20">Retail</SelectItem>
                      <SelectItem value="manufacturing" className="text-white hover:bg-white/20">Manufacturing</SelectItem>
                      <SelectItem value="services" className="text-white hover:bg-white/20">Services</SelectItem>
                      <SelectItem value="technology" className="text-white hover:bg-white/20">Technology</SelectItem>
                      <SelectItem value="healthcare" className="text-white hover:bg-white/20">Healthcare</SelectItem>
                      <SelectItem value="other" className="text-white hover:bg-white/20">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-200" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="number_of_locations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Number of Locations</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter number of locations"
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
                name="average_monthly_bill"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Average Monthly Electricity Bill</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Select range" className="text-white/50" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white/10 backdrop-blur-sm border-white/20">
                        <SelectItem value="below_1cr" className="text-white hover:bg-white/20">Below ₹1 Crore</SelectItem>
                        <SelectItem value="1cr_5cr" className="text-white hover:bg-white/20">₹1 Crore - ₹5 Crore</SelectItem>
                        <SelectItem value="5cr_10cr" className="text-white hover:bg-white/20">₹5 Crore - ₹10 Crore</SelectItem>
                        <SelectItem value="10cr_50cr" className="text-white hover:bg-white/20">₹10 Crore - ₹50 Crore</SelectItem>
                        <SelectItem value="above_50cr" className="text-white hover:bg-white/20">Above ₹50 Crore</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-200" />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className='w-full relative min-h-screen'>

      <Header />
      <div className="container mt-12 md:mt-12 max-w-2xl py-10">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-16 gap-2 bg-white/5 border-white/30 hover:bg-white/10"
            asChild
          >
            <a href="tel:9970257506">
              <CardTitle className="text-lg text-white">Call Us</CardTitle>
              <span className="text-primary">+91 99702 57506</span>
            </a>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-16 gap-2 bg-white/5 border-white/30 hover:bg-white/10"
            asChild
          >
            <a href="mailto:support@bridgeit.in">
              <CardTitle className="text-lg text-white">Email Us</CardTitle>
              <span className="text-primary">support@bridgeit.in</span>
            </a>
          </Button>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Contact Us</CardTitle>
            <CardDescription className="text-white/80">
              Get in touch with us to learn more about BridgeIT&apos;s electricity management platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Stepper */}
            <div className="mb-8">
              <nav aria-label="Progress">
                <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
                  {steps.map((step, index) => (
                    <li key={step.name} className="md:flex-1">
                      <div
                        className={`group flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4 ${index <= currentStep
                          ? 'border-primary'
                          : 'border-white/20'
                          }`}
                      >
                        <span className="text-sm font-medium text-white">
                          {index + 1}. {step.name}
                        </span>
                        <span className="text-sm text-white/60">
                          {step.description}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>

            <Form {...form}>
              <form className="space-y-6">
                {renderStepContent()}

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0 || isSubmitting}
                    className="bg-white/10 backdrop-blur-sm hover:bg-white/15 border-white/20 text-white"
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={isSubmitting}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : currentStep === steps.length - 1 ? (
                      'Submit'
                    ) : (
                      'Next'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </div>
      </div>
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
