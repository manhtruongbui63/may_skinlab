"use client"

import * as React from "react"
import { FileTerminal, UploadIcon, XIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { Button } from "./button"
import { cn } from "../../lib/utils"

export type InputUploadFilesItem = {
  file: File | null
  name: string
  size?: number
  url?: string
  previewUrl?: string
}

const inputUploadFilesVariants = cva(
  "group/input-upload-files flex w-full min-w-0 flex-col gap-3 shadow-none outline-none has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50",
  {
    variants: {
      size: {
        default: "[--upload-file-zone-height:10rem]",
        sm: "gap-2 [--upload-file-zone-height:8rem]",
        lg: "gap-4 [--upload-file-zone-height:13rem]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export type InputUploadFilesProps = Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onChange"
> &
  VariantProps<typeof inputUploadFilesVariants> & {
    values?: InputUploadFilesItem[]
    defaultValues?: InputUploadFilesItem[]
    accept?: string
    maxFiles?: number
    maxSize?: number
    disabled?: boolean
    placeholder?: React.ReactNode
    description?: React.ReactNode
    browseLabel?: React.ReactNode
    addLabel?: string
    removeLabel?: string
    inputProps?: Omit<
      React.ComponentProps<"input">,
      | "accept"
      | "defaultValue"
      | "disabled"
      | "multiple"
      | "onChange"
      | "type"
      | "value"
    >
    onValueChange?: (items: InputUploadFilesItem[]) => void
    onFileReject?: (file: File, reason: "type" | "size" | "max-files") => void
  }

function formatFileSize(value: number | undefined): string | null {
  if (value === undefined) return null
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function matchesAcceptedFile(file: File, accept: string | undefined): boolean {
  if (!accept) return true

  const acceptList = accept
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  if (!acceptList.length || acceptList.includes("*/*")) return true

  const fileType = file.type.toLowerCase()
  const fileName = file.name.toLowerCase()

  return acceptList.some((item) => {
    if (item.endsWith("/*")) return fileType.startsWith(item.slice(0, -1))
    if (item.startsWith(".")) return fileName.endsWith(item)
    return fileType === item
  })
}

function InputUploadFiles({
  className,
  values,
  defaultValues = [],
  accept,
  maxFiles = 8,
  maxSize,
  disabled = false,
  placeholder = "Upload files",
  description = "Choose documents or assets",
  browseLabel = "Choose files",
  removeLabel = "Remove file",
  inputProps,
  onValueChange,
  onFileReject,
  size = "default",
  id,
  "aria-invalid": ariaInvalid,
  ...props
}: InputUploadFilesProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const objectUrlsRef = React.useRef<Set<string>>(new Set())
  const isControlled = values !== undefined
  const [internalItems, setInternalItems] =
    React.useState<InputUploadFilesItem[]>(defaultValues)
  const items = isControlled ? values : internalItems
  const remainingSlots = Math.max(0, maxFiles - items.length)

  React.useEffect(() => {
    const objectUrls = objectUrlsRef.current

    return () => {
      for (const objectUrl of objectUrls) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [])

  function commitItems(nextItems: InputUploadFilesItem[]) {
    if (!isControlled) setInternalItems(nextItems)
    onValueChange?.(nextItems)
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? [])
    const acceptedItems: InputUploadFilesItem[] = []
    let availableSlots = remainingSlots

    for (const file of files) {
      if (availableSlots <= 0) {
        onFileReject?.(file, "max-files")
        continue
      }

      if (!matchesAcceptedFile(file, accept)) {
        onFileReject?.(file, "type")
        continue
      }

      if (typeof maxSize === "number" && file.size > maxSize) {
        onFileReject?.(file, "size")
        continue
      }

      const previewUrl = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined

      if (previewUrl) objectUrlsRef.current.add(previewUrl)

      acceptedItems.push({ file, name: file.name, size: file.size, previewUrl })
      availableSlots -= 1
    }

    if (acceptedItems.length) commitItems([...items, ...acceptedItems])
    event.currentTarget.value = ""
  }

  function removeItem(index: number) {
    const item = items[index]

    if (item?.previewUrl && objectUrlsRef.current.has(item.previewUrl)) {
      URL.revokeObjectURL(item.previewUrl)
      objectUrlsRef.current.delete(item.previewUrl)
    }

    commitItems(items.filter((_, itemIndex) => itemIndex !== index))
  }

  function openPicker() {
    if (!disabled && remainingSlots > 0) inputRef.current?.click()
  }

  return (
    <div
      data-slot="input-upload-files"
      data-size={size}
      aria-invalid={ariaInvalid}
      className={cn(inputUploadFilesVariants({ size }), className)}
      {...props}
    >
      <input
        {...inputProps}
        ref={inputRef}
        id={id}
        data-slot="input-upload-files-input"
        className="sr-only"
        type="file"
        accept={accept}
        disabled={disabled || remainingSlots === 0}
        multiple
        aria-invalid={ariaInvalid}
        onChange={handleInputChange}
      />
      {remainingSlots > 0 ? (
        <button
          type="button"
          data-slot="input-upload-files-dropzone"
          className="flex min-h-[var(--upload-file-zone-height)] w-full items-center justify-center rounded-lg border border-dashed border-input bg-transparent p-3 text-center transition-colors outline-none hover:bg-muted/40 focus-visible:border-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive dark:bg-input/30 dark:disabled:bg-input/80"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          onClick={openPicker}
        >
          <span
            data-slot="input-upload-files-empty"
            className="flex w-full max-w-[18rem] flex-col items-center justify-center gap-2 text-center"
          >
            <span className="flex flex-col items-center gap-1.5">
              <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-5">
                <UploadIcon aria-hidden="true" />
              </span>
              <span className="flex max-w-full flex-col items-center gap-0.5">
                <span className="typo-label-md text-foreground">
                  {placeholder}
                </span>
                {description ? (
                  <span className="typo-caption max-w-full text-muted-foreground">
                    {description}
                  </span>
                ) : null}
              </span>
            </span>
            <span className="typo-ui text-[0.8rem] inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-foreground shadow-xs">
              {browseLabel}
            </span>
          </span>
        </button>
      ) : null}
      {items.length ? (
        <div data-slot="input-upload-files-list" className="flex flex-col gap-2">
          {items.map((item, index) => {
            const fileSize = formatFileSize(item.size)

            return (
              <div
                key={`${item.name}-${index}`}
                data-slot="input-upload-files-item"
                className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-background p-2"
              >
                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted text-muted-foreground [&_svg]:size-6">
                  {item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt=""
                      className="size-full object-cover"
                      aria-hidden="true"
                    />
                  ) : (
                      <FileTerminal aria-hidden="true" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
                  <div className="typo-label-md truncate text-foreground">
                    {item.url ? (
                      <a
                        href={item.url}
                        className="underline-offset-4 hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {item.name}
                      </a>
                    ) : (
                      item.name
                    )}
                  </div>
                  {fileSize ? (
                    <div className="typo-caption text-muted-foreground">
                      {fileSize}
                    </div>
                  ) : null}
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={disabled}
                  aria-label={`${removeLabel} ${index + 1}`}
                  onClick={() => removeItem(index)}
                >
                  <XIcon aria-hidden="true" />
                </Button>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export { InputUploadFiles, inputUploadFilesVariants }
