export type BatchHistoryItem = {
  action: 'created' | 'status_changed' | string
  user_id: string
  /** Server-resolved display name. */
  user_name?: string | null
  status_to: string
  timestamp: string
  status_from?: string | null
  note?: string | null
}
