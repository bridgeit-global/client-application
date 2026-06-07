'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/lib/store/user-store';

export function PaymentDueBanner() {
  const { organization } = useUserStore();

  if (!organization?.is_payment_due) {
    return null;
  }

  return (
    <Alert
      variant="destructive"
      className="rounded-none border-x-0 border-t-0 bg-destructive text-destructive-foreground [&>svg]:text-destructive-foreground"
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="text-base font-semibold tracking-tight">
        Payment overdue
      </AlertTitle>
      <AlertDescription className="text-destructive-foreground/90 space-y-3">
        <p>
          Your organization has an outstanding payment. Clear it immediately to avoid
          service disruption. Accounts with unpaid balances may be suspended within one
          week.
        </p>
        <Button
          asChild
          size="sm"
          variant="secondary"
          className="bg-background text-foreground hover:bg-background/90"
        >
          <Link href="/portal/report-issue">Contact support</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
