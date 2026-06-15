/**
 * Appointment Detail Drawer (S9)
 * @module AppointmentDetailDrawer
 */
'use client'

import { useTranslations } from 'next-intl'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/bks/ds-system-sdk/components/ui/drawer'
import { Badge } from '@/bks/ds-system-sdk/components/ui/badge'
import { Skeleton } from '@/bks/ds-system-sdk/components/ui/skeleton'
import { Separator } from '@/bks/ds-system-sdk/components/ui/separator'
import { X } from 'lucide-react'
import { cn } from '@/bks/ds-system-sdk/lib/utils'
import type { Appointment } from '../types'

export interface AppointmentDetailDrawerProps {
  isOpen: boolean
  appointmentId: number | null
  onClose: () => void
  appointment: Appointment | undefined
  isLoading: boolean
}

/**
 * Helper to get status badge style
 */
function getStatusBadgeVariant(statusValue: number): {
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  className?: string
} {
  switch (statusValue) {
    case 1: // BOOKED
      return { variant: 'secondary', className: 'bg-blue-100 text-blue-800' }
    case 2: // CHECKED_IN
      return { variant: 'default', className: 'bg-green-100 text-green-800' }
    case 3: // COMPLETED
      return { variant: 'secondary', className: 'bg-gray-100 text-gray-800' }
    case 4: // CANCELLED
      return { variant: 'destructive', className: 'bg-red-100 text-red-800' }
    case 7: // OVERDUE
      return { variant: 'outline', className: 'bg-orange-100 text-orange-800 border-orange-200' }
    default:
      return { variant: 'secondary' }
  }
}

/**
 * Drawer chi tiết lịch hẹn (S9)
 * Hiển thị: thông tin phiếu, thông tin KH, activity log
 */
export function AppointmentDetailDrawer({
  isOpen,
  onClose,
  appointment,
  isLoading,
}: AppointmentDetailDrawerProps) {
  const t = useTranslations('reception')

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-w-lg">
        <DrawerHeader className="flex items-center justify-between">
          <DrawerTitle>{t('tab3.drawer_title')}</DrawerTitle>
          <DrawerClose asChild>
            <button className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <X className="h-4 w-4" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="px-6 pb-6 space-y-6">
          {isLoading ? (
            // Skeleton loading state
            <>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-24 w-full" />
              </div>
            </>
          ) : appointment ? (
            <>
              {/* Section 1: Appointment Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Thông tin phiếu đăng ký
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Mã phiếu:</span>
                    <div className="font-medium">{appointment.code}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trạng thái:</span>
                    <div>
                      <Badge
                        variant={getStatusBadgeVariant(appointment.status.value).variant}
                        className={cn(getStatusBadgeVariant(appointment.status.value).className)}
                      >
                        {appointment.status.label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ngày khám:</span>
                    <div className="font-medium">{appointment.appointment_date}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phòng khám:</span>
                    <div className="font-medium">{appointment.clinic_room?.name || '—'}</div>
                  </div>
                </div>
                {appointment.services.length > 0 && (
                  <div>
                    <span className="text-muted-foreground text-sm">Dịch vụ:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {appointment.services.map((service) => (
                        <Badge key={service.id} variant="outline" className="text-xs">
                          {service.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Section 2: Customer Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Thông tin khách hàng
                </h3>
                {appointment.customer ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Mã KH:</span>
                      <div className="font-medium">{appointment.customer.code}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Họ tên:</span>
                      <div className="font-medium">{appointment.customer.full_name}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">SĐT:</span>
                      <div className="font-medium">{appointment.customer.phone}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Không có thông tin KH</div>
                )}
              </div>

              <Separator />

              {/* Section 3: Activity Log */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {t('tab3.activity_log_title')}
                </h3>
                {appointment.activity_log && appointment.activity_log.length > 0 ? (
                  <div className="space-y-2">
                    {appointment.activity_log.map((log) => (
                      <div
                        key={log.id}
                        className="text-sm p-2 bg-muted rounded-md"
                      >
                        <div className="font-medium">{log.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {log.causer?.name || 'Hệ thống'} • {new Date(log.created_at).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Không có lịch sử thao tác</div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Không tìm thấy thông tin
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
