'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, Plus, Trash2, Building2, MapPin, Sparkles } from 'lucide-react';
import Link from 'next/link';

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
import Header from '@/components/layout/landing/header';
import Footer from '@/components/layout/landing/footer';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store/user-store';
import { useToast } from '@/components/ui/use-toast';

type MasterRow = { value: string; name: string };

const orgStepSchema = z.object({
  name: z.string().min(2, 'Organization name is required'),
  site_name: z.string().min(1, 'Site display name is required'),
  company_name: z.string().optional(),
  company_address: z.string().optional(),
  company_email: z.union([z.string().email(), z.literal('')]).optional(),
  pan: z.string().optional(),
  gst: z.string().optional(),
  cin: z.string().optional(),
  batch_threshold_amount: z.coerce.number().nonnegative().optional(),
  logo_url: z.union([z.string().url(), z.literal('')]).optional()
});

type OrgStepValues = z.infer<typeof orgStepSchema>;

const DEFAULT_SITE_TYPES: MasterRow[] = [
  { value: 'COCO', name: 'COCO' },
  { value: 'POCO', name: 'POCO' },
  { value: 'COPO', name: 'COPO' },
  { value: 'POPO', name: 'POPO' },
  { value: 'Warehouse', name: 'Warehouse' }
];

const DEFAULT_ZONES: MasterRow[] = [{ value: 'DEFAULT', name: 'Default zone' }];

const steps = [
  {
    id: 'org',
    name: 'Organization',
    description: 'Company and billing profile'
  },
  {
    id: 'masters',
    name: 'Site & zone masters',
    description: 'Labels used when registering sites'
  },
  {
    id: 'done',
    name: 'Get started',
    description: 'Open sites, connections, and bills'
  }
];

