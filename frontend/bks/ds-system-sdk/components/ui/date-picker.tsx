"use client"

import * as React from "react"
import dayjs from "dayjs"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { Button } from "./button"
import { Calendar } from "./calendar"
import { Input } from "./input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "./input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"
import { cn } from "../../lib/utils"

type DatePickerMode = "single" | "range"
type DatePickerTimePrecision = "hour" | "minute" | "second"
type DatePickerValue = Date | DateRange | undefined
type DatePickerFormat =
  | "YYYY-MM-DD"
  | "DD/MM/YYYY"
  | "MM/DD/YYYY"
  | "YYYY/MM/DD"
  | "DD-MM-YYYY"
  | "MM-DD-YYYY"
  | "YYYY-MM-DD HH"
  | "YYYY-MM-DD HH:mm"
  | "YYYY-MM-DD HH:mm:ss"
  | "DD/MM/YYYY HH"
  | "DD/MM/YYYY HH:mm"
  | "DD/MM/YYYY HH:mm:ss"
  | "MM/DD/YYYY HH"
  | "MM/DD/YYYY HH:mm"
  | "MM/DD/YYYY HH:mm:ss"
  | (string & {})
type DatePickerFormatFormValue =
  | DatePickerFormat
  | ((value: DatePickerValue) => string)
type DatePickerCalendarProps = Omit<
  React.ComponentProps<typeof Calendar>,
  "mode" | "selected" | "onSelect"
>

type DatePickerBaseProps = Omit<
  React.ComponentProps<typeof InputGroupInput>,
  "defaultValue" | "name" | "onChange" | "readOnly" | "size" | "type" | "value"
> & {
  calendarProps?: DatePickerCalendarProps
  defaultOpen?: boolean
  formatFormValue?: DatePickerFormatFormValue
  inputClassName?: string
  name?: string
  onOpenChange?: (open: boolean) => void
  open?: boolean
  popoverContentClassName?: string
  rangeSeparator?: string
  readOnly?: boolean
  showTime?: boolean
  size?: React.ComponentProps<typeof InputGroup>["size"]
  timePrecision?: DatePickerTimePrecision
}

type SingleDatePickerProps = DatePickerBaseProps & {
  defaultValue?: Date
  formatDate?: (value: Date | undefined) => string
  mode?: "single"
  onValueChange?: (value: Date | undefined) => void
  value?: Date
}

type RangeDatePickerProps = DatePickerBaseProps & {
  defaultValue?: DateRange
  formatDate?: (value: DateRange | undefined) => string
  mode: "range"
  onValueChange?: (value: DateRange | undefined) => void
  value?: DateRange
}

type DatePickerProps = SingleDatePickerProps | RangeDatePickerProps

function formatDateWithPattern(date: Date, pattern: DatePickerFormat) {
  return dayjs(date).format(pattern)
}

function withTimeFromDate(date: Date, timeSource: Date | undefined) {
  const nextDate = new Date(date)

  if (timeSource) {
    nextDate.setHours(
      timeSource.getHours(),
      timeSource.getMinutes(),
      timeSource.getSeconds(),
      0
    )
    return nextDate
  }

  nextDate.setHours(0, 0, 0, 0)
  return nextDate
}

function formatValueWithPattern(
  value: DatePickerValue,
  pattern: DatePickerFormat,
  rangeSeparator: string
) {
  if (!value) return ""

  if (isDateRange(value)) {
    const from = value.from ? formatDateWithPattern(value.from, pattern) : ""
    const to = value.to ? formatDateWithPattern(value.to, pattern) : ""

    if (from && to) return `${from}${rangeSeparator}${to}`
    if (from) return `${from}${rangeSeparator}...`
    return ""
  }

  return formatDateWithPattern(value, pattern)
}

function mergeRangeTime(
  nextRange: DateRange | undefined,
  currentRange: DateRange | undefined
) {
  if (!nextRange) return undefined

  return {
    from: nextRange.from
      ? withTimeFromDate(nextRange.from, currentRange?.from)
      : undefined,
    to: nextRange.to
      ? withTimeFromDate(nextRange.to, currentRange?.to)
      : undefined,
  }
}

