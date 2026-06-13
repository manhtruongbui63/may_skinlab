"use client"

import * as React from "react"
import { ImageIcon, PlusIcon, UploadIcon, Trash2 } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { Button } from "./button"
import { cn } from "../../lib/utils"

export type InputUploadImagesItem = {
  file: File | null
  previewUrl: string
}

const inputUploadImagesVariants = cva(
  "group/input-upload-images flex w-full min-w-0 flex-col gap-3 rounded-lg border border-dashed border-input bg-transparent p-3 shadow-none transition-colors outline-none focus-within:border-ring has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:bg-input/50 has-disabled:opacity-50 aria-invalid:border-destructive dark:bg-input/30 dark:has-disabled:bg-input/80",
  {
    variants: {
      size: {
        default: "[--upload-image-tile:6.5rem]",
        sm: "gap-2 p-2 [--upload-image-tile:5rem]",
        lg: "gap-4 p-4 [--upload-image-tile:8rem]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export type InputUploadImagesProps = Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onChange"
> &
  VariantProps<typeof inputUploadImagesVariants> & {
    values?: string[]
    defaultValues?: string[]
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
    onValueChange?: (items: InputUploadImagesItem[]) => void
    onFileReject?: (file: File, reason: "type" | "size" | "max-files") => void
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

function toItems(values: string[] | undefined): InputUploadImagesItem[] {
  return values?.map((previewUrl) => ({ file: null, previewUrl })) ?? []
}

function InputUploadImages({
  className,
  values,
  defaultValues = [],
  accept = "image/*",
  maxFiles = 8,
  maxSize,
  disabled = false,
  placeholder = "Upload images",
  description = "PNG, JPG, GIF, or WebP",
  browseLabel = "Choose images",
  addLabel = "Add images",
  removeLabel = "Remove image",
  inputProps,
  onValueChange,
  onFileReject,
  size = "default",
  id,
  "aria-invalid": ariaInvalid,
  ...props
}: InputUploadImagesProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const objectUrlsRef = React.useRef<Set<string>>(new Set())
  const isControlled = values !== undefined
  const [internalItems, setInternalItems] = React.useState<
    InputUploadImagesItem[]
  >(() => toItems(defaultValues))
  const items = isControlled ? toItems(values) : internalItems
  const remainingSlots = Math.max(0, maxFiles - items.length)

  React.useEffect(() => {
    const objectUrls = objectUrlsRef.current

    return () => {
      for (const objectUrl of objectUrls) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [])

  function commitItems(nextItems: InputUploadImagesItem[]) {
    if (!isControlled) {
      setInternalItems(nextItems)
    }

    onValueChange?.(nextItems)
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? [])
    const acceptedItems: InputUploadImagesItem[] = []
    let availableSlots = remainingSlots

    for (const file of files) {
      if (availableSlots <= 0) {
        onFileReject?.(file, "max-files")
        continue
      }

      if (!matchesAcceptedImage(file, accept)) {
        onFileReject?.(file, "type")
        continue
      }

      if (typeof maxSize === "number" && file.size > maxSize) {
        onFileReject?.(file, "size")
        continue
      }

      const previewUrl = URL.createObjectURL(file)
      objectUrlsRef.current.add(previewUrl)
      acceptedItems.push({ file, previewUrl })
      availableSlots -= 1
    }

    if (acceptedItems.length) {
      commitItems([...items, ...acceptedItems])
    }

    event.currentTarget.value = ""
  }

  function removeItem(index: number) {
    const item = items[index]

    if (item && objectUrlsRef.current.has(item.previewUrl)) {
      URL.revokeObjectURL(item.previewUrl)
      objectUrlsRef.current.delete(item.previewUrl)
    }

    commitItems(items.filter((_, itemIndex) => itemIndex !== index))
  }

  function openPicker() {
    if (!disabled && remainingSlots > 0) {
      inputRef.current?.click()
    }
  }

  return (
    <div
      data-slot="input-upload-images"
      data-size={size}
      aria-invalid={ariaInvalid}
      className={cn(inputUploadImagesVariants({ size }), className)}
      {...props}
    >
      <input
        {...inputProps}
        ref={inputRef}
        id={id}
        data-slot="input-upload-images-input"
        className="sr-only"
        type="file"
        accept={accept}
        disabled={disabled || remainingSlots === 0}
        multiple
        aria-invalid={ariaInvalid}
        onChange={handleInputChange}
      />
      <div
        data-slot="input-upload-images-grid"
        className={cn(
          items.length
            ? "grid grid-cols-[repeat(auto-fill,minmax(var(--upload-image-tile),1fr))] gap-2"
            : "block"
        )}
      >
        {items.map((item, index) => (
          <div
            key={`${item.previewUrl}-${index}`}
            data-slot="input-upload-images-item"
            className="group/input-upload-images-item relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
          >
            <img
              src={item.previewUrl}
              alt=""
              className="size-full object-cover"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-background/55 opacity-0 transition-opacity group-hover/input-upload-images-item:opacity-100 group-focus-within/input-upload-images-item:opacity-100 dark:bg-background/70" />
            <Button
              type="button"
              size="icon-xs"
              variant="default"
              tone="destructive"
              disabled={disabled}
              aria-label={`${removeLabel} ${index + 1}`}
              className="absolute right-1 top-1 opacity-0 transition-opacity group-hover/input-upload-images-item:opacity-100 group-focus-within/input-upload-images-item:opacity-100"
              onClick={(event) => {
                event.stopPropagation()
                removeItem(index)
              }}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        ))}
        {remainingSlots > 0 ? (
          <button
            type="button"
            data-slot="input-upload-images-add"
            className={cn(
              "rounded-lg border border-dashed border-input bg-transparent text-center transition-colors outline-none hover:bg-muted/40 focus-visible:border-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
              items.length
                ? "flex aspect-square min-h-[var(--upload-image-tile)] items-center justify-center p-2"
                : "flex items-center justify-center p-2"
            )}
            disabled={disabled}
            aria-label={addLabel}
            onClick={openPicker}
          >
            {items.length ? (
              <PlusIcon className="size-5 text-muted-foreground" aria-hidden="true" />
            ) : (
              <span
                data-slot="input-upload-images-empty"
                className="flex flex-col max-w-md items-center justify-center gap-2"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-5">
                  <ImageIcon aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="typo-label-md text-foreground">
                    {placeholder}
                  </span>
                  {description ? (
                    <span className="typo-caption text-muted-foreground">
                      {description}
                    </span>
                  ) : null}
                </span>
                <span className="typo-ui inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-foreground shadow-xs text-xs">
                  <UploadIcon className="size-3" aria-hidden="true" />
                  {browseLabel}
                </span>
              </span>
            )}
          </button>
        ) : null}
      </div>
    </div>
  )
}

export { InputUploadImages, inputUploadImagesVariants }
