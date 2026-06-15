/**
 * Clinic Room Select Component — Dropdown with search (single-select)
 * @module ClinicRoomSelect
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
import type { ClinicRoom } from '../types'

export interface ClinicRoomSelectProps {
  options: ClinicRoom[]
  value: number | null
  onChange: (value: number | null) => void
  error?: string
  disabled?: boolean
  required?: boolean
}

/**
 * Component chọn phòng khám — Dropdown searchable, single-select
 * UI giống ServiceMultiSelect nhưng chỉ chọn 1 giá trị
 */
export function ClinicRoomSelect({ options, value, onChange, error, disabled, required }: ClinicRoomSelectProps) {
  const t = useTranslations('reception')
  const [open, setOpen] = useState(false)

  const selectedRoom = options.find((r) => r.id === value) ?? null

  const handleSelect = (roomId: number) => {
    onChange(roomId === value ? null : roomId)
    setOpen(false)
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }

  return (
    <div className={cn("space-y-2", disabled && "opacity-50 pointer-events-none")}>
      <Label className="text-sm font-medium">
        {t('form.clinic_room_label')}
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
            {selectedRoom ? (
              <Badge variant="secondary" className="gap-1 pr-1">
                {selectedRoom.name}
                <button
                  type="button"
                  onClick={handleRemove}
                  className="ml-0.5 rounded-full hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : (
              <span className="text-muted-foreground text-sm font-normal">
                {t('labels.clinic_room')}
              </span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Tìm phòng khám..." />
            <CommandList>
              <CommandEmpty>Không tìm thấy phòng khám.</CommandEmpty>
              <CommandGroup>
                {options.map((room) => (
                  <CommandItem
                    key={room.id}
                    value={`${room.id}-${room.name}`}
                    onSelect={() => handleSelect(room.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === room.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="flex-1">{room.name}</span>
                    {room.code && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {room.code}
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
