'use client'

import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/bks/ds-system-sdk/components/ui/button'
import { Badge } from '@/bks/ds-system-sdk/components/ui/badge'
import { cn } from '@/bks/ds-system-sdk/lib/utils'
import type { Visit } from '../types'
import { useTranslations, useLocale } from 'next-intl'
import 'dayjs/locale/vi'
import 'dayjs/locale/ja'

export interface AppointmentCalendarProps {
  visits: Visit[]
  onSelectAppointment: (visit: Visit) => void
  onDateDoubleClick: (date: string) => void
  onMonthRangeChange: (dateFrom: string, dateTo: string) => void
  className?: string
}

function getStatusBadgeStyle(statusValue: number): {
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  className?: string
} {
  switch (statusValue) {
    case 1: // WAITING / Chờ khám
      return { variant: 'secondary', className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800' }
    case 2: // EXAMINING / Đang khám
      return { variant: 'default', className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800' }
    case 3: // COMPLETED / Đã hoàn thành
      return { variant: 'secondary', className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700' }
    case 4: // CANCELLED / Đã hủy
      return { variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800' }
    default:
      return { variant: 'secondary' }
  }
}

export function AppointmentCalendar({
  visits,
  onSelectAppointment,
  onDateDoubleClick,
  onMonthRangeChange,
  className,
}: AppointmentCalendarProps) {
  const t = useTranslations('appointments')
  const locale = useLocale()
  
  // Set dayjs locale dynamically
  const dayjsLocale = locale === 'jp' ? 'ja' : locale
  dayjs.locale(dayjsLocale)

  const [currentDate, setCurrentDate] = useState(() => dayjs())

  const startOfMonth = currentDate.startOf('month')
  const endOfMonth = currentDate.endOf('month')
  const startOfWeek = startOfMonth.startOf('week')
  const endOfWeek = endOfMonth.endOf('week')

  // Trigger parent range callback on current date change
  useEffect(() => {
    onMonthRangeChange(
      startOfMonth.format('YYYY-MM-DD'),
      endOfMonth.format('YYYY-MM-DD')
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate])

  const days: dayjs.Dayjs[] = []
  let day = startOfWeek
  while (day.isBefore(endOfWeek) || day.isSame(endOfWeek, 'day')) {
    days.push(day)
    day = day.add(1, 'day')
  }

  const handlePrevMonth = () => {
    setCurrentDate((prev) => prev.subtract(1, 'month'))
  }

  const handleNextMonth = () => {
    setCurrentDate((prev) => prev.add(1, 'month'))
  }

  const handleToday = () => {
    setCurrentDate(dayjs())
  }

  const getVisitsForDay = (date: dayjs.Dayjs) => {
    return visits.filter((v) => {
      return v.appointment_date && dayjs(v.appointment_date).isSame(date, 'day')
    })
  }

  // Get weekday names
  const weekdayHeaders = [
    t('calendar.sunday') || 'CN',
    t('calendar.monday') || 'T2',
    t('calendar.tuesday') || 'T3',
    t('calendar.wednesday') || 'T4',
    t('calendar.thursday') || 'T5',
    t('calendar.friday') || 'T6',
    t('calendar.saturday') || 'T7',
  ]

  // Formatted header text, localized natively by dayjs
  const headerText = currentDate.format('MMMM YYYY')

  return (
    <div className={cn("flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm", className)}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className="text-lg font-bold text-foreground">
          {headerText}
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleToday} size="sm">
            {t('calendar.today') || 'Hôm nay'}
          </Button>
          <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-border overflow-hidden rounded-lg border border-border">
        {/* Weekdays */}
        {weekdayHeaders.map((dayName, idx) => (
          <div
            key={idx}
            className="bg-muted py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            {dayName}
          </div>
        ))}

        {/* Days */}
        {days.map((date, index) => {
          const isCurrentMonth = date.isSame(currentDate, 'month')
          const isToday = date.isSame(dayjs(), 'day')
          const dayVisits = getVisitsForDay(date)

          return (
            <div
              key={index}
              className={cn(
                "min-h-24 bg-card p-2 transition-colors hover:bg-accent/20 flex flex-col justify-between group select-none cursor-pointer border-r border-b border-border/50",
                !isCurrentMonth && "bg-muted/30"
              )}
              onDoubleClick={() => onDateDoubleClick(date.format('YYYY-MM-DD'))}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    "inline-flex items-center justify-center size-6 rounded-full text-xs font-medium",
                    isToday
                      ? "bg-primary text-primary-foreground font-bold"
                      : isCurrentMonth
                      ? "text-foreground"
                      : "text-muted-foreground/40"
                  )}
                >
                  {date.date()}
                </span>
                {dayVisits.length > 0 && (
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {dayVisits.length}
                  </span>
                )}
              </div>

              {/* Day's visits list */}
              <div className="flex-1 overflow-y-auto space-y-1 max-h-20 custom-scrollbar">
                {dayVisits.slice(0, 3).map((v) => {
                  const badgeStyle = getStatusBadgeStyle(v.status.value)
                  
                  return (
                    <button
                      key={v.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectAppointment(v)
                      }}
                      type="button"
                      className="w-full text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <Badge
                        variant={badgeStyle.variant}
                        className={cn("w-full truncate justify-start cursor-pointer px-1 py-0 text-[10px] font-normal leading-normal border shadow-none", badgeStyle.className)}
                      >
                        <span className="truncate">
                          {v.customer?.full_name || '—'}
                        </span>
                      </Badge>
                    </button>
                  )
                })}
                {dayVisits.length > 3 && (
                  <div className="text-[10px] text-muted-foreground text-center font-medium">
                    + {dayVisits.length - 3} lịch hẹn
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
