/**
 * Package Multi Select Component — Dropdown with search
 * @module PackageMultiSelect
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
import type { ServicePackage } from '../types'

export interface PackageMultiSelectProps {
  options: ServicePackage[]
  value: number[]
  onChange: (value: number[]) => void
  disabled?: boolean
}

/**
 * Component chọn nhiều gói dịch vụ — Dropdown searchable với badge tags
 */
export function PackageMultiSelect({ options, value, onChange, disabled }: PackageMultiSelectProps) {
  const t = useTranslations('reception')
  const [open, setOpen] = useState(false)

  const selectedPackages = options.filter((p) => value.includes(p.id))

  const handleToggle = (packageId: number) => {
    if (value.includes(packageId)) {
      onChange(value.filter((id) => id !== packageId))
    } else {
      onChange([...value, packageId])
    }
  }

  const handleRemove = (packageId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter((id) => id !== packageId))
  }

  return (
    <div className={cn("space-y-2", disabled && "opacity-50 pointer-events-none")}>
      <Label className="text-sm font-medium">
        {t('form.package_label')}
      </Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          className="flex w-full items-center justify-between min-h-10 h-auto py-2 px-3 rounded-md border border-input bg-background text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="flex flex-wrap gap-1 flex-1 text-left">
              {selectedPackages.length === 0 ? (
                <span className="text-muted-foreground text-sm font-normal">
                  {t('labels.service_packages')}
                </span>
              ) : (
                selectedPackages.map((pkg) => (
                  <Badge
                    key={pkg.id}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {pkg.name}
                    <button
                      type="button"
                      onClick={(e) => handleRemove(pkg.id, e)}
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
            <CommandInput placeholder="Tìm gói dịch vụ..." />
            <CommandList>
              <CommandEmpty>Không tìm thấy gói dịch vụ.</CommandEmpty>
              <CommandGroup>
                {options.map((pkg) => (
                  <CommandItem
                    key={pkg.id}
                    value={`${pkg.id}-${pkg.name}`}
                    onSelect={() => handleToggle(pkg.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value.includes(pkg.id) ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="flex-1">{pkg.name}</span>
                    {pkg.price && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {Number(pkg.price).toLocaleString('vi-VN')}đ
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
