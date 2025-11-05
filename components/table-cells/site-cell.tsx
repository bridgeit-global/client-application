'use client';
import { usePathname, useRouter } from 'next/navigation';
import { Badge } from '../ui/badge';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '../ui/context-menu';
import { EyeIcon, XIcon } from 'lucide-react';
import { CopyIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../ui/use-toast';
import { Input } from '../ui/input';
import IconButton from '../buttons/icon-button';
import { useSiteName } from '@/lib/utils/site';
import { useUserStore } from '@/lib/store/user-store';
import { Button } from '../ui/button';

export const SiteIdCell = ({ row }: { row: any }) => {
  const site_name = useSiteName();
  const [siteId, setSiteId] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const { user } = useUserStore()
  const pathname = usePathname();

  const { toast } = useToast()
  const supabase = createClient()

  const getAllSiteId = async (search?: string) => {
    try {
      setIsLoading(true)
      let query = supabase
        .from('sites')
        .select('id').eq('is_active', true)
      if (search) {
        query = query.ilike('id', `%${search}%`)
      } else {
        query = query.order('id', { ascending: true }).limit(10)
      }
      const { data, error } = await query

      if (error) throw error
      setSiteId(data?.map((site) => site.id) || [])
    } catch (err) {
      toast({
        variant: 'destructive',
        title: `${site_name} ID load failed`,
        description: `${site_name} ID load failed`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Debounce search
  useEffect(() => {
    if (searchQuery.length > 0 || isEditing) {
      const timeoutId = setTimeout(() => {
        getAllSiteId(searchQuery)
      }, 300)

      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, isEditing])

  const router = useRouter();
  const original = Array.isArray(row.original?.connections)
    ? row.original
    : row.original?.connections || row.original;

  const { site_id, is_active, id } = original;
  const displayId = site_id || id;

  if (!displayId) return null;
  const handleCopy = () => navigator.clipboard.writeText(displayId);
  const goToSite = () => is_active ? router.push(`/portal/site-profile?id=${displayId}`) : null;

  return (
    <ContextMenu>
      {isEditing || siteId.length > 0 || searchQuery ? (
        <div className='flex items-center justify-evenly'>
          <Select
            defaultValue={displayId}
            disabled={isLoading}
            onValueChange={async (value) => {
              try {
                setIsLoading(true)
                const { error } = await supabase
                  .from('connections')
                  .update({ site_id: value, updated_by: user?.id })
                  .eq('id', original.id)
                if (error) throw error

                setIsEditing(false)
                setSiteId([])
                router.refresh()
                toast({
                  variant: 'success',
                  title: `${site_name} ID updated`,
                  description: `${site_name} ID updated successfully`,
                })

              } catch (err) {
                toast({
                  variant: 'destructive',
                  title: `${site_name} ID update failed`,
                  description: `${site_name} ID update failed`,
                })
              } finally {
                setIsLoading(false)
              }
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px] min-w-[150px] transition-all duration-200 hover:border-primary/50">
              <SelectValue>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary/50 border-t-transparent rounded-full animate-spin" />
                    <span className="text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  displayId
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-[300px] overflow-y-auto w-full sm:w-[400px] min-w-[250px]">
              <div className="flex items-center gap-2 px-2 py-2 sticky top-0 bg-white z-10">
                <Input
                  className="w-full px-2 py-1 text-sm border rounded-md focus:outline-none bg-white"
                  placeholder={`Search ${site_name} ID...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="relative">
                {isLoading ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary/50 border-t-transparent rounded-full animate-spin" />
                      <span className="text-muted-foreground">Loading...</span>
                    </div>
                  </SelectItem>
                ) : siteId.length === 0 ? (
                  <SelectItem value="no-results" disabled>
                    <span className="text-muted-foreground">No results found</span>
                  </SelectItem>
                ) : (
                  siteId.map((id) => (
                    <SelectItem
                      key={id}
                      value={id}
                      className="transition-colors hover:bg-primary/10"
                    >
                      {id}
                    </SelectItem>
                  ))
                )}
              </div>
            </SelectContent>
          </Select>
          <IconButton
            variant={'ghost'}
            size={'icon'}
            onClick={() => {
              setIsEditing(false);
              setSiteId([]);
              setSearchQuery('');
            }}
            icon={XIcon}
          />
        </div>
      ) : <ContextMenuTrigger>
        <div className='flex items-center'>
          <Button
            variant="outline"
            size="sm"
            disabled={!is_active}
            className="flex gap-2 items-center px-3 py-1.5 rounded-full shadow-sm focus:ring-2 focus:ring-secondary/40 transition-all duration-150"
            onClick={goToSite}
          >
            {displayId}
          </Button>
        </div>
      </ContextMenuTrigger>}
      <ContextMenuContent className="min-w-[180px]">
        <ContextMenuItem
          onSelect={handleCopy}
          className="flex items-center gap-2 transition-colors hover:bg-primary/10"
        >
          <CopyIcon className="w-4 h-4" /> Copy
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={goToSite}
          className="flex items-center gap-2 transition-colors hover:bg-primary/10"
        >
          <EyeIcon className="w-4 h-4" /> View {site_name}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu >
  );
};
