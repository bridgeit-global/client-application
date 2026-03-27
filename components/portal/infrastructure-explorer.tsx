'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { SiteConnectionTableProps } from '@/types/site-type';
import type { Connection } from '@/types/site-type';
import { loadSiteConnectionsAction } from '@/app/portal/site/actions';
import { ConnectionProfileBody } from '@/components/portal/connection-profile-body';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PortalFilterSheet } from '@/components/portal/PortalFilterSheet';
import IconButton from '@/components/buttons/icon-button';
import { StationTypeSelector } from '@/components/input/station-type-selector';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertModal } from '@/components/modal/alert-modal';
import { SiteFormModal } from '@/components/modal/register-modal/site-form-modal';
import { EditSiteForm } from '@/components/forms/client-form/edit-site-form';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useUserStore } from '@/lib/store/user-store';
import IsActiveBadge from '@/components/badges/is-active-badge';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  MoreHorizontal,
  Plus,
  Sparkles,
  X
} from 'lucide-react';
import { PAY_TYPE, PAY_TYPE_LIST } from '@/constants/bill';
import { createQueryString } from '@/lib/createQueryString';
import {
  canonicalInfrastructureSearchKey,
  searchParamsPropsFromURL
} from '@/lib/infrastructure-explorer-search-key';
import { camelCaseToTitleCase, snakeToTitle } from '@/lib/utils/string-format';

type ExplorerFilterDraft = {
  status: string;
  site_id: string;
  name: string;
  zone_id: string;
  type: string;
  created_at_start: string;
  created_at_end: string;
  account_number: string;
  paytype: string;
};

type InfrastructureExplorerProps = {
  sites: SiteConnectionTableProps[];
  pageCount: number;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  siteLabel: string;
  paytypeFilter?: number;
  resolvedSearchKey: string;
};

