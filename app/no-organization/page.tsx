'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Mail, ArrowLeft, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/landing/header';
import Footer from '@/components/layout/landing/footer';
import Link from 'next/link';

export default function NoOrganizationPage() {
  const router = useRouter();

  return (
    <div className='w-full relative min-h-screen'>
      <Header />
      <div className="container mt-12 md:mt-12 max-w-2xl py-10">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl md:text-3xl text-white">
              Organization Access Required
            </CardTitle>
            <CardDescription className="text-white/80 text-base md:text-lg mt-2">
              Your account needs to be associated with an organization to access BridgeIT&apos;s platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-white/5 border border-white/10 p-6 space-y-4">
              <p className="text-white/90 text-sm md:text-base leading-relaxed">
                To get started with BridgeIT, please contact our support team. They will help you set up your organization and grant you access to the platform.
              </p>
              
              <div className="flex flex-col items-center gap-4 pt-4">
                <a
                  href="mailto:support@bridgeit.in"
                  className="w-full"
                >
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-base md:text-lg font-medium"
                    size="lg"
                  >
                    <Mail className="mr-2 h-5 w-5" />
                    Contact Support
                  </Button>
                </a>
                
                <p className="text-white/70 text-sm text-center">
                  Email us at{' '}
                  <a
                    href="mailto:support@bridgeit.in"
                    className="text-primary hover:text-primary/80 underline font-medium"
                  >
                    support@bridgeit.in
                  </a>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => router.push('/login')}
                className="flex-1 bg-white/10 backdrop-blur-sm hover:bg-white/15 border-white/20 text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="flex-1 bg-white/10 backdrop-blur-sm hover:bg-white/15 border-white/20 text-white"
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Home
              </Button>
            </div>
          </CardContent>
        </div>
      </div>
      <Footer />
    </div>
  );
}
