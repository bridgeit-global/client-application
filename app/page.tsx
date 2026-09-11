import Link from 'next/link';
import type { Metadata } from 'next';
import Logo from '@/components/logo';

export const metadata: Metadata = {
  title: 'BridgeIT is closing — thank you',
  description:
    'BridgeIT is undergoing closure. Thank you to every customer, user, and partner who trusted us with their electricity operations.'
};

export default function Home() {
  return (
    <div className="relative flex min-h-screen w-full flex-col">
      <div className="pointer-events-none absolute inset-0 bg-theme-mesh" />

      <header className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur-sm">
        <div className="container">
          <div className="flex h-16 items-center md:px-0">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
              <span className="text-base font-medium text-white">BridgeIT</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-sm text-white/80">Site undergoing closure</span>
          </div>

          <h1 className="mt-8 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Thank you.
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-white/80">
            To every customer, user, and partner who trusted BridgeIT with their electricity
            operations — thank you. Your support made this journey possible, and we are
            grateful for the years we spent working alongside you.
          </p>

          <p className="mt-4 text-lg leading-relaxed text-white/80">
            The platform is shutting down. We appreciate the confidence you placed in us,
            and we wish you all the very best ahead.
          </p>

          <p className="mt-8 text-sm text-white/60">
            For remaining questions, please reach us at{' '}
            <a
              href="mailto:admin@bridgeit.in"
              className="text-primary underline-offset-4 hover:underline"
            >
              admin@bridgeit.in
            </a>
            .
          </p>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6">
          <p className="text-sm text-white/60">
            &copy; {new Date().getFullYear()} BridgeIT. All rights reserved.
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
            <Link
              href="/privacy-policy"
              className="text-white/60 transition-colors hover:text-primary"
            >
              Privacy Policy
            </Link>
            <Link
              href="/term-of-service"
              className="text-white/60 transition-colors hover:text-primary"
            >
              Terms of Service
            </Link>
            <Link
              href="/cookie-policy"
              className="text-white/60 transition-colors hover:text-primary"
            >
              Cookie Policy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
