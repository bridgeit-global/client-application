'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import Header from '@/components/layout/landing/header';
import Footer from '@/components/layout/landing/footer';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store/user-store';
import { useToast } from '@/components/ui/use-toast';
import { ChevronDown } from 'lucide-react';

const minimalSchema = z.object({
  name: z.string().min(2, 'Organization name is required'),
  company_name: z.string().optional(),
  company_address: z.string().optional(),
  company_email: z.union([z.string().email(), z.literal('')]).optional(),
  pan: z.string().optional(),
  gst: z.string().optional(),
  cin: z.string().optional(),
  batch_threshold_amount: z.coerce.number().nonnegative().optional(),
  logo_url: z.union([z.string().url(), z.literal('')]).optional()
});

type MinimalFormValues = z.infer<typeof minimalSchema>;

/** Stored as `organizations.site_name`; separate from organization display `name`. */
const DEFAULT_SITE_NAME = 'site' as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const setUser = useUserStore((s) => s.setUser);
  const setOrganization = useUserStore((s) => s.setOrganization);

  const [authReady, setAuthReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const form = useForm<MinimalFormValues>({
    resolver: zodResolver(minimalSchema),
    defaultValues: {
      name: '',
      company_name: '',
      company_address: '',
      company_email: '',
      pan: '',
      gst: '',
      cin: '',
      batch_threshold_amount: 0,
      logo_url: ''
    }
  });

  useEffect(() => {
    const run = async () => {
      const supabase = createClient();
      const {
        data: { user },
        error
      } = await supabase.auth.getUser();

      if (error || !user?.email) {
        router.replace('/login');
        return;
      }

      const role =
        user.user_metadata?.role ??
        (user.app_metadata as { role?: string })?.role;

      if (role === 'operator') {
        router.replace('/portal/meter-reading-list');
        return;
      }

      if (role === 'service_role') {
        router.replace('/support/dashboard');
        return;
      }

      if (user.user_metadata?.org_id) {
        router.replace('/portal/dashboard');
        return;
      }

      setAuthReady(true);
    };

    run();
  }, [router]);

  const continueToPortal = async () => {
    const ok = await form.trigger();
    if (!ok) return;

    setSubmitting(true);
    try {
      const values = form.getValues();
      const name = values.name.trim();
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization: {
            name,
            site_name: DEFAULT_SITE_NAME,
            company_name: values.company_name || null,
            company_address: values.company_address || null,
            company_email: values.company_email || '',
            pan: values.pan || null,
            gst: values.gst || null,
            cin: values.cin || null,
            batch_threshold_amount: values.batch_threshold_amount ?? 0,
            logo_url: values.logo_url || ''
          },
          siteTypes: [],
          zoneIds: []
        })
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          typeof payload?.error === 'string'
            ? payload.error
            : 'Could not create your organization'
        );
      }

      const supabase = createClient();
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error(refreshError);
      }

      const {
        data: { user: freshUser }
      } = await supabase.auth.getUser();

      if (freshUser) {
        setUser(freshUser);
        const oid = freshUser.user_metadata?.org_id as string | undefined;
        if (oid) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', oid)
            .single();
          if (orgData) {
            setOrganization(orgData);
          }
        }
      }

      toast({
        title: payload?.alreadyOnboarded ? 'Already set up' : 'Welcome',
        description: payload?.alreadyOnboarded
          ? 'Your account was already linked to an organization.'
          : 'Add a site and connection to start tracking bills.'
      });

      router.replace('/portal/dashboard?welcome=1');
    } catch (e: unknown) {
      toast({
        title: 'Something went wrong',
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const skipEntireOnboarding = () => {
    router.push('/');
  };

  if (!authReady) {
    return (
      <div className="w-full relative min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
      </div>
    );
  }

  return (
    <div className="w-full relative min-h-screen">
      <Header />
      <div className="container mt-12 md:mt-12 max-w-lg py-10">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8">
          <CardHeader className="px-0 pt-0 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <CardTitle className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
                  Name your organization
                </CardTitle>
                <CardDescription className="text-white/80 text-base mt-2">
                  One step to open the portal. You&apos;ll add sites, connections, and site types
                  next.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/10 shrink-0 self-start"
                onClick={skipEntireOnboarding}
              >
                Skip for now
              </Button>
            </div>
          </CardHeader>

          <CardContent className="px-0 pb-0">
            <Form {...form}>
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  continueToPortal();
                }}
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Organization name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Acme Retail Pvt Ltd"
                          {...field}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </FormControl>
                      <FormDescription className="text-white/60">
                        Default site label in your account will be &quot;{DEFAULT_SITE_NAME}&quot;
                        (not your company name).
                      </FormDescription>
                      <FormMessage className="text-red-200" />
                    </FormItem>
                  )}
                />

                <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-white/80 hover:text-white hover:bg-white/10 px-0 gap-1"
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`}
                      />
                      More details (optional)
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="company_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Company name</FormLabel>
                            <FormControl>
                              <Input
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
                        name="company_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Company email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
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
                        name="company_address"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-white">Company address</FormLabel>
                            <FormControl>
                              <Input
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
                            <FormLabel className="text-white">PAN</FormLabel>
                            <FormControl>
                              <Input
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
                            <FormLabel className="text-white">GST</FormLabel>
                            <FormControl>
                              <Input
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
                            <FormLabel className="text-white">CIN</FormLabel>
                            <FormControl>
                              <Input
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
                        name="batch_threshold_amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Batch threshold amount</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step="1"
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
                        name="logo_url"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-white">Logo URL</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://..."
                                {...field}
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                              />
                            </FormControl>
                            <FormMessage className="text-red-200" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Continuing…
                      </>
                    ) : (
                      'Continue to portal'
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