function updateDateTimeValue(
  date: Date,
  hour: number,
  minute: number,
  second: number
) {
  const nextDate = new Date(date)

  nextDate.setHours(
    Math.min(23, Math.max(0, hour)),
    Math.min(59, Math.max(0, minute)),
    Math.min(59, Math.max(0, second)),
    0
  )
  return nextDate
}

function padTimePart(value: number) {
  return String(value).padStart(2, "0")
}

function maxTimeDigits(precision: DatePickerTimePrecision) {
  if (precision === "hour") return 2
  if (precision === "minute") return 4
  return 6
}

function formatTimeDigits(digits: string, precision: DatePickerTimePrecision) {
  const parts = digits.match(/.{1,2}/g) ?? []

  if (precision === "hour") return parts[0] ?? ""
  if (precision === "minute") return parts.slice(0, 2).join(":")
  return parts.slice(0, 3).join(":")
}

function formattedTimeValue(
  date: Date | undefined,
  precision: DatePickerTimePrecision
) {
  if (!date) return ""
  if (precision === "hour") return dayjs(date).format("HH")
  if (precision === "minute") return dayjs(date).format("HH:mm")
  return dayjs(date).format("HH:mm:ss")
}

function parseTimeDraft(
  draft: string,
  precision: DatePickerTimePrecision,
  fallbackDate: Date
) {
  const digits = draft.replace(/\D/g, "").slice(0, maxTimeDigits(precision))

  if (digits.length < maxTimeDigits(precision)) return null

  const hour = Math.min(23, Math.max(0, Number(digits.slice(0, 2))))
  const minute =
    precision === "hour"
      ? fallbackDate.getMinutes()
      : Math.min(59, Math.max(0, Number(digits.slice(2, 4))))
  const second =
    precision === "second"
      ? Math.min(59, Math.max(0, Number(digits.slice(4, 6))))
      : fallbackDate.getSeconds()

  return { hour, minute, second }
}

function normalizeTimeDraft(
  draft: string,
  precision: DatePickerTimePrecision,
  fallbackDate: Date
) {
  const parsed = parseTimeDraft(draft, precision, fallbackDate)

  if (!parsed) return formattedTimeValue(fallbackDate, precision)

  if (precision === "hour") return padTimePart(parsed.hour)
  if (precision === "minute") {
    return `${padTimePart(parsed.hour)}:${padTimePart(parsed.minute)}`
  }
  return `${padTimePart(parsed.hour)}:${padTimePart(parsed.minute)}:${padTimePart(parsed.second)}`
}

function TimeInput({
  date,
  disabled,
  label,
  onDateTimeChange,
  precision,
}: {
  date: Date | undefined
  disabled?: boolean
  label: string
  onDateTimeChange: (date: Date) => void
  precision: DatePickerTimePrecision
}) {
  const formattedValue = formattedTimeValue(date, precision)
  const [draft, setDraft] = React.useState(formattedValue)

  return (
    <Input
      aria-label={`${label} time`}
      className={cn(
        "text-center tabular-nums px-1!",
        precision === "second"
          ? "w-20"
          : precision === "minute"
            ? "w-16"
            : "w-14"
      )}
      disabled={disabled || !date}
      inputMode="numeric"
      onBlur={() => {
        if (!date) return
        setDraft(normalizeTimeDraft(draft, precision, date))
      }}
      onChange={(event) => {
        if (!date) return

        const digits = event.target.value
          .replace(/\D/g, "")
          .slice(0, maxTimeDigits(precision))
        const nextDraft = formatTimeDigits(digits, precision)

        setDraft(nextDraft)

        const parsed = parseTimeDraft(nextDraft, precision, date)
        if (!parsed) return

        onDateTimeChange(
          updateDateTimeValue(date, parsed.hour, parsed.minute, parsed.second)
        )
      }}
      onFocus={(event) => event.currentTarget.select()}
      placeholder={
        precision === "second"
          ? "HH:mm:ss"
          : precision === "minute"
            ? "HH:mm"
            : "HH"
      }
      size="sm"
      value={draft}
    />
  )
}