export function InfrastructureExplorer({
  sites,
  pageCount,
  totalCount,
  currentPage,
  pageSize,
  siteLabel,
  paytypeFilter,
  resolvedSearchKey
}: InfrastructureExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useUserStore();
  const supabase = createClient();
  const [isDeactivatePending, startDeactivateTransition] = useTransition();
  const [isNavPending, startNavTransition] = useTransition();

  const [openSiteId, setOpenSiteId] = useState<string>('');
  const [pendingResolvedKey, setPendingResolvedKey] = useState<string | null>(
    null
  );
  const [filterDraft, setFilterDraft] = useState<ExplorerFilterDraft>({
    status: '1',
    site_id: '',
    name: '',
    zone_id: '',
    type: '',
    created_at_start: '',
    created_at_end: '',
    account_number: '',
    paytype: ''
  });
  const [connectionCache, setConnectionCache] = useState<
    Record<string, Connection[] | null | undefined>
  >({});
  const [loadingSiteId, setLoadingSiteId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedBySite, setSelectedBySite] = useState<Record<string, string>>(
    {}
  );

  const [registerSiteOpen, setRegisterSiteOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteConnectionTableProps | null>(
    null
  );
  const [deactivateSite, setDeactivateSite] = useState<SiteConnectionTableProps | null>(
    null
  );

  const connectionCacheRef = useRef(connectionCache);
  connectionCacheRef.current = connectionCache;

  const buildHref = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const p = new URLSearchParams(searchParams.toString());
      Object.entries(overrides).forEach(([k, v]) => {
        if (v === undefined || v === '') p.delete(k);
        else p.set(k, v);
      });
      const q = p.toString();
      return q ? `${pathname}?${q}` : pathname;
    },
    [pathname, searchParams]
  );

  const navigateWithPending = useCallback(
    (href: string) => {
      const query = href.includes('?') ? href.slice(href.indexOf('?') + 1) : '';
      const nextProps = searchParamsPropsFromURL(new URLSearchParams(query));
      const key = canonicalInfrastructureSearchKey(nextProps);
      setPendingResolvedKey(key);
      setOpenSiteId('');
      startNavTransition(() => {
        router.push(href, { scroll: false });
      });
    },
    [router, startNavTransition]
  );

  const isExplorerListPending =
    pendingResolvedKey !== null && pendingResolvedKey !== resolvedSearchKey;

  const fetchConnections = useCallback(async (siteId: string) => {
    setLoadingSiteId(siteId);
    setLoadError(null);
    const { connections, error } = await loadSiteConnectionsAction(siteId);
    setLoadingSiteId(null);
    if (error) {
      setLoadError(error);
      setConnectionCache((c) => ({ ...c, [siteId]: null }));
      return;
    }
    setConnectionCache((c) => ({ ...c, [siteId]: connections ?? [] }));
    const list = connections ?? [];
    const filtered = paytypeFilter != null
      ? list.filter((x) => x.paytype === paytypeFilter)
      : list;
    if (filtered.length > 0) {
      setSelectedBySite((s) => ({
        ...s,
        [siteId]: s[siteId] && filtered.some((x) => x.id === s[siteId])
          ? s[siteId]
          : filtered[0].id
      }));
    }
  }, [paytypeFilter]);

  useEffect(() => {
    if (pendingResolvedKey === null) return;
    if (pendingResolvedKey === resolvedSearchKey) {
      setPendingResolvedKey(null);
    }
  }, [pendingResolvedKey, resolvedSearchKey]);

  useEffect(() => {
    setFilterDraft({
      status: searchParams.get('status') ?? '1',
      site_id: searchParams.get('site_id') ?? '',
      name: searchParams.get('name') ?? '',
      zone_id: searchParams.get('zone_id') ?? '',
      type: searchParams.get('type') ?? '',
      created_at_start: searchParams.get('created_at_start') ?? '',
      created_at_end: searchParams.get('created_at_end') ?? '',
      account_number: searchParams.get('account_number') ?? '',
      paytype: searchParams.get('paytype') ?? ''
    });
  }, [resolvedSearchKey]);

  const filterChips = useMemo(() => {
    const items: { key: string; label: string; value: string }[] = [];
    const st = searchParams.get('status');
    if (st && st !== '1') {
      items.push({
        key: 'status',
        label: 'Status',
        value: st === '0' ? 'Inactive' : st
      });
    }
    const simpleKeys = [
      'site_id',
      'name',
      'zone_id',
      'type',
      'account_number',
      'paytype'
    ] as const;
    for (const key of simpleKeys) {
      const v = searchParams.get(key);
      if (!v) continue;
      let display = v;
      if (key === 'paytype') {
        display =
          PAY_TYPE_LIST.find((p) => p.value === v)?.name ?? v;
      }
      const label =
        key === 'site_id'
          ? `${siteLabel} ID`
          : snakeToTitle(key);
      items.push({ key, label, value: display });
    }
    const ds = searchParams.get('created_at_start');
    const de = searchParams.get('created_at_end');
    if (ds || de) {
      items.push({
        key: 'registration_dates',
        label: 'Registration',
        value: `${ds ?? '…'} → ${de ?? '…'}`
      });
    }
    return items;
  }, [searchParams, siteLabel]);

  const handleApplyFilters = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const updates: Record<string, string | null | undefined> = {
        status: filterDraft.status || '1',
        site_id: filterDraft.site_id.trim() || null,
        name: filterDraft.name.trim() || null,
        zone_id: filterDraft.zone_id.trim() || null,
        type: filterDraft.type.trim() || null,
        created_at_start: filterDraft.created_at_start.trim() || null,
        created_at_end: filterDraft.created_at_end.trim() || null,
        account_number: filterDraft.account_number.trim() || null,
        paytype: filterDraft.paytype.trim() || null,
        page: '1'
      };
      const qs = createQueryString(searchParams, updates);
      const href = qs ? `${pathname}?${qs}` : pathname;
      navigateWithPending(href);
    },
    [filterDraft, navigateWithPending, pathname, searchParams]
  );

  const handleClearFilters = useCallback(() => {
    const limitKept = searchParams.get('limit') ?? '10';
    const qs = createQueryString(searchParams, {
      site_id: null,
      name: null,
      zone_id: null,
      type: null,
      created_at_start: null,
      created_at_end: null,
      account_number: null,
      paytype: null,
      status: '1',
      page: '1',
      limit: limitKept
    });
    navigateWithPending(qs ? `${pathname}?${qs}` : pathname);
  }, [navigateWithPending, pathname, searchParams]);

  const removeFilterChip = useCallback(
    (chipKey: string) => {
      const updates: Record<string, string | null | undefined> = {
        page: '1'
      };
      if (chipKey === 'registration_dates') {
        updates.created_at_start = null;
        updates.created_at_end = null;
      } else if (chipKey === 'status') {
        updates.status = '1';
      } else {
        updates[chipKey] = null;
      }
      const qs = createQueryString(searchParams, updates);
      navigateWithPending(qs ? `${pathname}?${qs}` : pathname);
    },
    [navigateWithPending, pathname, searchParams]
  );

  const handlePagination = useCallback(
    (targetPage: number) => {
      const normalizedTarget = Math.max(1, Math.min(targetPage, pageCount));
      if (normalizedTarget === currentPage) return;

      const href = buildHref({
        page: normalizedTarget <= 1 ? undefined : String(normalizedTarget)
      });
      navigateWithPending(href);
    },
    [currentPage, pageCount, buildHref, navigateWithPending]
  );

  useEffect(() => {
    if (!openSiteId) return;
    if (connectionCacheRef.current[openSiteId] !== undefined) return;
    void fetchConnections(openSiteId);
  }, [openSiteId, fetchConnections]);

  const invalidateSite = useCallback((siteId: string) => {
    setConnectionCache((c) => {
      const next = { ...c };
      delete next[siteId];
      return next;
    });
    void fetchConnections(siteId);
  }, [fetchConnections]);

  const handleSiteStatus = async (
    site: SiteConnectionTableProps,
    isActive: boolean
  ): Promise<boolean> => {
    try {
      const { error: siteError, data: siteData } = await supabase
        .from('sites')
        .update({ is_active: isActive })
        .eq('id', site.id)
        .select();

      if (siteError) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: siteError.message
        });
        return false;
      }
      if (!siteData?.length) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No rows updated.'
        });
        return false;
      }
      if (!isActive) {
        const { error: connectionError } = await supabase
          .from('connections')
          .update({ is_active: false, updated_by: user?.id })
          .eq('site_id', site.id);
        if (connectionError) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: connectionError.message
          });
          return false;
        }
      }
      toast({
        variant: 'success',
        title: 'Success',
        description: `${siteLabel} ${isActive ? 'activated' : 'deactivated'}.`
      });
      return true;
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Unexpected error updating site.'
      });
      return false;
    }
  };

  const aiHref = useMemo(() => {
    if (!openSiteId) return '/portal/report/ai';
    const p = new URLSearchParams();
    p.set('site_id', openSiteId);
    const raw = connectionCache[openSiteId];
    const list =
      raw == null
        ? []
        : paytypeFilter != null
          ? raw.filter((c) => c.paytype === paytypeFilter)
          : raw;
    const selId = selectedBySite[openSiteId];
    const conn = list.find((c) => c.id === selId);
    if (conn) {
      p.set('connection_id', conn.id);
      if (conn.biller_id) p.set('biller_id', conn.biller_id);
    }
    return `/portal/report/ai?${p.toString()}`;
  }, [
    openSiteId,
    connectionCache,
    selectedBySite,
    paytypeFilter
  ]);

  const aiScope = useMemo(() => {
    if (!openSiteId) {
      return {
        siteId: undefined as string | undefined,
        connectionId: undefined as string | undefined,
        connectionAccountNumber: undefined as string | undefined,
        connectionsState: 'none' as
          | 'none'
          | 'loading'
          | 'error'
          | 'empty'
          | 'ready'
      };
    }

    const raw = connectionCache[openSiteId];
    if (raw === undefined) {
      // Not in cache yet; connections are being fetched.
      return {
        siteId: openSiteId,
        connectionId: undefined,
        connectionAccountNumber: undefined,
        connectionsState: 'loading'
      };
    }

    if (raw === null) {
      return {
        siteId: openSiteId,
        connectionId: undefined,
        connectionAccountNumber: undefined,
        connectionsState: 'error'
      };
    }

    const list =
      paytypeFilter != null
        ? raw.filter((c) => c.paytype === paytypeFilter)
        : raw;

    if (list.length === 0) {
      return {
        siteId: openSiteId,
        connectionId: undefined,
        connectionAccountNumber: undefined,
        connectionsState: 'empty'
      };
    }

    const selId = selectedBySite[openSiteId];
    const conn = list.find((c) => c.id === selId);
    return {
      siteId: openSiteId,
      connectionId: conn?.id,
      connectionAccountNumber: conn?.account_number,
      connectionsState: conn ? 'ready' : 'empty'
    };
  }, [openSiteId, connectionCache, selectedBySite, paytypeFilter]);

  return (
    <div className="space-y-6">
      <SiteFormModal
        isOpen={registerSiteOpen}
        handleClose={() => setRegisterSiteOpen(false)}
      />

      <Dialog open={!!editingSite} onOpenChange={() => setEditingSite(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto sm:w-full sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit {siteLabel}</DialogTitle>
          </DialogHeader>
          {editingSite ? (
            <EditSiteForm
              initialData={{
                id: editingSite.id,
                name: editingSite.name ?? '',
                latitude: Number(editingSite.latitude) || 0,
                longitude: Number(editingSite.longitude) || 0,
                zone_id: editingSite.zone_id ?? '',
                type: editingSite.type ?? ''
              }}
              handleClose={() => {
                setEditingSite(null);
                router.refresh();
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertModal
        title={`Deactivate ${siteLabel}?`}
        description={`Deactivating will also deactivate all connections under this ${siteLabel}.`}
        isOpen={!!deactivateSite}
        onClose={() => setDeactivateSite(null)}
        onConfirm={() => {
          if (!deactivateSite) return;
          startDeactivateTransition(async () => {
            const ok = await handleSiteStatus(deactivateSite, false);
            if (ok) {
              setDeactivateSite(null);
              router.refresh();
            }
          });
        }}
        loading={isDeactivatePending}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {isExplorerListPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating results…
              </span>
            ) : (
              <>
                {totalCount} {siteLabel}
                {totalCount === 1 ? '' : 's'} total
                {paytypeFilter != null
                  ? ` · filtered by ${camelCaseToTitleCase(PAY_TYPE[String(paytypeFilter)])}`
                  : ''}
              </>
            )}
          </p>
          {filterChips.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {filterChips.map((chip) => (
                <Button
                  key={chip.key}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-muted-foreground"
                  disabled={isExplorerListPending || isNavPending}
                  onClick={() => removeFilterChip(chip.key)}
                >
                  <span className="text-foreground">
                    {chip.label}: {chip.value}
                  </span>
                  <X className="h-3 w-3 shrink-0" />
                </Button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <PortalFilterSheet
            trigger={
              <div className="inline-flex items-center gap-2">
                <IconButton
                  variant="outline"
                  icon={Filter}
                  text="Filter"
                  disabled={isExplorerListPending}
                />
                {isNavPending ? (
                  <Loader2
                    aria-hidden
                    className="h-4 w-4 shrink-0 animate-spin text-muted-foreground"
                  />
                ) : null}
              </div>
            }
            primaryLabel={`Find ${siteLabel}s`}
            onSubmit={handleApplyFilters}
            onClear={handleClearFilters}
            primaryDisabled={isNavPending}
            primaryPending={isNavPending}
            clearDisabled={isNavPending}
          >
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={filterDraft.status || '1'}
                  onValueChange={(value) =>
                    setFilterDraft((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Inactive</SelectItem>
                    <SelectItem value="1">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="infra-site_id">{siteLabel} ID</Label>
                  <Input
                    id="infra-site_id"
                    value={filterDraft.site_id}
                    onChange={(e) =>
                      setFilterDraft((prev) => ({
                        ...prev,
                        site_id: e.target.value
                      }))
                    }
                    placeholder={`Search by ${siteLabel} ID`}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="infra-account_number">Account number</Label>
                  <Input
                    id="infra-account_number"
                    value={filterDraft.account_number}
                    onChange={(e) =>
                      setFilterDraft((prev) => ({
                        ...prev,
                        account_number: e.target.value
                      }))
                    }
                    placeholder="Comma or space separated"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="infra-name">{siteLabel} name</Label>
                  <Input
                    id="infra-name"
                    value={filterDraft.name}
                    onChange={(e) =>
                      setFilterDraft((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder={`${siteLabel} name`}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="infra-zone_id">Zone ID</Label>
                  <Input
                    id="infra-zone_id"
                    value={filterDraft.zone_id}
                    onChange={(e) =>
                      setFilterDraft((prev) => ({
                        ...prev,
                        zone_id: e.target.value
                      }))
                    }
                    placeholder="Zone ID"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{siteLabel} type</Label>
                <StationTypeSelector
                  value={
                    filterDraft.type
                      ? filterDraft.type.split(',').filter(Boolean)
                      : []
                  }
                  onChange={(types) =>
                    setFilterDraft((prev) => ({
                      ...prev,
                      type: types.length ? types.join(',') : ''
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Payment type</Label>
                <Select
                  value={filterDraft.paytype === '' ? '__all__' : filterDraft.paytype}
                  onValueChange={(value) =>
                    setFilterDraft((prev) => ({
                      ...prev,
                      paytype: value === '__all__' ? '' : value
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All payment types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All payment types</SelectItem>
                    {PAY_TYPE_LIST.map((pt) => (
                      <SelectItem key={pt.value} value={pt.value}>
                        {pt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Registration date range</Label>
                <div className="flex gap-2">
                  <Input
                    id="infra-created_at_start"
                    type="date"
                    value={filterDraft.created_at_start}
                    onChange={(e) =>
                      setFilterDraft((prev) => ({
                        ...prev,
                        created_at_start: e.target.value
                      }))
                    }
                  />
                  <Input
                    id="infra-created_at_end"
                    type="date"
                    value={filterDraft.created_at_end}
                    onChange={(e) =>
                      setFilterDraft((prev) => ({
                        ...prev,
                        created_at_end: e.target.value
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </PortalFilterSheet>
          {filterChips.length > 0 ? (
            <Badge variant="secondary" className="h-8 px-2">
              {filterChips.length} filter{filterChips.length === 1 ? '' : 's'}
            </Badge>
          ) : null}
          <Button type="button" onClick={() => setRegisterSiteOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Register {siteLabel}
          </Button>
        </div>
      </div>

      {loadError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load connections</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : null}

      {!isExplorerListPending ? (
        <div className="space-y-3">
          {sites.map((site) => {
          const isOpen = openSiteId === site.id;
          const rawList = connectionCache[site.id];
          const listForSite =
            rawList == null
              ? []
              : paytypeFilter != null
                ? rawList.filter((c) => c.paytype === paytypeFilter)
                : rawList;

          return (
            <Collapsible
              key={site.id}
              open={isOpen}
              onOpenChange={(open) => setOpenSiteId(open ? site.id : '')}
            >
              <Card className="border-border bg-card">
                <div className="flex items-center gap-2 px-2">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-3 py-2.5 text-left outline-none ring-offset-background hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                        <span className="truncate font-semibold text-foreground">
                          {site.id}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {site.type ?? 'N/A'}
                        </span>
                        <IsActiveBadge isActive={site.is_active} />
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <div className="flex items-center py-2 pr-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setEditingSite(site)}>
                          Edit {siteLabel}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            if (site.is_active) setDeactivateSite(site);
                            else {
                              startDeactivateTransition(async () => {
                                const ok = await handleSiteStatus(site, true);
                                if (ok) router.refresh();
                              });
                            }
                          }}
                        >
                          {site.is_active
                            ? `Deactivate ${siteLabel}`
                            : `Activate ${siteLabel}`}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            Add connection
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/portal/site/postpaid/create?site_id=${encodeURIComponent(site.id)}`}
                              >
                                Postpaid
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/portal/site/prepaid/create?site_id=${encodeURIComponent(site.id)}`}
                              >
                                Prepaid
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/portal/site/submeter/create?site_id=${encodeURIComponent(site.id)}`}
                              >
                                Submeter
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-4">
                    {loadingSiteId === site.id && rawList === undefined ? (
                      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading connections...
                      </div>
                    ) : null}
                    {isOpen && rawList !== undefined && !loadingSiteId ? (
                      listForSite.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No connections match the current filters. Add a
                          connection from the menu.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex max-w-md flex-col gap-2">
                            <span className="text-sm font-medium text-foreground">
                              Connection
                            </span>
                            <Select
                              value={selectedBySite[site.id] ?? ''}
                              onValueChange={(v) =>
                                setSelectedBySite((s) => ({
                                  ...s,
                                  [site.id]: v
                                }))
                              }
                              disabled={loadingSiteId === site.id}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select connection" />
                              </SelectTrigger>
                              <SelectContent>
                                {listForSite.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    <span className="font-mono">
                                      {c.account_number}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="ml-2 text-xs"
                                    >
                                      {camelCaseToTitleCase(
                                        PAY_TYPE[String(c.paytype)] ??
                                          'postpaid'
                                      )}
                                    </Badge>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {(() => {
                            const selId = selectedBySite[site.id];
                            const conn = listForSite.find((c) => c.id === selId);
                            return conn ? (
                              <ConnectionProfileBody
                                connection={conn}
                                onMutate={() => invalidateSite(site.id)}
                              />
                            ) : null;
                          })()}
                        </div>
                      )
                    ) : null}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
          })}
        </div>
      ) : null}

      {isExplorerListPending ? (
        <div className="space-y-3">
          {Array.from({ length: Math.min(5, pageSize) }, (_, idx) => idx).map((i) => (
            <Card key={`list-skeleton-${i}`} className="border-border bg-card">
              <div className="flex items-center gap-2 px-2">
                <div className="flex min-w-0 flex-1 flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <CardContent className="space-y-2 pt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {!isExplorerListPending && sites.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No results.
          </CardContent>
        </Card>
      ) : null}

      {pageCount > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {pageCount}
            {isExplorerListPending ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin inline" />
            ) : null}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isExplorerListPending || currentPage <= 1}
              onClick={() => handlePagination(currentPage - 1)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isExplorerListPending || currentPage >= pageCount}
              onClick={() => handlePagination(currentPage + 1)}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <Card className="border-border bg-card">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Deeper analysis with AI
            </p>
            <p className="text-sm text-muted-foreground">
              {openSiteId ? (
                aiScope.connectionsState === 'loading' ? (
                  <>Loading connection options for site <span className="font-mono">{openSiteId}</span>...</>
                ) : aiScope.connectionsState === 'error' ? (
                  <>Could not load connections for site <span className="font-mono">{openSiteId}</span>.</>
                ) : aiScope.connectionsState === 'empty' ? (
                  <>Opens the AI Bill Analyst scoped to site <span className="font-mono">{openSiteId}</span> (no matching connection for the current filters).</>
                ) : (
                  <>
                    Opens the AI Bill Analyst scoped to site{' '}
                    <span className="font-mono">{aiScope.siteId}</span> and connection{' '}
                    <span className="font-mono">{aiScope.connectionId}</span>
                    {aiScope.connectionAccountNumber ? (
                      <>
                        {' '}
                        (account <span className="font-mono">{aiScope.connectionAccountNumber}</span>)
                      </>
                    ) : null}
                    .
                  </>
                )
              ) : (
                <>
                  Opens the AI Bill Analyst without a site/connection scope. Expand a{' '}
                  {siteLabel.toLowerCase()} above to load connections first.
                </>
              )}
            </p>
          </div>
          <Button asChild variant="default" className="shrink-0 gap-2">
            <Link href={aiHref}>
              <Sparkles className="h-4 w-4" />
              AI analyst
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
