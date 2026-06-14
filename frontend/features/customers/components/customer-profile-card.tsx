'use client'

import { useTranslations } from 'next-intl'
import { Phone, Calendar, MapPin, Activity } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
} from '@bks/ds-system-sdk'
import type { CustomerDetail } from '../types'
import { formatDate } from '@/shared/lib/format-date'

type CustomerProfileCardProps = {
  customer: CustomerDetail
}

function calculateAge(birthDate: string | undefined): string {
  if (!birthDate) return '—'
  const birth = new Date(birthDate)
  if (isNaN(birth.getTime())) return '—'
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return String(age)
}

function formatOutstandingAmount(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

export function CustomerProfileCard({ customer }: CustomerProfileCardProps) {
  const t = useTranslations('customers')
  const initials = customer.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const hasOutstanding = customer.outstandingAmount > 0

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center gap-4 pb-2 border-b border-border px-6">
        <Avatar size="lg" className="size-16 ring-2 ring-primary/10">
          {customer.avatarPath && (
            <AvatarImage src={customer.avatarPath} alt={customer.fullName} />
          )}
          <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-xl font-bold truncate">{customer.fullName}</CardTitle>
          <div className="text-sm font-semibold text-muted-foreground mt-0.5">
            {customer.code}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Badge variant={customer.status.value === 1 ? 'default' : 'secondary'}>
              {customer.status.label}
            </Badge>
            {customer.gender && (
              <Badge variant="outline">{customer.gender.label}</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6 px-6">
        {/* Outstanding amount highlight card */}
        <div
          className={`p-4 rounded-xl border flex flex-col justify-between gap-1 transition-all ${
            hasOutstanding
              ? 'bg-destructive/10 border-destructive/20 text-destructive'
              : 'bg-muted/30 border-border text-muted-foreground'
          }`}
        >
          <span className="text-xs font-semibold uppercase tracking-wider">
            {t('labels.outstandingAmount')}
          </span>
          <span
            className={`text-2xl font-extrabold tracking-tight ${
              hasOutstanding ? 'text-destructive' : 'text-foreground'
            }`}
          >
            {formatOutstandingAmount(customer.outstandingAmount)}
          </span>
        </div>

        {/* Patient Details List */}
        <div className="space-y-4">
          {/* Primary Phone */}
          <div className="flex items-center gap-3 text-sm">
            <Phone className="size-4 text-muted-foreground shrink-0" aria-hidden />
            <span className="font-semibold text-muted-foreground min-w-24">
              {t('labels.phone')}:
            </span>
            <span className="text-foreground font-medium" dir="ltr">
              {customer.phone}
            </span>
          </div>

          {/* Secondary Phone */}
          {customer.phoneSecondary && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="size-4 text-muted-foreground shrink-0" aria-hidden />
              <span className="font-semibold text-muted-foreground min-w-24">
                {t('labels.phoneSecondary')}:
              </span>
              <span className="text-foreground font-medium" dir="ltr">
                {customer.phoneSecondary}
              </span>
            </div>
          )}

          {/* Age & Birth Date */}
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="size-4 text-muted-foreground shrink-0" aria-hidden />
            <span className="font-semibold text-muted-foreground min-w-24">
              {t('labels.birthDate')}:
            </span>
            <span className="text-foreground font-medium">
              {customer.birthDate
                ? `${formatDate(customer.birthDate)} (Tuổi: ${customer.age ?? calculateAge(customer.birthDate)})`
                : '—'}
            </span>
          </div>

          {/* Source */}
          <div className="flex items-center gap-3 text-sm">
            <Activity className="size-4 text-muted-foreground shrink-0" aria-hidden />
            <span className="font-semibold text-muted-foreground min-w-24">
              {t('labels.source')}:
            </span>
            {customer.source ? (
              <Badge variant="secondary">{customer.source.label}</Badge>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>

          {/* Detailed Address */}
          <div className="flex items-start gap-3 text-sm">
            <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
            <span className="font-semibold text-muted-foreground min-w-24">
              {t('labels.address')}:
            </span>
            <div className="flex flex-col gap-0.5 text-foreground font-medium leading-relaxed">
              <span>{customer.address || '—'}</span>
              {(customer.houseNumber || customer.ward || customer.province) && (
                <span className="text-xs text-muted-foreground">
                  (
                  {[
                    customer.houseNumber,
                    customer.ward?.name,
                    customer.province?.name,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                  )
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
