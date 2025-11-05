import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { redirectHome, redirectSupport } from '@/app/actions';
import UserAuthForm from '@/components/forms/user-auth-form';
import Logo from '@/components/logo';
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/layout/landing/header'), {
  ssr: true
});

export default async function Page() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <Header />
      <div className="relative hidden h-full md:flex flex-col bg-muted p-6 md:p-8 lg:p-10 text-white dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-base md:text-lg font-medium gap-2">
          <Logo />
          BridgeIT
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-base md:text-lg">
              Simplify Your Electricity Bill Payments with BridgeIT
            </p>
            <footer className="text-xs md:text-sm">Fast, Secure, and Convenient</footer>
          </blockquote>
        </div>
      </div>
      {data.user?.email || (data.user?.user_metadata?.role === 'operator' && data.user?.phone_confirmed_at) ? (
        <div className="flex min-h-screen w-full items-center justify-center p-4 md:p-6 lg:p-8">
          <div className="mx-auto flex w-full max-w-md flex-col justify-center space-y-4 md:space-y-6">
            <div className="flex flex-col space-y-2 text-center">
              <div className="pb-4">
                Sign in as
              </div>
              <form className="mx-auto w-full place-content-center items-center justify-center space-y-4 md:space-y-6">
                {data.user?.role === 'service_role' ? <div className="flex flex-col space-y-3 md:space-y-4">
                  <Button
                    className="w-full py-4 md:py-6 text-base md:text-lg font-semibold shadow-lg transition-all duration-200 ease-in-out transform hover:scale-[1.02]"
                    formAction={redirectHome}
                  >
                    Client
                  </Button>
                  <Button
                    className="w-full py-4 md:py-6 text-base md:text-lg font-semibold shadow-lg transition-all duration-200 ease-in-out transform hover:scale-[1.02]"
                    formAction={redirectSupport}
                  >
                    Support
                  </Button>
                </div> : data.user?.user_metadata?.role === 'operator' ? <Button
                  className="w-full py-4 md:py-6 text-base md:text-lg font-semibold shadow-lg transition-all duration-200 ease-in-out transform hover:scale-[1.02]"
                  formAction={redirectHome}
                >
                  Operator
                </Button> : <Button
                  className="w-full py-4 md:py-6 text-base md:text-lg font-semibold shadow-lg transition-all duration-200 ease-in-out transform hover:scale-[1.02]"
                  formAction={redirectHome}
                >
                  {data.user?.email}
                </Button>}
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-screen w-full items-center justify-center p-4 md:p-6 lg:p-8 bg-foreground">
          <div className="mx-auto flex w-full max-w-md flex-col justify-center space-y-4 md:space-y-6 px-4">
            <div className="w-full">
              <UserAuthForm users={data.user} />
              <p className="mt-4 md:mt-6 px-2 md:px-8 text-center text-xs md:text-sm text-muted-foreground">
                By clicking continue, you agree to our{' '}
                <Link
                  href="/term-of-service"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy-policy"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