function TimeFieldGroup({
  date,
  disabled,
  label,
  onDateTimeChange,
  precision,
}: {
  date: Date | undefined
  disabled?: boolean
  label: string
  onDateTimeChange: (date: Date) => void
  precision: DatePickerTimePrecision
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex flex-col">
          <span className="typo-caption text-muted-foreground uppercase">
            {label}
          </span>
          <span className="text-primary text-3xl leading-none font-light tabular-nums">
            {date ? dayjs(date).format("D") : "--"}
          </span>
        </div>
        <div className="min-w-0">
          <div className="typo-label-md truncate">
            {date ? dayjs(date).format("MMMM") : "Month"}
          </div>
          {/*<div className="typo-caption truncate text-muted-foreground">*/}
          {/*  {date ? dayjs(date).format("MMMM") : "Month"}*/}
          {/*</div>*/}
          <div className="typo-caption truncate text-muted-foreground">
            {date ? dayjs(date).format("dddd") : 'Day'}
          </div>
        </div>
      </div>
      <div className="flex items-center">
        {/*<ClockIcon className="size-4 text-primary" aria-hidden="true" />*/}
        <TimeInput
          key={formattedTimeValue(date, precision)}
          date={date}
          disabled={disabled}
          label={label}
          onDateTimeChange={onDateTimeChange}
          precision={precision}
        />
      </div>
    </div>
  )
}

function TimePickerPanel({
  disabled,
  mode,
  onDone,
  onValueChange,
  precision,
  selectedValue,
}: {
  disabled?: boolean
  mode: DatePickerMode
  onDone: () => void
  onValueChange: (value: DatePickerValue) => void
  precision: DatePickerTimePrecision
  selectedValue: DatePickerValue
}) {
  const rangeValue = isDateRange(selectedValue) ? selectedValue : undefined

  function updateRangeTime(edge: "from" | "to", nextDate: Date) {
    onValueChange({
      from: rangeValue?.from,
      to: rangeValue?.to,
      [edge]: nextDate,
    })
  }

  return (
    <div className="flex flex-col gap-2 border-t bg-background p-3">
      {mode === "range" ? (
        <>
          <TimeFieldGroup
            date={rangeValue?.from}
            disabled={disabled}
            label="From"
            onDateTimeChange={(nextDate) => updateRangeTime("from", nextDate)}
            precision={precision}
          />
          <TimeFieldGroup
            date={rangeValue?.to}
            disabled={disabled}
            label="To"
            onDateTimeChange={(nextDate) => updateRangeTime("to", nextDate)}
            precision={precision}
          />
        </>
      ) : (
        <TimeFieldGroup
          date={selectedValue instanceof Date ? selectedValue : undefined}
          disabled={disabled}
          label="Date"
          onDateTimeChange={onValueChange}
          precision={precision}
        />
      )}
      <div className="flex justify-end">
        <Button
          disabled={disabled}
          onClick={onDone}
          size="xs"
          type="button"
          variant="secondary"
        >
          Đóng
        </Button>
      </div>
    </div>
  )
}

function isDateRange(value: DatePickerValue): value is DateRange {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !("getTime" in value)
  )
}

function formatDisplayValue(value: DatePickerValue): string {
  if (!value) return ""

  if (isDateRange(value)) {
    const from = value.from ? formatDisplayValue(value.from) : ""
    const to = value.to ? formatDisplayValue(value.to) : ""

    if (from && to) return `${from} - ${to}`
    if (from) return `${from} - ...`
    return ""
  }

  return dayjs(value).format("DD MMM YYYY")
}

function displayFormatForTimePrecision(
  precision: DatePickerTimePrecision
): DatePickerFormat {
  if (precision === "hour") return "DD/MM/YYYY HH"
  if (precision === "second") return "DD/MM/YYYY HH:mm:ss"
  return "DD/MM/YYYY HH:mm"
}

function calendarSizeForDatePicker(
  size: React.ComponentProps<typeof InputGroup>["size"]
): React.ComponentProps<typeof Calendar>["size"] {
  return size === "xs" ? "sm" : size
}

