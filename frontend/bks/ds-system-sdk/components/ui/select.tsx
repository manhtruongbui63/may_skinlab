"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { CheckIcon, ChevronDownIcon } from "lucide-react"

import { cn } from "../../lib/utils"

type SelectValueType = string | string[] | undefined

type SelectContextValue = {
  value: SelectValueType
  open: boolean
  multiple: boolean
  disabled: boolean
  triggerId: string
  contentId: string
  triggerRef: React.RefObject<HTMLButtonElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
  labels: Map<string, React.ReactNode>
  setOpen: (open: boolean) => void
  toggleValue: (value: string) => void
  registerLabel: (value: string, label: React.ReactNode) => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

function useSelectContext(component: string) {
  const context = React.useContext(SelectContext)

  if (!context) {
    throw new Error(`${component} must be used within Select`)
  }

  return context
}

function isSelected(value: SelectValueType, itemValue: string) {
  return Array.isArray(value)
    ? value.includes(itemValue)
    : value === itemValue
}

function textFromNode(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textFromNode).join("")
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return textFromNode(node.props.children)
  }

  return ""
}

function collectSelectLabels(
  node: React.ReactNode,
  labels = new Map<string, React.ReactNode>()
) {
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement<{ children?: React.ReactNode; value?: unknown }>(
      child
    )) {
      return
    }

    if (child.type === SelectItem && typeof child.props.value === "string") {
      const label = textFromNode(child.props.children) || child.props.value

      labels.set(child.props.value, label)
    }

    collectSelectLabels(child.props.children, labels)
  })

  return labels
}

type SelectProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
  value?: string | string[]
  defaultValue?: string | string[]
  multiple?: boolean
  disabled?: boolean
  onValueChange?: (value: string | string[] | undefined) => void
}

function Select({
  className,
  value,
  defaultValue,
  multiple = false,
  disabled = false,
  onValueChange,
  children,
  ...props
}: SelectProps) {
  const generatedId = React.useId()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const isControlled = value !== undefined
  const collectedLabels = React.useMemo(
    () => collectSelectLabels(children),
    [children]
  )
  const [open, setOpen] = React.useState(false)
  const [registeredLabels, setRegisteredLabels] = React.useState<
    Map<string, React.ReactNode>
  >(() => new Map())
  const labels = React.useMemo(() => {
    const nextLabels = new Map(collectedLabels)

    for (const [key, label] of registeredLabels) {
      nextLabels.set(key, label)
    }

    return nextLabels
  }, [collectedLabels, registeredLabels])
  const [internalValue, setInternalValue] = React.useState<SelectValueType>(
    defaultValue ?? (multiple ? [] : undefined)
  )
  const selectedValue = isControlled ? value : internalValue
  const triggerId = `${generatedId}-trigger`
  const contentId = `${generatedId}-content`

  React.useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node

      if (
        !rootRef.current?.contains(target) &&
        !contentRef.current?.contains(target)
      ) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  const commitValue = React.useCallback(
    (nextValue: SelectValueType) => {
      if (!isControlled) setInternalValue(nextValue)
      onValueChange?.(nextValue)
    },
    [isControlled, onValueChange]
  )

  const toggleValue = React.useCallback(
    (itemValue: string) => {
      if (disabled) return

      if (multiple) {
        const currentValue = Array.isArray(selectedValue) ? selectedValue : []
        const nextValue = currentValue.includes(itemValue)
          ? currentValue.filter((valueItem) => valueItem !== itemValue)
          : [...currentValue, itemValue]

        commitValue(nextValue)
        return
      }

      commitValue(itemValue)
      setOpen(false)
    },
    [commitValue, disabled, multiple, selectedValue]
  )

  const registerLabel = React.useCallback(
    (itemValue: string, label: React.ReactNode) => {
      setRegisteredLabels((currentLabels) => {
        const currentLabel = currentLabels.get(itemValue)

        if (currentLabel === label) return currentLabels

        const nextLabels = new Map(currentLabels)
        nextLabels.set(itemValue, label)
        return nextLabels
      })
    },
    []
  )

  const contextValue = React.useMemo<SelectContextValue>(
    () => ({
      value: selectedValue,
      open,
      multiple,
      disabled,
      triggerId,
      contentId,
      triggerRef,
      contentRef,
      labels,
      setOpen,
      toggleValue,
      registerLabel,
    }),
    [
      contentId,
      disabled,
      labels,
      multiple,
      open,
      registerLabel,
      selectedValue,
      toggleValue,
      triggerId,
    ]
  )

  return (
    <SelectContext.Provider value={contextValue}>
      <PopoverPrimitive.Root
        open={open}
        onOpenChange={(nextOpen) => setOpen(nextOpen)}
        triggerId={triggerId}
      >
        <div
          ref={rootRef}
          data-slot="select"
          data-open={open || undefined}
          data-disabled={disabled || undefined}
          data-multiple={multiple || undefined}
          className={cn("relative inline-flex min-w-0 flex-col", className)}
          {...props}
        >
          {children}
        </div>
      </PopoverPrimitive.Root>
    </SelectContext.Provider>
  )
}

type SelectGroupProps = React.ComponentProps<"div">

function SelectGroup({ className, ...props }: SelectGroupProps) {
  return (
    <div
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      role="group"
      {...props}
    />
  )
}

