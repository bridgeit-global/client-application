'use client'

import React from 'react'
import Header from '@/components/layout/header'
import PageContainer from '@/components/layout/page-container'
import { ScrollProvider } from '@/components/providers/scroll-provider'

export function MainWithScrollHeader({
  children,
  footer,
  topBanner
}: {
  children: React.ReactNode
  footer?: React.ReactNode
  topBanner?: React.ReactNode
}) {
  return (
    <ScrollProvider>
      <main className="w-full flex-1 flex flex-col overflow-hidden">
        <div className="shrink-0">
          {topBanner}
          <Header />
        </div>
        <div className="flex-1 overflow-hidden min-h-0">
          <PageContainer scrollable>{children}</PageContainer>
        </div>
        {footer}
      </main>
    </ScrollProvider>
  )
}
