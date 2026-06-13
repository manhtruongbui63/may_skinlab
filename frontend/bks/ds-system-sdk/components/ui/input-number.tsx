"use client"

import * as React from "react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "./input-group"
import type { InputProps } from "./input"
import { cn } from "../../lib/utils"

export type InputNumberValue = string | number
export type InputNumberOnValueChange = (
  value: string,
  numberValue: number | null
) => void

export type InputNumberProps = Omit<
  InputProps,
  | "type"
  | "inputMode"
  | "pattern"
  | "value"
  | "defaultValue"
  | "onChange"
> & {
  value?: InputNumberValue
  defaultValue?: InputNumberValue
  maxFractionDigits?: number
  startAddon?: React.ReactNode
  endAddon?: React.ReactNode
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  onValueChange?: InputNumberOnValueChange
  inputClassName?: string
}

function sanitizeDecimalInput(
  value: string,
  maxFractionDigits?: number,
  allowNegative = true
): string {
  const normalized = value.replace(/,/g, ".")
  const isNegative = allowNegative && normalized.trimStart().startsWith("-")
  const cleaned = normalized.replace(/[^0-9.]/g, "")
  const firstDotIndex = cleaned.indexOf(".")

  if (firstDotIndex === -1) {
    return `${isNegative ? "-" : ""}${cleaned}`
  }

  const integerPart = cleaned.slice(0, firstDotIndex)
  const fractionPart = cleaned
    .slice(firstDotIndex + 1)
    .replace(/\./g, "")

  if (maxFractionDigits === 0) {
    return `${isNegative ? "-" : ""}${integerPart}`
  }

  const boundedFractionPart =
    typeof maxFractionDigits === "number"
      ? fractionPart.slice(0, maxFractionDigits)
      : fractionPart

  return `${isNegative ? "-" : ""}${integerPart}.${boundedFractionPart}`
}

function parseConstraintNumber(value: InputProps["min"]) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value !== "string" || value.trim() === "") {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseNumberValue(value: string): number | null {
  if (value === "" || value === "." || value === "-" || value === "-.") {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function getFractionDigits(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  const normalized = value.toString().toLowerCase()

  if (normalized.includes("e-")) {
    const [, exponent] = normalized.split("e-")
    return Number(exponent) || 0
  }

  const [, fraction = ""] = normalized.split(".")
  return fraction.length
}

function formatNumberValue(
  value: number,
  step?: number,
  maxFractionDigits?: number
): string {
  if (!Number.isFinite(value)) {
    return ""
  }

  const precision =
    typeof maxFractionDigits === "number"
      ? maxFractionDigits
      : typeof step === "number" && step > 0
        ? getFractionDigits(step)
        : undefined
  const fixed = precision !== undefined ? value.toFixed(precision) : String(value)

  return fixed.replace(/(\.\d*?[1-9])0+$/g, "$1").replace(/\.0+$/g, "")
}

function snapToStep(value: number, step: number, min?: number): number {
  const base = min ?? 0
  const snapped = Math.round((value - base) / step) * step + base
  return Number(snapped.toFixed(Math.min(getFractionDigits(step) + 2, 12)))
}

function normalizeCommittedValue(
  value: string,
  {
    min,
    max,
    step,
    maxFractionDigits,
    allowNegative,
  }: {
    min?: number
    max?: number
    step?: number
    maxFractionDigits?: number
    allowNegative?: boolean
  }
): string {
  const sanitized = sanitizeDecimalInput(value, maxFractionDigits, allowNegative)
  const parsed = parseNumberValue(sanitized)

  if (parsed === null) {
    return ""
  }

  let next = parsed

  if (typeof min === "number") {
    next = Math.max(min, next)
  }

  if (typeof max === "number") {
    next = Math.min(max, next)
  }

  if (typeof step === "number" && step > 0) {
    next = snapToStep(next, step, min)
  }

  return formatNumberValue(next, step, maxFractionDigits)
}

function toInitialValue(
  value: InputNumberValue | undefined,
  maxFractionDigits?: number,
  allowNegative = true
): string {
  if (value === undefined) {
    return ""
  }

  return sanitizeDecimalInput(String(value), maxFractionDigits, allowNegative)
}

function normalizeFractionDigits(value: number | undefined): number | undefined {
  if (!Number.isFinite(value) || value === undefined || value < 0) {
    return undefined
  }

  return Math.floor(value)
}

function InputNumber({
  className,
  inputClassName,
  startAddon,
  endAddon,
  value,
  defaultValue,
  maxFractionDigits,
  min,
  max,
  step,
  size = "default",
  onBlur,
  onChange,
  onValueChange,
  ...props
}: InputNumberProps) {
  const isControlled = value !== undefined
  const normalizedMaxFractionDigits = React.useMemo(
    () => normalizeFractionDigits(maxFractionDigits),
    [maxFractionDigits]
  )
  const minValue = React.useMemo(() => parseConstraintNumber(min), [min])
  const maxValue = React.useMemo(() => parseConstraintNumber(max), [max])
  const stepValue = React.useMemo(() => parseConstraintNumber(step), [step])
  const allowNegative = minValue === undefined || minValue < 0
  const [internalValue, setInternalValue] = React.useState(() =>
    toInitialValue(defaultValue, normalizedMaxFractionDigits, allowNegative)
  )

  const displayValue = isControlled
    ? toInitialValue(value, normalizedMaxFractionDigits, allowNegative)
    : internalValue

  const commitInputNumberValue = React.useCallback(
    (nextValue: string) => {
      if (!isControlled) {
        setInternalValue(nextValue)
      }

      onValueChange?.(nextValue, parseNumberValue(nextValue))
    },
    [isControlled, onValueChange]
  )

  const sanitizeInputNumberChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = sanitizeDecimalInput(
        event.currentTarget.value,
        normalizedMaxFractionDigits,
        allowNegative
      )

      commitInputNumberValue(nextValue)
      onChange?.(event)
    },
    [
      allowNegative,
      commitInputNumberValue,
      normalizedMaxFractionDigits,
      onChange,
    ]
  )

  const commitInputNumberOnBlur = React.useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      const committedValue = normalizeCommittedValue(event.currentTarget.value, {
        min: minValue,
        max: maxValue,
        step: stepValue,
        maxFractionDigits: normalizedMaxFractionDigits,
        allowNegative,
      })

      if (event.currentTarget.value !== committedValue) {
        commitInputNumberValue(committedValue)
      }

      onBlur?.(event)
    },
    [
      commitInputNumberValue,
      allowNegative,
      maxValue,
      minValue,
      normalizedMaxFractionDigits,
      onBlur,
      stepValue,
    ]
  )

  return (
    <InputGroup size={size} className={cn(className)}>
      {startAddon ? <InputGroupAddon>{startAddon}</InputGroupAddon> : null}
      <InputGroupInput
        {...props}
        type="text"
        inputMode="decimal"
        pattern={
          normalizedMaxFractionDigits === 0
            ? allowNegative
              ? "-?[0-9]*"
              : "[0-9]*"
            : allowNegative
              ? "-?[0-9]*[.,]?[0-9]*"
              : "[0-9]*[.,]?[0-9]*"
        }
        min={min}
        max={max}
        step={step}
        value={displayValue}
        onChange={sanitizeInputNumberChange}
        onBlur={commitInputNumberOnBlur}
        className={cn("tabular-nums", inputClassName)}
      />
      {endAddon ? (
        <InputGroupAddon align="inline-end">{endAddon}</InputGroupAddon>
      ) : null}
    </InputGroup>
  )
}

export { InputNumber }