type SelectValueProps = Omit<React.ComponentProps<"span">, "children"> & {
  placeholder?: React.ReactNode
  children?: React.ReactNode
}

function SelectValue({
  className,
  placeholder,
  children,
  ...props
}: SelectValueProps) {
  const { value, labels } = useSelectContext("SelectValue")
  const selectedItems = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? [value]
      : []
  const selectedLabels = selectedItems
    .map((itemValue) => labels.get(itemValue) ?? itemValue)
    .filter(Boolean)
  const hasValue = selectedLabels.length > 0

  return (
    <span
      data-slot="select-value"
      data-placeholder={!hasValue || undefined}
      className={cn("flex min-w-0 flex-1 text-left", className)}
      {...props}
    >
      {children ?? (hasValue ? selectedLabels.join(", ") : placeholder)}
    </span>
  )
}

type SelectTriggerProps = React.ComponentProps<"button"> & {
  size?: "sm" | "default"
}

function SelectTrigger({
  className,
  size = "default",
  children,
  disabled,
  ...props
}: SelectTriggerProps) {
  const {
    open,
    disabled: rootDisabled,
    triggerId,
    contentId,
    triggerRef,
    setOpen,
  } = useSelectContext("SelectTrigger")
  const isDisabled = rootDisabled || Boolean(disabled)

  return (
    <button
      ref={triggerRef}
      type="button"
      id={triggerId}
      data-slot="select-trigger"
      data-size={size}
      aria-expanded={open}
      aria-controls={contentId}
      disabled={isDisabled}
      className={cn(
        "flex w-fit min-w-0 items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent bg-clip-padding px-2.5 py-1 text-sm text-foreground shadow-none ring-0 whitespace-nowrap transition-colors outline-none select-none hover:border-ring/40 hover:bg-ring/5 focus-visible:border-ring focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-0 data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 *:data-[placeholder=true]:text-muted-foreground dark:bg-input/30 dark:hover:border-ring/50 dark:hover:bg-ring/10 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-0 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      onClick={(event) => {
        props.onClick?.(event)
        if (!event.defaultPrevented) setOpen(!open)
      }}
      {...props}
    >
      {children}
      <ChevronDownIcon
        aria-hidden="true"
        className={cn(
          "pointer-events-none size-4 text-muted-foreground transition-transform",
          open && "rotate-180"
        )}
      />
    </button>
  )
}

type SelectContentProps = PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "side" | "sideOffset" | "align" | "alignOffset"
  > & {
  alignItemWithTrigger?: boolean
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "start",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectContentProps) {
  const { open, contentId, triggerId, triggerRef, contentRef } =
    useSelectContext("SelectContent")

  if (!open) return null

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={triggerRef}
        className="isolate z-50"
      >
        <PopoverPrimitive.Popup
          ref={contentRef}
          id={contentId}
          data-slot="select-content"
          data-align={align}
          role="listbox"
          aria-labelledby={triggerId}
          className={cn(
            "custom-scrollbar group/select-content relative z-50 max-h-(--available-height) origin-(--transform-origin) overflow-x-hidden overflow-y-auto overscroll-contain rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-none ring-0 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            alignItemWithTrigger &&
              "w-max min-w-(--anchor-width) max-w-(--available-width)",
            className
          )}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

type SelectLabelProps = React.ComponentProps<"div">

function SelectLabel({ className, ...props }: SelectLabelProps) {
  return (
    <div
      data-slot="select-label"
      className={cn("px-1.5 py-1 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

type SelectItemProps = Omit<React.ComponentProps<"button">, "value"> & {
  value: string
}

function SelectItem({
  className,
  children,
  value,
  disabled,
  ...props
}: SelectItemProps) {
  const {
    value: selectedValue,
    disabled: rootDisabled,
    toggleValue,
    registerLabel,
  } = useSelectContext("SelectItem")
  const label = React.useMemo(() => textFromNode(children) || value, [children, value])
  const selected = isSelected(selectedValue, value)
  const isDisabled = rootDisabled || Boolean(disabled)

  React.useEffect(() => {
    registerLabel(value, label)
  }, [label, registerLabel, value])

  return (
    <button
      type="button"
      data-slot="select-item"
      data-selected={selected || undefined}
      role="option"
      aria-selected={selected}
      disabled={isDisabled}
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none hover:bg-ring/14 focus:bg-ring/14 dark:hover:bg-ring/20 dark:focus:bg-ring/20 data-[selected=true]:text-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      onClick={(event) => {
        props.onClick?.(event)
        if (!event.defaultPrevented) toggleValue(value)
      }}
      {...props}
    >
      <span className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
        {children}
      </span>
      <span
        className={cn(
          "pointer-events-none absolute right-2 flex size-4 items-center justify-center opacity-0",
          selected && "opacity-100"
        )}
      >
        <CheckIcon aria-hidden="true" className="pointer-events-none size-4 shrink-0 text-current" />
      </span>
      <span className="sr-only">{selected ? "Selected" : "Not selected"}</span>
    </button>
  )
}

type SelectSeparatorProps = React.ComponentProps<"div">

function SelectSeparator({ className, ...props }: SelectSeparatorProps) {
  return (
    <div
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      role="separator"
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-scroll-up-button"
      className={cn("hidden", className)}
      {...props}
    />
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-scroll-down-button"
      className={cn("hidden", className)}
      {...props}
    />
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
