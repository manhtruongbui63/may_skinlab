"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Input } from "./input"
import { Textarea } from "./textarea"

const inputGroupVariants = cva(
  "group/input-group relative flex w-full min-w-0 items-center border border-input text-foreground shadow-none ring-0 transition-colors outline-none in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:ring-0 has-disabled:bg-input/50 has-disabled:opacity-50 has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot][aria-invalid=true]]:border-destructive has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>textarea]:h-auto dark:bg-input/30 dark:has-disabled:bg-input/80 has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-end]]:[&>input]:pr-1.5 has-[>[data-align=inline-start]]:[&>input]:pl-1.5",
  {
    variants: {
      size: {
        default: "h-8 rounded-lg [&>[data-slot=input-group-control]]:h-8 [&>[data-slot=input-group-control]]:text-sm",
        xs: "h-6 rounded-[min(var(--radius-md),10px)] [&>[data-slot=input-group-control]]:h-6 [&>[data-slot=input-group-control]]:text-xs",
        sm: "h-7 rounded-[min(var(--radius-md),12px)] [&>[data-slot=input-group-control]]:h-7 [&>[data-slot=input-group-control]]:text-[0.8rem]",
        lg: "h-9 rounded-lg [&>[data-slot=input-group-control]]:h-9 [&>[data-slot=input-group-control]]:text-base",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

function InputGroup({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupVariants>) {
  return (
    <div
      data-slot="input-group"
      data-size={size}
      role="group"
      className={cn(inputGroupVariants({ size }), className)}
      {...props}
    />
  )
}

const inputGroupAddonVariants = cva(
  "flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium text-muted-foreground select-none group-data-[size=xs]/input-group:text-xs group-data-[size=sm]/input-group:text-[0.8rem] group-data-[size=lg]/input-group:text-base group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        "inline-start":
          "order-first pl-2 has-[>button]:ml-[-0.3rem] has-[>kbd]:ml-[-0.15rem]",
        "inline-end":
          "order-last pr-2 has-[>button]:mr-[-0.3rem] has-[>kbd]:mr-[-0.15rem]",
        "block-start":
          "order-first w-full justify-start px-2.5 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2",
        "block-end":
          "order-last w-full justify-start px-2.5 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  }
)

function InputGroupAddon({
  className,
  align = "inline-start",
  onMouseDown,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      {...props}
      onMouseDown={(e) => {
        onMouseDown?.(e)
        if (e.defaultPrevented) {
          return
        }
        if ((e.target as HTMLElement).closest("button")) {
          return
        }
        const control = e.currentTarget.parentElement?.querySelector(
          "input, textarea"
        ) as HTMLInputElement | HTMLTextAreaElement | null
        control?.focus()
      }}
    />
  )
}

const inputGroupButtonVariants = cva(
  "shadow-none",
  {
    variants: {
      size: {
        xs: "rounded-[calc(var(--radius)-3px)]",
        sm: "",
        "icon-xs": "rounded-[calc(var(--radius)-3px)]",
        "icon-sm": "",
      },
    },
    defaultVariants: {
      size: "xs",
    },
  }
)

function buttonSizeForInputGroup(
  size: VariantProps<typeof inputGroupButtonVariants>["size"]
): React.ComponentProps<typeof Button>["size"] {
  switch (size) {
    case "sm":
      return "sm"
    case "icon-xs":
      return "icon-xs"
    case "icon-sm":
      return "icon-sm"
    default:
      return "xs"
  }
}

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size" | "type"> &
  VariantProps<typeof inputGroupButtonVariants> & {
    type?: "button" | "submit" | "reset"
  }) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      size={buttonSizeForInputGroup(size)}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  )
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function InputGroupInput({
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "size">) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        "flex-1 rounded-none border-0 bg-transparent text-foreground shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

function InputGroupTextarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent py-2 text-foreground shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
  inputGroupVariants,
}
