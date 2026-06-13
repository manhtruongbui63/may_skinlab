import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { Spinner } from "./spinner"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "group/button typo-ui inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding whitespace-nowrap transition-all outline-none select-none active:not-aria-[haspopup]:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      tone: {
        default: "",
        success: "",
        warning: "",
        info: "",
        destructive: "",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    compoundVariants: [
      {
        variant: "default",
        tone: "success",
        class:
          "bg-success text-success-foreground hover:bg-success/80",
      },
      {
        variant: "default",
        tone: "warning",
        class:
          "bg-warning text-warning-foreground hover:bg-warning/80",
      },
      {
        variant: "default",
        tone: "info",
        class:
          "bg-info text-info-foreground hover:bg-info/80",
      },
      {
        variant: "default",
        tone: "destructive",
        class:
          "bg-destructive text-destructive-foreground hover:bg-destructive/80",
      },
      {
        variant: "outline",
        tone: "success",
        class:
          "border-success/50 text-success hover:bg-success/10 hover:text-success aria-expanded:bg-success/10 aria-expanded:text-success dark:border-success/40 dark:hover:bg-success/15 dark:aria-expanded:bg-success/15",
      },
      {
        variant: "outline",
        tone: "warning",
        class:
          "border-warning/50 text-warning hover:bg-warning/10 hover:text-warning aria-expanded:bg-warning/10 aria-expanded:text-warning dark:border-warning/40 dark:hover:bg-warning/15 dark:aria-expanded:bg-warning/15",
      },
      {
        variant: "outline",
        tone: "info",
        class:
          "border-info/50 text-info hover:bg-info/10 hover:text-info aria-expanded:bg-info/10 aria-expanded:text-info dark:border-info/40 dark:hover:bg-info/15 dark:aria-expanded:bg-info/15",
      },
      {
        variant: "outline",
        tone: "destructive",
        class:
          "border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive aria-expanded:bg-destructive/10 aria-expanded:text-destructive dark:border-destructive/45 dark:hover:bg-destructive/15 dark:aria-expanded:bg-destructive/15",
      },
      {
        variant: "secondary",
        tone: "success",
        class:
          "bg-success/12 text-success hover:bg-success/20 aria-expanded:bg-success/16 aria-expanded:text-success dark:bg-success/18 dark:hover:bg-success/28 dark:aria-expanded:bg-success/22",
      },
      {
        variant: "secondary",
        tone: "warning",
        class:
          "bg-warning/12 text-warning hover:bg-warning/20 aria-expanded:bg-warning/16 aria-expanded:text-warning dark:bg-warning/18 dark:hover:bg-warning/28 dark:aria-expanded:bg-warning/22",
      },
      {
        variant: "secondary",
        tone: "info",
        class:
          "bg-info/12 text-info hover:bg-info/20 aria-expanded:bg-info/16 aria-expanded:text-info dark:bg-info/18 dark:hover:bg-info/28 dark:aria-expanded:bg-info/22",
      },
      {
        variant: "secondary",
        tone: "destructive",
        class:
          "bg-destructive/12 text-destructive hover:bg-destructive/20 aria-expanded:bg-destructive/16 aria-expanded:text-destructive dark:bg-destructive/18 dark:hover:bg-destructive/28 dark:aria-expanded:bg-destructive/22",
      },
      {
        variant: "ghost",
        tone: "success",
        class:
          "text-success hover:bg-success/10 hover:text-success aria-expanded:bg-success/10 aria-expanded:text-success dark:hover:bg-success/15 dark:aria-expanded:bg-success/15",
      },
      {
        variant: "ghost",
        tone: "warning",
        class:
          "text-warning hover:bg-warning/10 hover:text-warning aria-expanded:bg-warning/10 aria-expanded:text-warning dark:hover:bg-warning/15 dark:aria-expanded:bg-warning/15",
      },
      {
        variant: "ghost",
        tone: "info",
        class:
          "text-info hover:bg-info/10 hover:text-info aria-expanded:bg-info/10 aria-expanded:text-info dark:hover:bg-info/15 dark:aria-expanded:bg-info/15",
      },
      {
        variant: "ghost",
        tone: "destructive",
        class:
          "text-destructive hover:bg-destructive/10 hover:text-destructive aria-expanded:bg-destructive/10 aria-expanded:text-destructive dark:hover:bg-destructive/15 dark:aria-expanded:bg-destructive/15",
      },
      {
        variant: "link",
        tone: "success",
        class: "text-success",
      },
      {
        variant: "link",
        tone: "warning",
        class: "text-warning",
      },
      {
        variant: "link",
        tone: "info",
        class: "text-info",
      },
      {
        variant: "link",
        tone: "destructive",
        class: "text-destructive",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      tone: "default",
    },
  }
)

function spinnerSizeClassForButton(
  size: VariantProps<typeof buttonVariants>["size"]
): string {
  switch (size) {
    case "xs":
    case "icon-xs":
      return "size-3"
    case "sm":
    case "icon-sm":
      return "size-3.5"
    case "lg":
    case "icon-lg":
      return "size-5"
    default:
      return "size-4"
  }
}

function loadingContentGapClass(
  size: VariantProps<typeof buttonVariants>["size"]
): string {
  return size === "xs" || size === "sm" ? "gap-1" : "gap-1.5"
}

export type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean
  }

function Button({
  className,
  variant = "default",
  size = "default",
  tone = "default",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled) || loading

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, tone }), className)}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span className="grid [grid-template-areas:'stack'] place-items-center">
          <span
            aria-hidden
            className={cn(
              "[grid-area:stack] invisible flex max-w-full items-center justify-center",
              loadingContentGapClass(size)
            )}
          >
            {children}
          </span>
          <span className="[grid-area:stack] flex items-center justify-center">
            <Spinner
              aria-hidden
              className={spinnerSizeClassForButton(size)}
            />
          </span>
        </span>
      ) : (
        children
      )}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
