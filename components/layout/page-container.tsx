'use client'

import React, { useRef } from 'react'

export default function PageContainer({
  children,
  scrollable = false
}: {
  children: React.ReactNode
  scrollable?: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

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
