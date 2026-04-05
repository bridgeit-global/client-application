'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const STORAGE_KEY = 'bridgeit_getting_started_dismissed';

export function GettingStartedBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get('welcome') !== '1') {
      return;
    }
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      /* ignore */
    }
    if (dismissed) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('welcome');
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
      return;
    }
    setVisible(true);
  }, [searchParams, router, pathname]);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete('welcome');
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }, [router, searchParams, pathname]);

  if (!visible) {
    return null;
  }

  return (
    <Alert className="mb-6 border-border bg-card relative pr-10">
      <AlertTitle className="text-lg font-semibold tracking-tight">Get started</AlertTitle>
      <AlertDescription className="text-muted-foreground mt-1 space-y-3">
        <p>
          Add a site, register a connection, then open bills or bill copies when your data is
          available.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="secondary">
            <Link href="/portal/site">Add site</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/portal/site/postpaid/create">Add connection</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/portal/bills/new">Bills</Link>
          </Button>
        </div>
      </AlertDescription>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-8 w-8 text-muted-foreground"
        onClick={dismiss}
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
}
