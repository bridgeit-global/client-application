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
  Loader2,
  MoreHorizontal,
  Plus,
  Sparkles
} from 'lucide-react';
import { PAY_TYPE } from '@/constants/bill';
import { camelCaseToTitleCase } from '@/lib/utils/string-format';

type InfrastructureExplorerProps = {
  sites: SiteConnectionTableProps[];
  pageCount: number;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  siteLabel: string;
  paytypeFilter?: number;
};

export function InfrastructureExplorer({
  sites,
  pageCount,
  totalCount,
  currentPage,
  pageSize,
  siteLabel,
  paytypeFilter
}: InfrastructureExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useUserStore();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  const [openSiteId, setOpenSiteId] = useState<string>('');
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);
  const pendingPageRef = useRef<number | null>(null);
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
    // Stop pagination loader once the new page props arrive.
    if (pendingPageRef.current == null) return;
    if (pendingPageRef.current === currentPage) {
      setIsPaginationLoading(false);
      pendingPageRef.current = null;
    }
  }, [currentPage]);

  const handlePagination = useCallback(
    (targetPage: number) => {
      const normalizedTarget = Math.max(1, Math.min(targetPage, pageCount));
      if (normalizedTarget === currentPage) return;

      pendingPageRef.current = normalizedTarget;
      setIsPaginationLoading(true);
      // Avoid holding expansion state across page changes.
      setOpenSiteId('');

      router.push(
        buildHref({
          page: normalizedTarget <= 1 ? undefined : String(normalizedTarget)
        }),
        { scroll: false }
      );
    },
    [currentPage, pageCount, router, buildHref]
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
        .update({ is_active: isActive, updated_by: user?.id })
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
    if (conn) p.set('connection_id', conn.id);
    return `/portal/report/ai?${p.toString()}`;
  }, [
    openSiteId,
    connectionCache,
    selectedBySite,
    paytypeFilter
  ]);

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
          startTransition(async () => {
            const ok = await handleSiteStatus(deactivateSite, false);
            if (ok) {
              setDeactivateSite(null);
              router.refresh();
            }
          });
        }}
        loading={isPending}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {totalCount} {siteLabel}
          {totalCount === 1 ? '' : 's'} total
          {paytypeFilter != null
            ? ` · filtered by ${camelCaseToTitleCase(PAY_TYPE[String(paytypeFilter)])}`
            : ''}
        </p>
        <div className="flex flex-wrap gap-2">
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

      {!isPaginationLoading ? (
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
                <div className="flex items-stretch gap-1 border-b border-border px-2">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left outline-none ring-offset-background hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                        <span className="truncate font-semibold text-foreground">
                          {site.name ?? site.id}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {site.id}
                        </span>
                        <IsActiveBadge isActive={site.is_active} />
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <div className="flex items-center pr-1">
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
                              startTransition(async () => {
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
                        Loading connections…
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
                                siteLabel={siteLabel}
                                siteId={site.id}
                                siteName={site.name ?? undefined}
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

      {isPaginationLoading ? (
        <div className="space-y-3">
          {Array.from({ length: Math.min(5, pageSize) }, (_, idx) => idx).map((i) => (
            <Card key={`pagination-skeleton-${i}`} className="border-border bg-card">
              <div className="flex items-stretch gap-1 border-b border-border px-2">
                <div className="flex min-w-0 flex-1 flex-col gap-1 p-3 sm:flex-row sm:items-center sm:gap-3">
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

      {!isPaginationLoading && sites.length === 0 ? (
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
            {isPaginationLoading ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin inline" />
            ) : null}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isPaginationLoading || currentPage <= 1}
              onClick={() => handlePagination(currentPage - 1)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isPaginationLoading || currentPage >= pageCount}
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
              Opens the AI Bill Analyst with the current {siteLabel.toLowerCase()} (and
              connection, if one is selected in the dropdown). Expand a {siteLabel.toLowerCase()}{' '}
              above to load connections first.
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
