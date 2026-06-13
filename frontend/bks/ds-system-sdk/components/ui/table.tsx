"use client"

import * as React from "react"

import { cn } from "../../lib/utils"

interface TableProps extends React.ComponentProps<"table"> {
  isEmpty?: boolean
}

function Table({ className, isEmpty, ...props }: TableProps) {
  return (
    <div
      data-slot="table-container"
      className={cn(
        "relative w-full overflow-x-auto custom-scrollbar",
        "has-[tbody:empty]:overflow-x-hidden",
        "has-[tbody_>_tr:only-child_td[colspan]]:overflow-x-hidden",
        isEmpty && "overflow-x-hidden"
      )}
    >
      <table
        data-slot="table"
        data-empty={isEmpty}
        className={cn(
          "w-full caption-bottom border-separate border-spacing-0 text-sm",
          "[&_tr>*:first-child]:pl-4 [&_tr>*:last-child]:pr-4",
          "has-[tbody:empty]:[&_th:not([data-sticky])]:min-w-0! has-[tbody:empty]:[&_th:not([data-sticky])]:w-auto! has-[tbody:empty]:[&_td:not([data-sticky])]:min-w-0! has-[tbody:empty]:[&_td:not([data-sticky])]:w-auto!",
          "has-[tbody_>_tr:only-child_td[colspan]]:[&_th:not([data-sticky])]:min-w-0! has-[tbody_>_tr:only-child_td[colspan]]:[&_th:not([data-sticky])]:w-auto! has-[tbody_>_tr:only-child_td[colspan]]:[&_td:not([data-sticky])]:min-w-0! has-[tbody_>_tr:only-child_td[colspan]]:[&_td:not([data-sticky])]:w-auto!",
          isEmpty && "[&_th:not([data-sticky])]:min-w-0! [&_th:not([data-sticky])]:w-auto! [&_td:not([data-sticky])]:min-w-0! [&_td:not([data-sticky])]:w-auto!",
          className
        )}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted group/row",
        className
      )}
      {...props}
    />
  )
}

interface TableHeadProps extends React.ComponentProps<"th"> {
  sticky?: boolean
  left?: string | number
  right?: string | number
  borderRight?: boolean
  borderLeft?: boolean
}

function TableHead({
  className,
  sticky,
  left,
  right,
  borderRight,
  borderLeft,
  style,
  ...props
}: TableHeadProps) {
  return (
    <th
      data-slot="table-head"
      data-sticky={sticky || undefined}
      className={cn(
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        sticky ? "sticky z-40 bg-muted" : "bg-muted/50",
        sticky && borderRight && "shadow-[4px_0_8px_-4px] shadow-black/5 dark:shadow-black/20",
        borderRight && "border-r border-border/50",
        borderLeft && "border-l border-border/50",
        className
      )}
      style={{
        ...(sticky && left !== undefined ? { left } : {}),
        ...(sticky && right !== undefined ? { right } : {}),
        ...style,
      }}
      {...props}
    />
  )
}

interface TableCellProps extends React.ComponentProps<"td"> {
  sticky?: boolean
  left?: string | number
  right?: string | number
  borderRight?: boolean
  borderLeft?: boolean
}

function TableCell({
  className,
  sticky,
  left,
  right,
  borderRight,
  borderLeft,
  style,
  ...props
}: TableCellProps) {
  return (
    <td
      data-slot="table-cell"
      data-sticky={sticky || undefined}
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        sticky &&
          "sticky z-30 bg-card group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted group-has-aria-expanded/row:bg-muted",
        sticky && borderRight && "shadow-[4px_0_8px_-4px] shadow-black/5 dark:shadow-black/20",
        borderRight && "border-r border-border/50",
        borderLeft && "border-l border-border/50",
        className
      )}
      style={{
        ...(sticky && left !== undefined ? { left } : {}),
        ...(sticky && right !== undefined ? { right } : {}),
        ...style,
      }}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
