'use client';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent } from '../ui/card';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LoadingButton } from '../buttons/loading-button';
import { Skeleton } from '../ui/skeleton';
import { Turnstile } from '@marsidev/react-turnstile';
import Link from 'next/link';

const supabase = createClient();

// Utility function to check if email is valid and not empty/null
const isValidEmail = (email: string): boolean => {
  return !!(email && email.trim() && email.trim() !== 'null' && email.trim() !== 'undefined' && email.includes('@') && email.includes('.'));
};

export default function UserAuthForm({ users }: { users: any }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoader, setIsLoader] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(undefined);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive'
      });
      return;
    }

    if (!captchaToken) {
      toast({
        title: 'Captcha verification required',
        description: 'Please complete the captcha verification',
        variant: 'destructive'
      });
      return;
    }

    setIsLoader(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          captchaToken,
        },
      });

      if (error) {
        toast({
          title: 'Error sending magic link',
          description: error.message,
          variant: 'destructive'
        });
        setIsLoader(false);
        return;
      }

      setMagicLinkSent(true);
      toast({
        title: 'Magic link sent',
        description: `We've sent a sign-in link to ${email}. Please check your email and click the link to sign in.`,
        variant: 'default'
      });
      setIsLoader(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to send magic link',
        variant: 'destructive'
      });
      setIsLoader(false);
    }
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
    const errorDescription = searchParams.get('error_description');

    if (error) {
      toast({
        title: error === 'oauth_error' ? 'Google Sign-In Error' : error === 'session_error' ? 'Session Error' : 'Authentication Error',
        description: errorDescription || error,
        variant: 'destructive'
      });
    }

    setIsInitializing(false);
  }, [searchParams]);

  // If user is already logged in with email, redirect (handled by middleware)
  useEffect(() => {
    if (users?.email) {
      const isOperator = users?.user_metadata?.role === 'operator';
      router.push(isOperator ? '/portal/meter-reading-list' : '/portal/dashboard');
    }
  }, [users, router]);

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
      <CardContent className="space-y-4 md:space-y-6">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-1">Login</h2>
          <p className="text-sm text-gray-600">Enter your email to sign in</p>
        </div>

        {!magicLinkSent ? (
          <>
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-500 text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-2.5 md:py-3 transition-colors text-sm md:text-base border-2 border-gray-300 text-gray-900 hover:border-primary hover:bg-primary/5 font-medium"
                  disabled={isLoader}
                  required
                />
              </div>
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                onSuccess={(token) => {
                  setCaptchaToken(token);
                }}
                onError={() => {
                  setCaptchaToken(undefined);
                  toast({
                    title: 'Captcha verification failed',
                    description: 'Please try again',
                    variant: 'destructive'
                  });
                }}
                onExpire={() => {
                  setCaptchaToken(undefined);
                }}
              />
              <LoadingButton
                loading={isLoader}
                type="submit"
                disabled={!captchaToken || isLoader}
                className="w-full bg-primary font-medium py-2.5 md:py-3 rounded-lg border-2 border-gray-300 hover:bg-primary/90 transition-colors text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send magic link
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
                <Link href="/existing" className="block">
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
          </>
        ) : (
          <div className="space-y-4 text-center">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Check your email</h3>
              <p className="text-sm text-gray-600">
                We've sent a sign-in link to <strong>{email}</strong>
              </p>
              <p className="text-xs text-gray-500">
                Click the link in the email to sign in. The link will expire in 1 hour.
              </p>
            </div>
            <LoadingButton
              onClick={() => {
                setMagicLinkSent(false);
                setEmail('');
                setCaptchaToken(undefined);
              }}
              variant="outline"
              className="w-full py-2.5 md:py-3 transition-colors text-sm md:text-base border-2 border-gray-300 text-gray-900 hover:border-primary hover:bg-primary/5 hover:text-primary font-medium"
            >
              Use a different email
            </LoadingButton>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
