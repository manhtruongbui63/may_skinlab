import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const inputVariants = cva(
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-foreground shadow-none ring-0 transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-0 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-0",
  {
    variants: {
      size: {
        default: "h-8 text-sm",
        xs: "h-6 rounded-[min(var(--radius-md),10px)] text-xs",
        sm: "h-7 rounded-[min(var(--radius-md),12px)] text-[0.8rem]",
        lg: "h-9 text-base",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export type InputProps = Omit<React.ComponentProps<"input">, "size"> &
  VariantProps<typeof inputVariants>

function Input({ className, type, size = "default", ...props }: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      data-size={size}
      className={cn(inputVariants({ size }), className)}
      {...props}
    />
  )
}

export { Input, inputVariants }
