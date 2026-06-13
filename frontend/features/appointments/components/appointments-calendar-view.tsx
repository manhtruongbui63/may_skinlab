'use client'

import { useState } from 'react'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge, Button } from '@bks/ds-system-sdk'
import type { Appointment } from '../types'
import { useTranslations } from 'next-intl'

type AppointmentsCalendarViewProps = {
  appointments: Appointment[]
  onSelectAppointment: (appointment: Appointment) => void
  onCreateAppointmentOnDate: (date: string) => void
}

export function AppointmentsCalendarView({
  appointments,
  onSelectAppointment,
  onCreateAppointmentOnDate,
}: AppointmentsCalendarViewProps) {
  const t = useTranslations('appointments')
  const [currentDate, setCurrentDate] = useState(() => dayjs())

  const startOfMonth = currentDate.startOf('month')
  const endOfMonth = currentDate.endOf('month')
  const startOfWeek = startOfMonth.startOf('week')
  const endOfWeek = endOfMonth.endOf('week')

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

  const getBadgeVariant = (statusValue: number) => {
    switch (statusValue) {
      case 1: // BOOKED
        return 'secondary'
      case 2: // CONFIRMED
        return 'info'
      case 3: // CHECKED_IN
        return 'warning'
      case 4: // COMPLETED
        return 'success'
      case 5: // CANCELLED
        return 'destructive'
      case 6: // NO_SHOW
        return 'default'
      default:
        return 'outline'
    }
  }

  const getAppointmentsForDay = (date: dayjs.Dayjs) => {
    return appointments.filter((appt) => {
      return dayjs(appt.appointment_date).isSame(date, 'day')
    })
  }

  const weekdayHeaders = [
    t('calendar.sunday'),
    t('calendar.monday'),
    t('calendar.tuesday'),
    t('calendar.wednesday'),
    t('calendar.thursday'),
    t('calendar.friday'),
    t('calendar.saturday'),
  ]

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      {/* Calendar Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="typo-h3 text-foreground">
          {currentDate.format('MMMM YYYY')}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleToday} size="sm">
            {t('calendar.today')}
          </Button>
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
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
          const dayAppointments = getAppointmentsForDay(date)

          return (
            <div
              key={index}
              className={`min-h-32 bg-card p-2 transition-colors hover:bg-accent/20 flex flex-col justify-between group select-none`}
              onDoubleClick={() => onCreateAppointmentOnDate(date.format('YYYY-MM-DD'))}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center justify-center size-6 rounded-full text-xs font-medium ${
                    isToday
                      ? 'bg-primary text-primary-foreground'
                      : isCurrentMonth
                      ? 'text-foreground'
                      : 'text-muted-foreground/50'
                  }`}
                >
                  {date.date()}
                </span>
                {dayAppointments.length > 0 && (
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {dayAppointments.length} {t('calendar.totalAppointments')}
                  </span>
                )}
              </div>

              {/* Day's appointments list */}
              <div className="flex-1 mt-2 overflow-y-auto space-y-1 max-h-24 custom-scrollbar">
                {dayAppointments.slice(0, 3).map((appt) => (
                  <button
                    key={appt.id}
                    onClick={() => onSelectAppointment(appt)}
                    type="button"
                    className="w-full text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <Badge
                      variant={getBadgeVariant(appt.status.value)}
                      size="sm"
                      className="w-full truncate justify-start cursor-pointer px-1 py-0"
                    >
                      <span className="font-semibold mr-1">{appt.appointment_time}</span>
                      <span className="truncate">{appt.customer?.full_name || t('calendar.noCustomer')}</span>
                    </Badge>
                  </button>
                ))}
                {dayAppointments.length > 3 && (
                  <div className="text-[10px] text-muted-foreground text-center font-medium">
                    + {dayAppointments.length - 3} {t('calendar.more')}
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
