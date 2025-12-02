import { Analytics } from "@vercel/analytics/next";
import { Toaster } from '@/components/ui/toaster';
import '@uploadthing/react/styles.css';
import NextTopLoader from 'nextjs-toploader';
import type { Metadata, Viewport } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import { ThemeGate } from '@/components/theme-gate';
import { PublicBackground } from '@/components/public-background';
import { AuthProvider } from '@/components/providers/auth-provider';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BridgeIT - Specialized ERP for Energy Management',
  description: 'Streamline your electricity bill management across multiple locations and providers',
  manifest: '/favicon/site.webmanifest'
};

export const viewport: Viewport = {
  themeColor: '#0b1220'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={dmSans.variable} style={{ height: '100%', overflowY: 'auto' }}>
        <NextTopLoader showSpinner={false} color="#facc14" />
        <Toaster />
        <AuthProvider>
          <ThemeGate />
          <PublicBackground />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
