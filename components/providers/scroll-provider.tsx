'use client'

import React, { createContext, useContext, useState } from 'react'

type ScrollContextValue = {
  headerVisible: boolean
  setHeaderVisible: (visible: boolean) => void
}

const ScrollContext = createContext<ScrollContextValue>({
  headerVisible: true,
  setHeaderVisible: () => {},
})

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const [headerVisible, setHeaderVisible] = useState(true)
  return (
    <ScrollContext.Provider value={{ headerVisible, setHeaderVisible }}>
      {children}
    </ScrollContext.Provider>
  )
}

export function useScrollHeader() {
  return useContext(ScrollContext)
}
