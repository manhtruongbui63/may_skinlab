/**
 * Service Multi Select Component — Dropdown with search
 * @module ServiceMultiSelect
 */
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { Badge } from '@/bks/ds-system-sdk/components/ui/badge'
import { Label } from '@/bks/ds-system-sdk/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/bks/ds-system-sdk/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/bks/ds-system-sdk/components/ui/command'
import { cn } from '@/bks/ds-system-sdk/lib/utils'
import type { Service } from '../types'

export interface ServiceMultiSelectProps {
  options: Service[]
  value: number[]
  onChange: (value: number[]) => void
  error?: string
  disabled?: boolean
  required?: boolean
}

/**
 * Component chọn nhiều dịch vụ — Dropdown searchable với badge tags
 */
export function ServiceMultiSelect({ options, value, onChange, error, disabled, required }: ServiceMultiSelectProps) {
  const t = useTranslations('reception')
  const [open, setOpen] = useState(false)

  const selectedServices = options.filter((s) => value.includes(s.id))

  const handleToggle = (serviceId: number) => {
    if (value.includes(serviceId)) {
      onChange(value.filter((id) => id !== serviceId))
    } else {
      onChange([...value, serviceId])
    }
  }

  const handleRemove = (serviceId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter((id) => id !== serviceId))
  }

  return (
    <div className={cn("space-y-2", disabled && "opacity-50 pointer-events-none")}>
      <Label className="text-sm font-medium">
        {t('form.service_label')}
        {required && <span className="text-destructive"> *</span>}
      </Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          className={cn(
            'flex w-full items-center justify-between min-h-10 h-auto py-2 px-3',
            'rounded-md border border-input bg-background text-sm ring-offset-background',
            'hover:bg-accent hover:text-accent-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive',
          )}
        >
            <div className="flex flex-wrap gap-1 flex-1 text-left">
              {selectedServices.length === 0 ? (
                <span className="text-muted-foreground text-sm font-normal">
                  {t('labels.services')}
                </span>
              ) : (
                selectedServices.map((service) => (
                  <Badge
                    key={service.id}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {service.name}
                    <button
                      type="button"
                      onClick={(e) => handleRemove(service.id, e)}
                      className="ml-0.5 rounded-full hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Tìm dịch vụ..." />
            <CommandList>
              <CommandEmpty>Không tìm thấy dịch vụ.</CommandEmpty>
              <CommandGroup>
                {options.map((service) => (
                  <CommandItem
                    key={service.id}
                    value={`${service.id}-${service.name}`}
                    onSelect={() => handleToggle(service.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value.includes(service.id) ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="flex-1">{service.name}</span>
                    {service.price && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {Number(service.price).toLocaleString('vi-VN')}đ
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
