import { createServicePortalClient } from '@/lib/supabase/server'
import type { BatchHistoryItem } from '@/lib/batch/batch-history-types'

export type { BatchHistoryItem }

type BatchHistorySource = {
  batch_status?: string | null
  batch_name?: string | null
  created_at?: string | null
  created_by?: string | null
  user_actions?: unknown
} | null

function formatDisplayName(
  firstName?: string | null,
  lastName?: string | null
): string | null {
  const name = [firstName, lastName]
    .filter((part): part is string => Boolean(part && String(part).trim()))
    .join(' ')
    .trim()
  return name || null
}

async function resolveUserDisplayNames(
  userIds: string[]
): Promise<Record<string, string>> {
  const uniqueIds = [...new Set(userIds.filter((id) => Boolean(id?.trim())))]
  if (uniqueIds.length === 0) return {}

  try {
    // Service role: portal.users SELECT is admin-only under RLS, but activity
    // actors still need display names for non-admin viewers.
    const supabase = createServicePortalClient()
    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .in('id', uniqueIds)

    if (error) {
      console.error('resolveUserDisplayNames failed:', error)
      return {}
    }

    const names: Record<string, string> = {}
    for (const user of data || []) {
      const display = formatDisplayName(user.first_name, user.last_name)
      if (display) names[user.id] = display
    }
    return names
  } catch (error) {
    console.error('resolveUserDisplayNames error:', error)
    return {}
  }
}

/**
 * Build batch activity items and attach display names for actors.
 */
export async function buildBatchHistoryItems(
  batch: BatchHistorySource
): Promise<BatchHistoryItem[]> {
  let items: BatchHistoryItem[] = Array.isArray(batch?.user_actions)
    ? (batch.user_actions as any[]).map((u) => ({
        action: u?.action || 'updated',
        user_id: u?.user_id || '',
        status_to: u?.status_to || batch?.batch_status || 'unpaid',
        status_from: u?.status_from ?? undefined,
        timestamp:
          u?.timestamp ||
          u?.created_at ||
          batch?.created_at ||
          new Date().toISOString(),
        note: u?.note || null
      }))
    : []

  if (items.length === 0 && batch) {
    items = [
      {
        action: 'created',
        user_id: batch.created_by || '',
        status_to: 'unpaid',
        status_from: null,
        timestamp: batch.created_at || new Date().toISOString(),
        note: batch.batch_name
          ? `Batch "${batch.batch_name}" created`
          : null
      }
    ]
  }

  const namesById = await resolveUserDisplayNames(
    items.map((item) => item.user_id)
  )

  return items.map((item) => ({
    ...item,
    user_name: namesById[item.user_id] || undefined
  }))
}
