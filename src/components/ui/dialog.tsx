import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
import { XIcon } from "lucide-react"

function Dialog({
  ...props
}: Readonly<React.ComponentProps<typeof DialogPrimitive.Root>>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: Readonly<React.ComponentProps<typeof DialogPrimitive.Trigger>>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogContent({
  className,
  children,
  ...props
}: Readonly<React.ComponentProps<typeof DialogPrimitive.Content>>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        data-slot="dialog-overlay"
        className="fixed inset-0 z-[60] bg-black/30"
      />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-white fixed top-1/2 left-1/2 z-[60] grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border border-[#e5e7eb] p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute top-4 right-4 rounded-md opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none">
          <XIcon className="size-5" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

function DialogHeader({
  className,
  ...props
}: Readonly<React.ComponentProps<"div">>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: Readonly<React.ComponentProps<typeof DialogPrimitive.Title>>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("font-semibold text-lg leading-none", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: Readonly<React.ComponentProps<typeof DialogPrimitive.Description>>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-[#6b7280]", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
}