function DatePicker(props: DatePickerProps) {
  const {
    calendarProps,
    className,
    defaultOpen,
    defaultValue,
    disabled,
    formatDate,
    formatFormValue = "YYYY-MM-DD",
    id,
    inputClassName,
    mode = "single",
    name,
    onOpenChange,
    onValueChange,
    open,
    placeholder = mode === "range" ? "Select date range" : "Select date",
    popoverContentClassName,
    rangeSeparator = " - ",
    readOnly,
    required,
    showTime = false,
    size = "default",
    timePrecision = "minute",
    value,
    ...inputProps
  } = props

  const [uncontrolledValue, setUncontrolledValue] =
    React.useState<DatePickerValue>(defaultValue)
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(
    () => defaultOpen ?? false
  )
  const isValueControlled = "value" in props
  const isOpenControlled = open !== undefined
  const selectedValue = isValueControlled ? value : uncontrolledValue
  const popoverOpen = isOpenControlled ? open : uncontrolledOpen
  const { className: calendarClassName, ...calendarRestProps } =
    calendarProps ?? {}
  const calendarSize =
    calendarProps?.size ?? calendarSizeForDatePicker(size)

  const displayValue = formatDate
    ? (formatDate as (value: DatePickerValue) => string)(selectedValue)
    : showTime
      ? formatValueWithPattern(
          selectedValue,
          displayFormatForTimePrecision(timePrecision),
          rangeSeparator
        )
    : formatDisplayValue(selectedValue)
  const formValue =
    typeof formatFormValue === "function"
      ? formatFormValue(selectedValue)
      : formatValueWithPattern(selectedValue, formatFormValue, rangeSeparator)

  function handleValueChange(nextValue: DatePickerValue) {
    if (!isValueControlled) {
      setUncontrolledValue(nextValue)
    }

    if (mode === "range") {
      ;(onValueChange as RangeDatePickerProps["onValueChange"])?.(
        isDateRange(nextValue) ? nextValue : undefined
      )
      return
    }

    ;(onValueChange as SingleDatePickerProps["onValueChange"])?.(
      nextValue instanceof Date ? nextValue : undefined
    )
  }

  function setPopoverOpen(nextOpen: boolean) {
    const nextPopoverOpen = readOnly && nextOpen ? false : nextOpen

    if (!isOpenControlled) {
      setUncontrolledOpen(nextPopoverOpen)
    }

    onOpenChange?.(nextPopoverOpen)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (readOnly && nextOpen) {
      setPopoverOpen(false)
      return
    }

    setPopoverOpen(nextOpen)
  }

  return (
    <Popover
      open={popoverOpen}
      onOpenChange={handleOpenChange}
    >
      {name ? <input type="hidden" name={name} value={formValue} /> : null}
      <PopoverTrigger
        disabled={disabled || readOnly}
        nativeButton={false}
        render={<InputGroup className={className} size={size} />}
      >
        <InputGroupInput
          {...inputProps}
          id={id}
          aria-readonly
          className={cn(
            "cursor-default caret-transparent",
            inputClassName
          )}
          disabled={disabled}
          placeholder={placeholder}
          readOnly
          required={required}
          value={displayValue}
        />
        <InputGroupAddon align="inline-end" aria-hidden="true">
          <CalendarIcon className="size-4" />
        </InputGroupAddon>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn("w-auto overflow-hidden p-0", popoverContentClassName)}
      >
        {mode === "range" ? (
          <Calendar
            {...calendarRestProps}
            className={cn("mx-auto", calendarClassName)}
            mode="range"
            selected={isDateRange(selectedValue) ? selectedValue : undefined}
            size={calendarSize}
            onSelect={(nextRange) => {
              const nextValue = mergeRangeTime(
                nextRange,
                isDateRange(selectedValue) ? selectedValue : undefined
              )

              handleValueChange(nextValue)
              if (!showTime && nextValue?.from && nextValue.to) {
                handleOpenChange(false)
              }
            }}
          />
        ) : (
          <Calendar
            {...calendarRestProps}
            className={cn("mx-auto", calendarClassName)}
            mode="single"
            selected={selectedValue instanceof Date ? selectedValue : undefined}
            size={calendarSize}
            onSelect={(nextDate) => {
              handleValueChange(
                nextDate
                  ? withTimeFromDate(
                      nextDate,
                      selectedValue instanceof Date ? selectedValue : undefined
                    )
                  : undefined
              )
              if (!showTime) {
                handleOpenChange(false)
              }
            }}
          />
        )}
        {showTime ? (
          <TimePickerPanel
            disabled={disabled || readOnly}
            mode={mode}
            onDone={() => setPopoverOpen(false)}
            onValueChange={handleValueChange}
            precision={timePrecision}
            selectedValue={selectedValue}
          />
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

export {
  DatePicker,
  type DatePickerFormat,
  type DatePickerMode,
  type DatePickerProps,
  type DatePickerTimePrecision,
  type DatePickerValue,
}
