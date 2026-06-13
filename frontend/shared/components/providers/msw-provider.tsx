'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import { initMocks } from '@/infra/mocks'

const MSWContext = createContext({ isReady: false })

export const useMSW = () => useContext(MSWContext)

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [mswReady, setMswReady] = useState(false)

  useEffect(() => {
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
    
    if (process.env.NODE_ENV === 'development' && useMock) {
      initMocks()
        .catch((error) => {
          // A mock-worker failure must not permanently block app init.
          console.error('MSW initialisation failed:', error)
        })
        .finally(() => setMswReady(true))
    } else {
      setTimeout(() => setMswReady(true), 0)
    }
  }, [])

  return (
    <MSWContext.Provider value={{ isReady: mswReady }}>
      {children}
    </MSWContext.Provider>
  )
}
