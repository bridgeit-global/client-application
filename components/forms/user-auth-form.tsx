'use client';
import { useEffect, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from '@/components/ui/input-otp';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardFooter } from '../ui/card';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient, createPublicClient } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store/user-store';
import { useBillerBoardStore } from '@/lib/store/biller-board-store';
import { LoadingButton } from '../buttons/loading-button';
import { Turnstile } from '@marsidev/react-turnstile'


import { Skeleton } from '../ui/skeleton';
import Link from 'next/link';

const supabase = createClient();
const supabasePublicClient = createPublicClient();

// Utility function to check if email is valid and not empty/null
const isValidEmail = (email: string): boolean => {
  return !!(email && email.trim() && email.trim() !== 'null' && email.trim() !== 'undefined' && email.includes('@') && email.includes('.'));
};

export default function PhoneOtpForm({ users }: { users: any }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { fetchBillers } = useBillerBoardStore();
  const { setUser, setOrganization } = useUserStore();
  const [step, setStep] = useState<'phone' | 'otp' | 'account'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [isLoader, setIsLoader] = useState(false);
  const [isSupport, setIsSupport] = useState(false);
  const [otpResendTimer, setOtpResendTimer] = useState(30);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(undefined)

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 10) {
      toast({
        title: 'Invalid phone number',
        description: 'Please enter a valid phone number',
        variant: 'destructive'
      });
      return;
    }
    setIsLoader(true);
    try {
      // Directly send OTP via Supabase auth
      await handleLogin(null);
    } catch (parseError) {
      toast({
        title: 'Error',
        description: 'Failed to send OTP. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoader(false);
    }
  }

  const handleLogin = useCallback(async (e: React.FormEvent | null) => {
    e?.preventDefault();
    setIsLoader(true);

    if (phoneNumber.length === 10) {
      const { error } = await supabase.auth.signInWithOtp({
        phone: '+91' + phoneNumber,
        options: { captchaToken },
      });

      if (error) {
        toast({
          title: 'OTP Error',
          description: error.message,
          variant: 'destructive'
        });
        setIsLoader(false);
        return;
      }
      setStep('otp');
      toast({
        title: 'OTP Sent',
        description: 'Please check your phone for the OTP'
      });
      setIsLoader(false);
    }
  }, [phoneNumber])

  const handleUserValidation = useCallback((user: any) => {
    if (user?.user_metadata?.role === 'operator') {
      // Check if phone is authenticated for operators
      if (!user?.phone_confirmed_at) {
        toast({
          title: 'Phone Authentication Required',
          description: 'Please verify your phone number to access the portal',
          variant: 'destructive'
        });
        return;
      }
      router.push('/portal/meter-reading-list');
      return;
    }

    if (user?.new_email) {
      toast({
        title: 'Please verify your email to access this page',
        description: `We've sent a verification email to your registered email address. Please check your inbox and click on the verification link to activate your account.`,
        variant: 'destructive'
      });
    }

    if (!user?.email && user?.user_metadata?.role !== 'operator') {
      setStep('account');
      // toast({
      //   title: 'Alert!',
      //   description: `Please enter your email first name and last name`,
      //   variant: 'destructive'
      // });
    }
  }, [router, setStep]);

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a valid 6-digit OTP',
        variant: 'destructive'
      });
      return;
    }
    setIsLoader(true);

    const phone = searchParams.get("phone") || phoneNumber;

    const { error, data } = await supabase.auth.verifyOtp({
      phone: '+91' + phone,
      token: otp,
      type: 'sms'
    });


    if (error) {
      toast({
        title: 'Error OTP',
        description: error.message,
        variant: 'destructive'
      });
      setIsLoader(false);
      return;
    }
    setOtp('');

    // Revoke all previous sessions for this user (single active session enforcement)
    // This is done asynchronously and won't block the login flow
    if (data.user?.id) {
      try {
        await fetch('/api/auth/revoke-sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: data.user.id }),
        });
        // Silently handle errors - don't block login if session revocation fails
      } catch (error) {
        console.error('Failed to revoke previous sessions:', error);
      }
    }


    // Check if user has org_id in metadata
    let userOrgId = data.user?.user_metadata?.org_id;
    if(!userOrgId) {
      
      const { data: userRequestData, error } = await supabasePublicClient.from('user_requests').select('*').eq('phone', phone).single();
      if(error) {
        // If no user_request found and user doesn't have org_id, redirect to no-organization page
        const isOperator = data.user?.user_metadata?.role === 'operator';
        if (!isOperator) {
          setIsLoader(false);
          router.push('/no-organization');
          return;
        }
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
        setIsLoader(false);
        return;
      }
      console.log(userRequestData)
      await supabase.auth.updateUser({
        data: {
          first_name: userRequestData.first_name,
          last_name: userRequestData.last_name,
          role: userRequestData.role,
          org_id: userRequestData.org_id
        }
      })
      userOrgId = userRequestData.org_id;
      setFirstName(userRequestData.first_name)
      setLastName(userRequestData.last_name)
      setEmail(userRequestData.email)
      setRole(userRequestData.role)
    }
    const isOperator = data.user?.user_metadata?.role === 'operator';

    // If no org_id and not an operator, redirect to no-organization page
    if (!userOrgId && !isOperator) {
      setIsLoader(false);
      router.push('/no-organization');
      return;
    }

    // User has org_id, proceed with portal access
    // if (data.user?.email || isOperator) {
    //   try {
    //     const { data: organization, error: org_error } = await supabase.from('organizations').select('*').eq('id', userOrgId).single();
    //     if (org_error) {
    //       // For operators, we can continue without organization data if needed
    //       if (!isOperator) {
    //         throw org_error;
    //       }
    //     }
    //     if (organization) {
    //       setOrganization(organization);
    //     }
    //   } catch (error) {
    //     if (!isOperator) {
    //       toast({
    //         title: 'Error loading organization',
    //         description: 'Please try again',
    //         variant: 'destructive'
    //       });
    //       setIsLoader(false);
    //       return;
    //     }
    //   }

    //   setUser(data?.user);

    //   try {
    //     await fetchBillers();
    //   } catch (error) {
    //     // Continue even if billers fail for operators
    //   }
    //   if (data.user?.role === 'service_role') {
    //     setIsSupport(true);
    //   } else if (isOperator) {
    //     // Check if phone is authenticated for operators
    //     if (!data.user?.phone_confirmed_at) {
    //       toast({
    //         title: 'Phone Authentication Required',
    //         description: 'Please verify your phone number to access the portal',
    //         variant: 'destructive'
    //       });
    //       setIsLoader(false);
    //       return;
    //     }
    //     router.push('/portal/meter-reading');
    //   } else {
    //     router.push('/portal/dashboard');
    //   }
    //   toast({
    //     title: 'Success',
    //     description: 'OTP verified successfully'
    //   });
    // } else {
    //   setStep('account');
    // }
    setIsLoader(false);
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(firstName, lastName, email, role)
    // For operators, email is optional
    const isOperator = role === 'operator';

    if (!firstName.trim() || !lastName.trim() || (!isOperator && !isValidEmail(email)) || !role) {
      toast({
        title: 'Validation Error',
        description: isOperator ? 'Please fill in all required fields' : 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    setIsLoader(true);
    try {
      const updateData: any = {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          role: role.trim()
        }
      };

      // Only include email if it's provided and valid (not empty for operators)
      if (isValidEmail(email)) {
        updateData.email = email.trim();
      }
      const { error } = await supabase.auth.updateUser(updateData);

      if (error) throw error;

      setFirstName('');
      setLastName('');
      setEmail('');
      setRole('');
      setStep('phone');

      if (isValidEmail(email)) {
        toast({
          title: 'Email Verification Required',
          description: `We've sent a verification email to ${email}. Please check your inbox and click on the verification link to activate your account.`,
          variant: 'default'
        });
      } else {
        toast({
          title: 'Account Updated Successfully',
          description: 'Your account details have been updated.',
          variant: 'default'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error updating details',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoader(false);
    }
  };

  const handleOtpChange = (value: string) => {
    setOtp(value);
  };

  const handleGoogleSignIn = async () => {
    setIsLoader(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        toast({
          title: 'Google Sign-In Error',
          description: error.message,
          variant: 'destructive'
        });
        setIsLoader(false);
      }
      // If successful, the user will be redirected to Google, so don't set loader to false
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to initiate Google sign-in',
        variant: 'destructive'
      });
      setIsLoader(false);
    }
  };

  useEffect(() => {
    const error = searchParams.get('error');

    if (error === 'phone_not_verified') {
      toast({
        title: 'Phone Authentication Required',
        description: 'Please verify your phone number to access the portal',
        variant: 'destructive'
      });
    }

    setIsInitializing(false);
  }, [searchParams]);

  useEffect(() => {
    if (users) {
      handleUserValidation(users);
    }
  }, [users, handleUserValidation]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpResendTimer > 0 && !canResendOtp) {
      timer = setInterval(() => {
        setOtpResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpResendTimer === 0) {
      setCanResendOtp(true);
    }
    return () => clearInterval(timer);
  }, [otpResendTimer, canResendOtp]);

  const handleResendOtp = async () => {
    if (!canResendOtp) return;

    setIsLoader(true);
    try {
      setOtp('')
      await handleLogin(null);
      setOtpResendTimer(30);
      setCanResendOtp(false);
      toast({
        title: 'OTP Resent',
        description: 'Please check your phone for the new OTP'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resend OTP',
        variant: 'destructive'
      });
    } finally {
      setIsLoader(false);
    }
  };

  if (isInitializing) {
    return (
      <Card className="mx-auto mt-10 w-full bg-white p-6">
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-10 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full bg-white p-4 md:p-6 border-gray-200 shadow-sm">
      {step === 'phone' && (
        <>
          <CardContent className="space-y-4 md:space-y-6">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-1">Login</h2>
              <p className="text-sm text-gray-600">Enter your phone number to sign in</p>
            </div>
            
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600 min-w-[40px] font-medium">+91</p>
                <Input
                  id="phone"
                  type="tel"
                  maxLength={10}
                  autoComplete="off"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full py-2.5 md:py-3 transition-colors text-sm md:text-base border-2 border-gray-300 text-gray-900 hover:border-primary hover:bg-primary/5 font-medium"
                  disabled={isLoader}
                />
              </div>
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                onSuccess={(token) => {
                  setCaptchaToken(token)
                }}
              />
              <LoadingButton
                loading={isLoader}
                type="submit"
                className="w-full bg-primary font-medium py-2.5 md:py-3 rounded-lg border-2 border-gray-300 hover:bg-primary/90 transition-colors text-sm md:text-base"
              >
                Continue to Login
              </LoadingButton>
            </form>

            <div className="relative my-4 md:my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>

            <LoadingButton
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full py-2.5 md:py-3 transition-colors text-sm md:text-base border-2 border-gray-300 text-gray-900 hover:border-primary hover:bg-primary/5 hover:text-primary font-medium"
              disabled={isLoader}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </LoadingButton>

            <div className="relative my-4 md:my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1">Create Account</h3>
                <p className="text-sm text-gray-600 mb-3">Choose your organization type</p>
              </div>
              
              <div className="space-y-2">
                <Link href={`/existing?phone=${phoneNumber}`} className="block">
                  <LoadingButton
                    variant="outline"
                    className="w-full py-2.5 md:py-3 transition-colors text-sm md:text-base border-2 border-gray-300 text-gray-900 hover:border-primary hover:bg-primary/5 hover:text-primary font-medium"
                    disabled={isLoader}
                  >
                    Existing Organization
                  </LoadingButton>
                </Link>
                <LoadingButton
                  onClick={() => {
                    router.push('/signup');
                  }}
                  variant="outline"
                  className="w-full py-2.5 md:py-3 transition-colors text-sm md:text-base border-2 border-gray-300 text-gray-900 hover:border-primary hover:bg-primary/5 hover:text-primary font-medium"
                  disabled={isLoader}
                >
                  New Organization
                </LoadingButton>
              </div>
            </div>
          </CardContent>
        </>
      )}
      {step === 'otp' && (
        <>
          {isSupport ? (
            <div className="flex items-center justify-between gap-4">
              <LoadingButton
                onClick={() => router.push('/support/registration')}
                variant="outline"
                className="flex-1 transition-colors text-gray-900 border-2 border-gray-300 hover:border-primary hover:bg-primary/5 hover:text-primary font-medium"
                disabled={isLoader}
              >
                Go To Support
              </LoadingButton>
              <LoadingButton
                onClick={() => router.push('/portal/dashboard')}
                variant="outline"
                className="flex-1 transition-colors text-gray-900 border-2 border-gray-300 hover:border-primary hover:bg-primary/5 hover:text-primary font-medium"
                disabled={isLoader}
              >
                Go To Portal
              </LoadingButton>
            </div>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <CardContent className="space-y-6">
                <LoadingButton
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    router.replace('/login');
                    setStep('phone');
                    setOtp('');
                    setOtpResendTimer(30);
                    setCanResendOtp(false);
                  }}
                  className="text-xs text-background hover:bg-background/20 hover:text-background transition-colors"
                  disabled={isLoader}
                >
                  <span className="mr-2">←</span>
                  Back
                </LoadingButton>
                <div className="flex items-center justify-between">
                  <Label htmlFor="otp" className="text-background font-medium text-sm md:text-base">
                    Enter Verification Code
                  </Label>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-xs md:text-sm text-background mb-4 text-center">
                    We&apos;ve sent a 6-digit code to your phone
                  </p>

                  <InputOTP
                    value={otp}
                    onChange={handleOtpChange}
                    maxLength={6}
                    disabled={isLoader}
                    className="gap-1.5 md:gap-2"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="w-9 h-9 md:w-10 md:h-10 bg-base text-background text-base md:text-lg" />
                      <InputOTPSlot index={1} className="w-9 h-9 md:w-10 md:h-10 bg-base text-background text-base md:text-lg" />
                      <InputOTPSlot index={2} className="w-9 h-9 md:w-10 md:h-10 bg-base text-background text-base md:text-lg" />
                      <InputOTPSlot index={3} className="w-9 h-9 md:w-10 md:h-10 bg-base text-background text-base md:text-lg" />
                      <InputOTPSlot index={4} className="w-9 h-9 md:w-10 md:h-10 bg-base text-background text-base md:text-lg" />
                      <InputOTPSlot index={5} className="w-9 h-9 md:w-10 md:h-10 bg-base text-background text-base md:text-lg" />
                    </InputOTPGroup>
                  </InputOTP>

                  <LoadingButton
                    type="button"
                    variant="link"
                    onClick={handleResendOtp}
                    loading={isLoader}
                    disabled={!canResendOtp}
                    className="mt-4 text-xs font-medium text-primary hover:text-primary/80"
                  >
                    {canResendOtp ? 'Resend Code' : `Resend code in ${otpResendTimer}s`}
                  </LoadingButton>
                </div>
              </CardContent>

              <CardFooter>
                <LoadingButton
                  loading={isLoader}
                  type="submit"
                  className="w-full"
                >
                  Verify Code
                </LoadingButton>
              </CardFooter>
            </form>
          )}
        </>
      )}
      {step === 'account' && (
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <LoadingButton
                type="button"
                variant="outline"
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push('/login');
                  setStep('phone');
                  setFirstName('');
                  setLastName('');
                  setEmail('');
                  setRole('');
                }}
                className="text-gray-500 text-sm mr-2 border-2 border-gray-300 hover:border-primary hover:bg-primary/5 hover:text-primary font-medium"
                disabled={isLoader}
              >
                ←
              </LoadingButton>
              <Label>Account Details</Label>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-500 text-sm font-medium" htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={isLoader}
                className="transition-colors text-gray-500 border-2 border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-500 text-sm font-medium" htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Enter your last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={isLoader}
                className="transition-colors text-gray-500 border-2 border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-500 text-sm font-medium" htmlFor="email">
                Email Address {role === 'operator' && <span className="text-gray-500 text-sm">(Optional)</span>}
              </Label>
              <Input
                autoComplete="off"
                disabled={email.length > 0 || isLoader}
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={role !== 'operator'}
                className="transition-colors text-gray-500 border-2 border-gray-300"
              />
            </div>
          </CardContent>
          <CardFooter>
            <LoadingButton
              loading={isLoader}
              type="submit"
              className="w-full transition-colors"
            >
              Submit
            </LoadingButton>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
