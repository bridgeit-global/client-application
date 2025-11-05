'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatDateWithTime, timeAgo } from '@/lib/utils/date-format'
import { CheckCircle2, Clock3, AlertCircle, ArrowRightLeft, PlusCircle } from 'lucide-react'
import { snakeToTitle } from '@/lib/utils/string-format'
import { useAllUsers } from '@/hooks/use-all-users'

export type BatchHistoryItem = {
    action: 'created' | 'status_changed' | string
    user_id: string
    status_to: string
    timestamp: string
    status_from?: string | null
    note?: string | null
}

type Props = {
    items: BatchHistoryItem[]
    className?: string
    title?: string
}

const statusColor: Record<string, string> = {
    unpaid: 'bg-slate-200 text-slate-700',
    processing: 'bg-amber-100 text-amber-800',
    client_paid: 'bg-blue-100 text-blue-800',
    settled: 'bg-emerald-100 text-emerald-800',
    paid: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-rose-100 text-rose-800',
    failed: 'bg-rose-100 text-rose-800'
}

const statusIcon: Record<string, React.ReactNode> = {
    unpaid: <Clock3 className="h-4 w-4" />,
    processing: <ArrowRightLeft className="h-4 w-4" />,
    client_paid: <CheckCircle2 className="h-4 w-4" />,
    settled: <CheckCircle2 className="h-4 w-4" />,
    paid: <CheckCircle2 className="h-4 w-4" />,
    rejected: <AlertCircle className="h-4 w-4" />,
    failed: <AlertCircle className="h-4 w-4" />
}

function getStatusBadge(status?: string) {
    if (!status) return null
    const key = String(status).toLowerCase()
    return (
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', statusColor[key] || 'bg-slate-100 text-slate-700')}>
            <span className="inline-flex items-center justify-center">{statusIcon[key] || <Clock3 className="h-4 w-4" />}</span>
            <span className="capitalize">{snakeToTitle(key === 'client_paid' ? 'Paid' : key)}</span>
        </span>
    )
}

// Client-side only time ago component to prevent hydration mismatch
function TimeAgo({ timestamp }: { timestamp: string }) {
    const [timeAgoText, setTimeAgoText] = useState<string>('')

    useEffect(() => {
        const updateTimeAgo = () => {
            setTimeAgoText(timeAgo(timestamp))
        }

        // Update immediately
        updateTimeAgo()

        // Update every minute to keep it current
        const interval = setInterval(updateTimeAgo, 60000)

        return () => clearInterval(interval)
    }, [timestamp])

    return <span>{timeAgoText}</span>
}

export function BatchHistoryTimeline({ items, className, title = 'Batch History' }: Props) {
    const users = useAllUsers()
    const sorted = [...items].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const getUserName = (userId: string) => {
        const user = users.find(user => user.id === userId)
        return `${user?.first_name} ${user?.last_name}` || userId
    }

    return (
        <Card className={cn('p-4', className)}>
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold">{title}</h3>
                <Badge variant="secondary" className="text-xs">{sorted.length} event{sorted.length !== 1 ? 's' : ''}</Badge>
            </div>
            {sorted.length === 0 ? (
                <div className="text-sm text-muted-foreground">No history available.</div>
            ) : (
                <div className="pr-2">
                    <ol className="relative ml-3 border-l border-border">
                        {sorted.map((item, idx) => {
                            const isCreated = item.action === 'created'
                            const userName = getUserName(item.user_id)
                            return (
                                <li key={idx} className="mb-6 ml-4">
                                    <span className="absolute -left-1.5 flex h-3 w-3 items-center justify-center rounded-full border border-background bg-primary/80 ring-2 ring-primary/20">
                                        {/* dot */}
                                    </span>
                                    <div className="flex flex-col gap-1 rounded-md bg-muted/40 p-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="inline-flex items-center gap-1 text-sm font-medium">
                                                {isCreated ? <PlusCircle className="h-4 w-4 text-primary" /> : <ArrowRightLeft className="h-4 w-4 text-primary" />}
                                                <span className="capitalize">{item.action.replace('_', ' ')}</span>
                                            </span>
                                            <div className="text-xs text-muted-foreground">
                                                {formatDateWithTime(item.timestamp)} • <TimeAgo timestamp={item.timestamp} />
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 text-sm">
                                            {typeof item.status_from !== 'undefined' && item.status_from !== null && (
                                                <div className="flex items-center gap-2">
                                                    {getStatusBadge(item.status_from)}
                                                    <span className="text-muted-foreground">→</span>
                                                </div>
                                            )}
                                            {getStatusBadge(item.status_to)}
                                        </div>

                                        <div className="text-xs text-muted-foreground">
                                            by <span className="font-medium">{userName}</span>
                                        </div>

                                        {item.note && (
                                            <div className="mt-1 rounded-md border border-border bg-background p-2 text-xs leading-relaxed text-muted-foreground">
                                                {item.note}
                                            </div>
                                        )}
                                    </div>
                                </li>
                            )
                        })}
                    </ol>
                </div>
            )}
        </Card>
    )
}

export default BatchHistoryTimeline


