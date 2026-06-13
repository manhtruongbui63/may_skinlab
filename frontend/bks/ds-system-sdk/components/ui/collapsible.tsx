import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "../../lib/utils"

function Collapsible({
  className,
  ...props
}: CollapsiblePrimitive.Root.Props) {
  return (
    <CollapsiblePrimitive.Root
      data-slot="collapsible"
      className={cn("group/collapsible", className)}
      {...props}
    />
  )
}

function CollapsibleTrigger({ ...props }: CollapsiblePrimitive.Trigger.Props) {
  return (
    <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />
  )
}

function CollapsibleContent({ ...props }: CollapsiblePrimitive.Panel.Props) {
  return (
    <CollapsiblePrimitive.Panel data-slot="collapsible-content" {...props} />
  )
}

function CollapsibleItem({
  className,
  ...props
}: CollapsiblePrimitive.Root.Props) {
  return (
    <Collapsible
      data-slot="collapsible-item"
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-background text-foreground shadow-none",
        className
      )}
      {...props}
    />
  )
}

function CollapsibleHeader({
  className,
  children,
  showIcon = true,
  ...props
}: CollapsiblePrimitive.Trigger.Props & {
  showIcon?: boolean
}) {
  return (
    <CollapsibleTrigger
      data-slot="collapsible-header"
      className={cn(
        "typo-ui flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left font-medium outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 group-data-open/collapsible:rounded-b-none",
        className
      )}
      {...props}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {showIcon ? (
        <ChevronDownIcon
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground transition-transform group-data-open/collapsible:rotate-180"
        />
      ) : null}
    </CollapsibleTrigger>
  )
}

function CollapsibleBody({
  className,
  ...props
}: CollapsiblePrimitive.Panel.Props) {
  return (
    <CollapsibleContent
      data-slot="collapsible-body"
      className={cn(
        "typo-body border-t border-border px-3 py-2 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Collapsible,
  CollapsibleBody,
  CollapsibleContent,
  CollapsibleHeader,
  CollapsibleItem,
  CollapsibleTrigger,
}
