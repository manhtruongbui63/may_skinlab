'use client'

import { useEffect, useState } from 'react'

export function MockProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function init() {
      if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
        const { initMocks } = await import('./index')
        await initMocks()
      }
      setReady(true)
    }
    init()
  }, [])

  // Prevent hydration mismatch - wait for mock init
  if (!ready && process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
    return null
  }

  return <>{children}</>
}
