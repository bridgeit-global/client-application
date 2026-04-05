import { createClient } from '@/lib/supabase/client';
import { useCallback, useEffect, useState } from 'react';

export type SiteTypeOption = { value: string; label: string };

export function useSiteType(): {
  siteTypes: SiteTypeOption[];
  refetch: () => void;
} {
  const [version, setVersion] = useState(0);
  const [siteTypes, setSiteTypes] = useState<SiteTypeOption[]>([]);

  const refetch = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    let stale = false;

    const getSiteType = async () => {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (stale) return;

      const { data, error } = await supabase
        .from('org_master')
        .select('*')
        .eq('type', 'site_type')
        .eq('org_id', user?.user_metadata?.org_id);

      if (stale) return;

      if (error) {
        setSiteTypes([]);
        return;
      }

      const mapped = (data ?? []).map((item: { value: string; name: string | null }) => ({
        value: item.value,
        label: item.name ?? item.value
      }));
      setSiteTypes(mapped);
    };

    void getSiteType();

    return () => {
      stale = true;
    };
  }, [version]);

  return { siteTypes, refetch };
}
