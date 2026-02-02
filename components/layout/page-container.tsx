'use client'

import React, { useRef, useEffect } from 'react'
import { useScrollHeader } from '@/components/providers/scroll-provider'

const SCROLL_THRESHOLD = 10

export default function PageContainer({
  children,
  scrollable = false
}: {
  children: React.ReactNode
  scrollable?: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { setHeaderVisible } = useScrollHeader()
  const lastScrollTop = useRef(0)

  useEffect(() => {
    if (!scrollable || !scrollRef.current) return
    const el = scrollRef.current

    const onScroll = () => {
      const scrollTop = el.scrollTop
      if (scrollTop <= 0) {
        setHeaderVisible(true)
        lastScrollTop.current = scrollTop
        return
      }
      if (Math.abs(scrollTop - lastScrollTop.current) < SCROLL_THRESHOLD) return
      if (scrollTop > lastScrollTop.current) {
        setHeaderVisible(false)
      } else {
        setHeaderVisible(true)
      }
      lastScrollTop.current = scrollTop
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [scrollable, setHeaderVisible])

  return (
    <>
      {scrollable ? (
        <div className="flex min-h-0 h-full flex-col overflow-hidden">
          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-0 px-4 pb-6"
          >
            {children}
          </div>
        </div>
      ) : (
        <div className="h-full p-4 pb-6">{children}</div>
      )}
    </>
  )
}
