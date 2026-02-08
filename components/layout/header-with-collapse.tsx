'use client'

import React, { useRef, useState, useEffect } from 'react'
import Header from '@/components/layout/header'
import { useScrollHeader } from '@/components/providers/scroll-provider'
import { cn } from '@/lib/utils'

const DEFAULT_HEADER_HEIGHT = 56

export function HeaderWithCollapse() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [headerHeight, setHeaderHeight] = useState(DEFAULT_HEADER_HEIGHT)
  const { headerVisible } = useScrollHeader()

  useEffect(() => {
    const el = wrapperRef.current?.querySelector('header')
    if (!el) return
    const updateHeight = () => {
      const h = el.getBoundingClientRect().height
      setHeaderHeight((prev) => (h > 0 ? h : prev))
    }
    updateHeight()
    const ro = new ResizeObserver(updateHeight)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      className={cn(
        "shrink-0 transition-[height] duration-300 ease-in-out",
        headerVisible ? "overflow-visible" : "overflow-hidden"
      )}
      style={{ height: headerVisible ? headerHeight : 0 }}
    >
      <div ref={wrapperRef}>
        <Header />
      </div>
    </div>
  )
}
