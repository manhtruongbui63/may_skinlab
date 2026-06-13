'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { ShieldCheck } from 'lucide-react'

export interface AuthScreenShellProps {
  title: string
  subtitle: string
  brandingTitle: string
  brandingDescription: string
  children: ReactNode
}

/**
 * Two-column auth screen layout: a decorative branding panel (lg+) beside the
 * form column. Shared by the forgot/reset password screens.
 */
export function AuthScreenShell({
  title,
  subtitle,
  brandingTitle,
  brandingDescription,
  children,
}: AuthScreenShellProps) {
  const tBranding = useTranslations('Branding')

  return (
    <div className="flex min-h-screen bg-background">
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-muted lg:flex">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 40%, hsl(var(--primary) / 0.12), transparent 50%),
              radial-gradient(circle at 80% 60%, hsl(var(--primary) / 0.08), transparent 50%),
              radial-gradient(circle at 50% 20%, hsl(var(--info) / 0.06), transparent 50%)
            `,
            backgroundSize: '100% 100%',
          }}
        />
        <div className="relative z-10 max-w-lg p-12 text-center">
          <div className="mb-8 inline-flex size-20 items-center justify-center rounded-3xl border border-border bg-background/80 shadow-2xl backdrop-blur-xl">
            <ShieldCheck className="size-10 text-primary" strokeWidth={1.5} aria-hidden />
          </div>
          <h2 className="typo-display mb-4 text-balance font-medium tracking-tight text-foreground">
            {brandingTitle}
          </h2>
          <p className="typo-body text-balance font-light text-muted-foreground">
            {brandingDescription}
          </p>
          <p className="sr-only">{tBranding('systemName')}</p>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center bg-background p-8 sm:p-12 lg:p-24">
        <div className="w-full max-w-sm space-y-10">
          <div className="space-y-3">
            <h1 className="typo-heading-1 tracking-tight text-foreground">{title}</h1>
            <p className="typo-body text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
