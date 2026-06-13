"use client"

import * as React from "react"
import { ImageIcon, UploadIcon, XIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { Button } from "./button"
import { cn } from "../../lib/utils"

export type InputUploadImageChange = {
  file: File | null
  previewUrl: string | null
}

const inputUploadImageVariants = cva(
  "group/input-upload-image relative flex w-full min-w-0 flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-input bg-transparent text-center shadow-none transition-colors outline-none focus-within:border-ring hover:bg-muted/40 has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:bg-input/50 has-disabled:opacity-50 aria-invalid:border-destructive dark:bg-input/30 dark:has-disabled:bg-input/80",
  {
    variants: {
      size: {
        default: "min-h-40 gap-2 p-4",
        sm: "min-h-32 gap-1.5 p-3",
        lg: "min-h-52 gap-3 p-5",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export type InputUploadImageProps = Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onChange"
> &
  VariantProps<typeof inputUploadImageVariants> & {
    value?: string | null
    defaultValue?: string | null
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
    onValueChange?: (change: InputUploadImageChange) => void
    onFileReject?: (file: File, reason: "type" | "size") => void
  }

function matchesAcceptedImage(file: File, accept: string): boolean {
  const acceptList = accept
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  if (!acceptList.length || acceptList.includes("*/*")) {
    return true
  }

  const fileType = file.type.toLowerCase()
  const fileName = file.name.toLowerCase()

  return acceptList.some((item) => {
    if (item.endsWith("/*")) {
      return fileType.startsWith(item.slice(0, -1))
    }

    if (item.startsWith(".")) {
      return fileName.endsWith(item)
    }

    return fileType === item
  })
}

function InputUploadImage({
  className,
  value,
  defaultValue = null,
  accept = "image/*",
  maxSize,
  disabled = false,
  placeholder = "Upload image",
  description = "PNG, JPG, GIF, or WebP",
  browseLabel = "Choose image",
  removeLabel = "Remove image",
  inputProps,
  onValueChange,
  onFileReject,
  size = "default",
  id,
  "aria-invalid": ariaInvalid,
  ...props
}: InputUploadImageProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const objectUrlRef = React.useRef<string | null>(null)
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = React.useState<string | null>(
    defaultValue
  )
  const previewUrl = isControlled ? value : internalValue
  const hasPreview = Boolean(previewUrl)

  React.useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  function commitValue(change: InputUploadImageChange) {
    if (!isControlled) {
      setInternalValue(change.previewUrl)
    }

    onValueChange?.(change)
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]

    if (!file) {
      return
    }

    if (!matchesAcceptedImage(file, accept)) {
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
    }

    const nextPreviewUrl = URL.createObjectURL(file)
    objectUrlRef.current = nextPreviewUrl
    commitValue({ file, previewUrl: nextPreviewUrl })
    event.currentTarget.value = ""
  }

  function clearImage(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }

    commitValue({ file: null, previewUrl: null })
  }

  function openPicker() {
    if (!disabled) {
      inputRef.current?.click()
    }
  }

  return (
    <div
      data-slot="input-upload-image"
      data-size={size}
      aria-invalid={ariaInvalid}
      className={cn(inputUploadImageVariants({ size }), className)}
      {...props}
      onClick={(event) => {
        props.onClick?.(event)
        if (!event.defaultPrevented) {
          openPicker()
        }
      }}
    >
      <input
        {...inputProps}
        ref={inputRef}
        id={id}
        data-slot="input-upload-image-input"
        className="sr-only"
        type="file"
        accept={accept}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        onChange={handleInputChange}
      />
      {hasPreview ? (
        <>
          <img
            data-slot="input-upload-image-preview"
            src={previewUrl ?? undefined}
            alt=""
            className="absolute inset-0 size-full object-cover"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-background/55 opacity-0 transition-opacity group-hover/input-upload-image:opacity-100 group-focus-within/input-upload-image:opacity-100 dark:bg-background/70" />
          <div className="relative z-10 flex items-center gap-2 opacity-0 transition-opacity group-hover/input-upload-image:opacity-100 group-focus-within/input-upload-image:opacity-100">
            <Button type="button" size="sm" variant="secondary" disabled={disabled}>
              {browseLabel}
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="secondary"
              tone="destructive"
              disabled={disabled}
              aria-label={removeLabel}
              onClick={clearImage}
            >
              <XIcon aria-hidden="true" />
            </Button>
          </div>
        </>
      ) : (
        <div
          data-slot="input-upload-image-empty"
          className="flex w-full max-w-[18rem] flex-col items-center justify-center gap-2 text-center"
        >
          <div className="flex flex-col items-center gap-1.5">
            <div
              data-slot="input-upload-image-icon"
              className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-5"
            >
              <ImageIcon aria-hidden="true" />
            </div>
            <div className="flex max-w-full flex-col items-center gap-0.5">
              <div
                data-slot="input-upload-image-placeholder"
                className="typo-label-md text-foreground"
              >
                {placeholder}
              </div>
              {description ? (
                <div
                  data-slot="input-upload-image-description"
                  className="typo-caption max-w-full text-muted-foreground"
                >
                  {description}
                </div>
              ) : null}
            </div>
          </div>
          <Button type="button" size="sm" variant="outline" disabled={disabled}>
            <UploadIcon aria-hidden="true" />
            {browseLabel}
          </Button>
        </div>
      )}
    </div>
  )
}

export { InputUploadImage, inputUploadImageVariants }
