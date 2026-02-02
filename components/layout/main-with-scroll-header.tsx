'use client'

import React from 'react'
import { HeaderWithCollapse } from '@/components/layout/header-with-collapse'
import PageContainer from '@/components/layout/page-container'
import { ScrollProvider } from '@/components/providers/scroll-provider'

export function MainWithScrollHeader({
  children,
  footer
}: {
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <ScrollProvider>
      <main className="w-full flex-1 flex flex-col overflow-hidden">
        <HeaderWithCollapse />
        <div className="flex-1 overflow-hidden min-h-0">
          <PageContainer scrollable>{children}</PageContainer>
        </div>
        {footer}
      </main>
    </ScrollProvider>
  )
}
