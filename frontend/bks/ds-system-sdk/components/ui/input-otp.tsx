"use client"

import * as React from "react"
import {
  OTPInput,
  OTPInputContext,
  type OTPInputProps,
  type RenderProps,
} from "input-otp"
import { cva, type VariantProps } from "class-variance-authority"
import { MinusIcon } from "lucide-react"

import type { InputProps } from "./input"
import { cn } from "../../lib/utils"

const inputOtpSlotVariants = cva(
  "relative flex items-center justify-center border-y border-r border-input bg-transparent text-foreground tabular-nums shadow-none transition-colors outline-none first:rounded-l-lg first:border-l last:rounded-r-lg data-[active=true]:z-10 data-[active=true]:border-ring group-aria-invalid/input-otp-group:border-destructive dark:bg-input/30 group-has-disabled/input-otp:cursor-not-allowed group-has-disabled/input-otp:bg-input/50 group-has-disabled/input-otp:opacity-50 dark:group-has-disabled/input-otp:bg-input/80",
  {
    variants: {
      size: {
        default: "size-8 text-sm",
        xs: "size-6 rounded-[min(var(--radius-md),10px)] text-xs",
        sm: "size-7 rounded-[min(var(--radius-md),12px)] text-[0.8rem]",
        lg: "size-9 text-base",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

type InputOTPSize = VariantProps<typeof inputOtpSlotVariants>["size"]

const InputOTPSizeContext = React.createContext<InputOTPSize>("default")

export type InputOTPProps = Omit<
  OTPInputProps,
  "inputMode" | "size" | "type"
> &
  VariantProps<typeof inputOtpSlotVariants> & {
    containerClassName?: string
    inputMode?: InputProps["inputMode"]
    type?: "tel" | "text"
  }

function InputOTP({
  className,
  containerClassName,
  inputMode = "numeric",
  size = "default",
  type = "text",
  ...props
}: InputOTPProps) {
  const otpInputProps = props as OTPInputProps
  let resolvedOtpInputProps = otpInputProps

  if ("render" in otpInputProps && typeof otpInputProps.render === "function") {
    const render = otpInputProps.render
    const renderProps = { ...otpInputProps }
    delete (renderProps as { children?: React.ReactNode }).children

    resolvedOtpInputProps = {
      ...renderProps,
      render: (context: RenderProps) => (
        <OTPInputContext.Provider value={context}>
          {render(context)}
        </OTPInputContext.Provider>
      ),
    } as OTPInputProps
  }

  return (
    <InputOTPSizeContext.Provider value={size}>
      <OTPInput
        data-slot="input-otp"
        data-size={size}
        inputMode={inputMode}
        type={type}
        containerClassName={cn(
          "group/input-otp flex max-w-full items-center gap-2 has-disabled:opacity-50",
          containerClassName
        )}
        className={cn("disabled:cursor-not-allowed", className)}
        {...resolvedOtpInputProps}
      />
    </InputOTPSizeContext.Provider>
  )
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn("group/input-otp-group flex items-center", className)}
      {...props}
    />
  )
}

export type InputOTPSlotProps = React.ComponentProps<"div"> &
  VariantProps<typeof inputOtpSlotVariants> & {
    index: number
  }

function InputOTPSlot({ index, size, className, ...props }: InputOTPSlotProps) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const rootSize = React.useContext(InputOTPSizeContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        inputOtpSlotVariants({ size: size ?? rootSize }),
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
        </div>
      )}
    </div>
  )
}

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-separator"
      role="separator"
      className="flex w-10 items-center justify-center text-muted-foreground"
      {...props}
    >
      <MinusIcon className="size-4" aria-hidden="true" />
    </div>
  )
}

export {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
  inputOtpSlotVariants,
}
