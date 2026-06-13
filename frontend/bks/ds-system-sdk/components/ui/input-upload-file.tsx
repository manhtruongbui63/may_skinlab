"use client"

import * as React from "react"
import { FileTerminal, UploadIcon, XIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { Button } from "./button"
import { cn } from "../../lib/utils"

export type InputUploadFileItem = {
  file: File | null
  name: string
  size?: number
  url?: string
  previewUrl?: string
}

const inputUploadFileVariants = cva(
  "group/input-upload-file flex w-full min-w-0 flex-col gap-3 shadow-none outline-none has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50",
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

export type InputUploadFileProps = Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onChange"
> &
  VariantProps<typeof inputUploadFileVariants> & {
    value?: InputUploadFileItem | null
    defaultValue?: InputUploadFileItem | null
    accept?: string
    maxSize?: number
    disabled?: boolean
    placeholder?: React.ReactNode
    description?: React.ReactNode
    browseLabel?: React.ReactNode
    removeLabel?: string
    inputProps?: Omit<
      React.ComponentProps<"input">,
      | "accept"
      | "defaultValue"
      | "disabled"
      | "onChange"
      | "type"
      | "value"
    >
    onValueChange?: (item: InputUploadFileItem | null) => void
    onFileReject?: (file: File, reason: "type" | "size") => void
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

function InputUploadFile({
  className,
  value,
  defaultValue = null,
  accept,
  maxSize,
  disabled = false,
  placeholder = "Upload file",
  description = "Choose a document or asset",
  browseLabel = "Choose file",
  removeLabel = "Remove file",
  inputProps,
  onValueChange,
  onFileReject,
  size = "default",
  id,
  "aria-invalid": ariaInvalid,
  ...props
}: InputUploadFileProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const objectUrlRef = React.useRef<string | null>(null)
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] =
    React.useState<InputUploadFileItem | null>(defaultValue)
  const item = isControlled ? value : internalValue
  const fileSize = formatFileSize(item?.size)
  const hasImagePreview = Boolean(item?.previewUrl)

  React.useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  function commitValue(nextItem: InputUploadFileItem | null) {
    if (!isControlled) setInternalValue(nextItem)
    onValueChange?.(nextItem)
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]

    if (!file) return

    if (!matchesAcceptedFile(file, accept)) {
      onFileReject?.(file, "type")
      event.currentTarget.value = ""
      return
    }

    if (typeof maxSize === "number" && file.size > maxSize) {
      onFileReject?.(file, "size")
      event.currentTarget.value = ""
      return
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }

    const previewUrl = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : undefined

    if (previewUrl) objectUrlRef.current = previewUrl

    commitValue({ file, name: file.name, size: file.size, previewUrl })
    event.currentTarget.value = ""
  }

  function openPicker() {
    if (!disabled) inputRef.current?.click()
  }

  function clearFile(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    commitValue(null)
  }

  return (
    <div
      data-slot="input-upload-file"
      data-size={size}
      aria-invalid={ariaInvalid}
      className={cn(inputUploadFileVariants({ size }), className)}
      {...props}
    >
      <input
        {...inputProps}
        ref={inputRef}
        id={id}
        data-slot="input-upload-file-input"
        className="sr-only"
        type="file"
        accept={accept}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        onChange={handleInputChange}
      />
      <button
        type="button"
        data-slot="input-upload-file-dropzone"
        className="flex min-h-[var(--upload-file-zone-height)] w-full items-center justify-center rounded-lg border border-dashed border-input bg-transparent p-3 text-center transition-colors outline-none hover:bg-muted/40 focus-visible:border-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive dark:bg-input/30 dark:disabled:bg-input/80"
        disabled={disabled}
        aria-invalid={ariaInvalid}
        onClick={openPicker}
      >
        <span
          data-slot="input-upload-file-empty"
          className="flex w-full max-w-[18rem] flex-col items-center justify-center gap-2 text-center"
        >
          <span className="flex flex-col items-center gap-1.5">
            <span
              data-slot="input-upload-file-icon"
              className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-5"
            >
              <UploadIcon aria-hidden="true" />
            </span>
            <span className="flex max-w-full flex-col items-center gap-0.5">
              <span
                data-slot="input-upload-file-placeholder"
                className="typo-label-md text-foreground"
              >
                {placeholder}
              </span>
              {description ? (
                <span
                  data-slot="input-upload-file-description"
                  className="typo-caption max-w-full text-muted-foreground"
                >
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
      {item ? (
        <div
          data-slot="input-upload-file-item"
          className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-background p-1.5"
        >
          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted text-muted-foreground [&_svg]:size-6">
            {hasImagePreview ? (
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
            aria-label={removeLabel}
            onClick={clearFile}
          >
            <XIcon aria-hidden="true" />
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export { InputUploadFile, inputUploadFileVariants }