function validateMasters(rows: MasterRow[]): boolean {
  return rows.every((r) => r.value.trim().length > 0 && r.name.trim().length > 0);
}

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const setUser = useUserStore((s) => s.setUser);
  const setOrganization = useUserStore((s) => s.setOrganization);

  const [authReady, setAuthReady] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [siteTypes, setSiteTypes] = useState<MasterRow[]>(DEFAULT_SITE_TYPES);
  const [zoneIds, setZoneIds] = useState<MasterRow[]>(DEFAULT_ZONES);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<OrgStepValues>({
    resolver: zodResolver(orgStepSchema),
    defaultValues: {
      name: '',
      site_name: '',
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

  const updateSiteRow = (index: number, field: keyof MasterRow, v: string) => {
    setSiteTypes((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: v };
      return next;
    });
  };

  const updateZoneRow = (index: number, field: keyof MasterRow, v: string) => {
    setZoneIds((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: v };
      return next;
    });
  };

  const addSiteRow = () =>
    setSiteTypes((prev) => [...prev, { value: '', name: '' }]);

  const addZoneRow = () =>
    setZoneIds((prev) => [...prev, { value: '', name: '' }]);

  const removeSiteRow = (index: number) => {
    setSiteTypes((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const removeZoneRow = (index: number) => {
    setZoneIds((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const goNext = async () => {
    if (currentStep === 0) {
      const ok = await form.trigger();
      if (!ok) return;
      setCurrentStep(1);
      return;
    }

    if (currentStep === 1) {
      if (!validateMasters(siteTypes) || !validateMasters(zoneIds)) {
        toast({
          title: 'Check your entries',
          description: 'Each site type and zone needs a code and a display name.',
          variant: 'destructive'
        });
        return;
      }

      setSubmitting(true);
      try {
        const org = form.getValues();
        const res = await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization: {
              ...org,
              company_email: org.company_email || '',
              logo_url: org.logo_url || ''
            },
            siteTypes,
            zoneIds
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
          title: payload?.alreadyOnboarded ? 'Already set up' : 'Organization ready',
          description: payload?.alreadyOnboarded
            ? 'Your account was already linked to an organization.'
            : 'You can now use the portal.'
        });

        setCurrentStep(2);
      } catch (e: unknown) {
        toast({
          title: 'Something went wrong',
          description: e instanceof Error ? e.message : 'Please try again.',
          variant: 'destructive'
        });
      } finally {
        setSubmitting(false);
      }
    }
  };

  const goBack = () => {
    if (currentStep > 0 && currentStep < 2) {
      setCurrentStep((s) => s - 1);
    }
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
      <div className="container mt-12 md:mt-12 max-w-3xl py-10">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
              Set up your organization
            </CardTitle>
            <CardDescription className="text-white/80 text-base">
              Create your company profile, configure site types and zones, then jump into the
              portal.
            </CardDescription>
          </CardHeader>

          <div className="mb-8">
            <nav aria-label="Progress">
              <ol className="space-y-4 md:flex md:space-x-8 md:space-y-0">
                {steps.map((step, index) => (
                  <li key={step.id} className="md:flex-1">
                    <div
                      className={`group flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4 ${
                        index <= currentStep ? 'border-primary' : 'border-white/20'
                      }`}
                    >
                      <span className="text-sm font-medium text-white">
                        {index + 1}. {step.name}
                      </span>
                      <span className="text-sm text-white/60">{step.description}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          <CardContent className="px-0 pb-0">
            {currentStep === 0 && (
              <Form {...form}>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="text-white">Organization name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Legal or brand name"
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
                      name="site_name"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="text-white">Default site label *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Shown where a site name is required"
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
                      name="company_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Company name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Registered company name"
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
                              placeholder="billing@company.com"
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
                              placeholder="Registered address"
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
                              placeholder="PAN"
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
                              placeholder="GSTIN"
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
                              placeholder="CIN"
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
                </form>
              </Form>
            )}

            {currentStep === 1 && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Site types
                  </h3>
                  <p className="text-sm text-white/70 mt-1 mb-4">
                    Codes appear in filters and site registration (e.g. COCO, Warehouse).
                  </p>
                  <div className="space-y-3">
                    {siteTypes.map((row, i) => (
                      <div
                        key={`st-${i}`}
                        className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end"
                      >
                        <div>
                          <label className="text-xs text-white/70">Code</label>
                          <Input
                            value={row.value}
                            onChange={(e) => updateSiteRow(i, 'value', e.target.value)}
                            className="bg-white/10 border-white/20 text-white mt-1"
                            placeholder="COCO"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-white/70">Display name</label>
                          <Input
                            value={row.name}
                            onChange={(e) => updateSiteRow(i, 'name', e.target.value)}
                            className="bg-white/10 border-white/20 text-white mt-1"
                            placeholder="COCO"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-white/80 hover:text-white hover:bg-white/10"
                          onClick={() => removeSiteRow(i)}
                          disabled={siteTypes.length <= 1}
                          aria-label="Remove site type"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                      onClick={addSiteRow}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add site type
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Zone IDs
                  </h3>
                  <p className="text-sm text-white/70 mt-1 mb-4">
                    Used when assigning a site to a region or zone.
                  </p>
                  <div className="space-y-3">
                    {zoneIds.map((row, i) => (
                      <div
                        key={`z-${i}`}
                        className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end"
                      >
                        <div>
                          <label className="text-xs text-white/70">Code</label>
                          <Input
                            value={row.value}
                            onChange={(e) => updateZoneRow(i, 'value', e.target.value)}
                            className="bg-white/10 border-white/20 text-white mt-1"
                            placeholder="NORTH"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-white/70">Display name</label>
                          <Input
                            value={row.name}
                            onChange={(e) => updateZoneRow(i, 'name', e.target.value)}
                            className="bg-white/10 border-white/20 text-white mt-1"
                            placeholder="North zone"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-white/80 hover:text-white hover:bg-white/10"
                          onClick={() => removeZoneRow(i)}
                          disabled={zoneIds.length <= 1}
                          aria-label="Remove zone"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10"
                      onClick={addZoneRow}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add zone
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="rounded-lg bg-white/5 border border-white/10 p-6 space-y-4">
                  <div className="flex items-center gap-2 text-white">
                    <Sparkles className="h-6 w-6 text-primary" />
                    <span className="text-lg font-semibold">You&apos;re ready</span>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">
                    Register sites and connections under Infrastructure, then review bills and
                    payments when data is available.
                  </p>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
                    <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Link href="/portal/site">Infrastructure &amp; sites</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Link href="/portal/bills/new">Bill inbox</Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Link href="/portal/dashboard">Dashboard</Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={currentStep === 0 || currentStep === 2 || submitting}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/15 border-white/20 text-white"
              >
                Previous
              </Button>
              {currentStep < 2 ? (
                <Button
                  type="button"
                  onClick={goNext}
                  disabled={submitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : currentStep === 1 ? (
                    'Create organization'
                  ) : (
                    'Next'
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => router.push('/portal/dashboard')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Go to dashboard
                </Button>
              )}
            </div>
          </CardContent>
        </div>
      </div>
      <Footer />
    </div>
  );
}
