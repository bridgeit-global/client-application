'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatDateWithTime, timeAgo } from '@/lib/utils/date-format'
import { CreditCard, User, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export type BillPaymentItem = {
    action: string
    userId: string
    timestamp: string
}

type Props = {
    items: BillPaymentItem[]
    className?: string
    title?: string
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

export function BillPaymentTimeline({ items, className, title = 'Payment History' }: Props) {
    const supabase = createClient()
    const sorted = [...items].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    const getUserName = async (userId: string) => {
        const { data, error } = await supabase.from('users').select('first_name, last_name').eq('id', userId).single()
        if (error) {
            console.error('Error fetching user name:', error)
            return userId
        }
        return `${data?.first_name} ${data?.last_name}` || userId
    }

    return (
        <Card className={cn('p-4', className)}>
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold">{title}</h3>
                <Badge variant="secondary" className="text-xs">{sorted.length} payment{sorted.length !== 1 ? 's' : ''}</Badge>
            </div>
            {sorted.length === 0 ? (
                <div className="text-sm text-muted-foreground">No payment history available.</div>
            ) : (
                <div className="pr-2">
                    <ol className="relative ml-3 border-l border-border">
                        {sorted.map((item, idx) => {
                            const userName = getUserName(item.userId)
                            return (
                                <li key={idx} className="mb-6 ml-4">
                                    <span className="absolute -left-1.5 flex h-3 w-3 items-center justify-center rounded-full border border-background bg-green-500 ring-2 ring-green-500/20">
                                        {/* dot */}
                                    </span>
                                    <div className="flex flex-col gap-1 rounded-md bg-muted/40 p-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
                                                <CreditCard className="h-4 w-4" />
                                                <span>{item.action}</span>
                                            </span>
                                            <div className="text-xs text-muted-foreground">
                                                {formatDateWithTime(item.timestamp)} • <TimeAgo timestamp={item.timestamp} />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm">
                                            <User className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground">
                                                by <span className="font-medium">{userName}</span>
                                            </span>
                                        </div>
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

export default BillPaymentTimeline
