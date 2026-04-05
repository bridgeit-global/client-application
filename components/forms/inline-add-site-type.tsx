'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/store/user-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useSiteName } from '@/lib/utils/site';

type InlineAddSiteTypeProps = {
  refetch: () => void;
  disabled?: boolean;
};

export function InlineAddSiteType({ refetch, disabled }: InlineAddSiteTypeProps) {
  const site_name = useSiteName();
  const { toast } = useToast();
  const { user } = useUserStore();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const add = async () => {
    const v = code.trim();
    const n = name.trim();
    if (!v || !n) {
      toast({
        title: 'Code and display name required',
        description: 'Enter both fields to add a site type.',
        variant: 'destructive'
      });
      return;
    }
    const orgId = user?.user_metadata?.org_id as string | undefined;
    if (!orgId) {
      toast({
        title: 'No organization',
        description: 'Complete organization setup first.',
        variant: 'destructive'
      });
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('org_master').insert({
        org_id: orgId,
        type: 'site_type',
        value: v,
        name: n
      });
      if (error) throw error;
      setCode('');
      setName('');
      refetch();
      toast({
        title: 'Site type added',
        description: `Select it above for ${site_name} type.`
      });
    } catch (e: unknown) {
      toast({
        title: 'Could not add site type',
        description: e instanceof Error ? e.message : 'Try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3">
      <p className="text-sm text-muted-foreground">
        No {site_name.toLowerCase()} types configured yet. Add a code and display name (you can add
        more later under Site &amp; zone config).
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Code</Label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. COCO"
            disabled={disabled || saving}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Display name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. COCO"
            disabled={disabled || saving}
          />
        </div>
      </div>
      <Button type="button" size="sm" onClick={add} disabled={disabled || saving}>
        Add site type
      </Button>
    </div>
  );
}
