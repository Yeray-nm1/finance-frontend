"use client"

import { useToast } from "@/hooks/use-toast"
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from "@/components/ui/toast"
import { toastVariants } from "@/components/ui/variants/toast.variants"
import { CircleCheck, CircleX } from "lucide-react"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, variant, actionLabel, onAction }) => (
        <Toast key={id} className={toastVariants({ variant })}>
          <div className="flex min-w-0 items-center gap-2">
            {variant === "destructive" ? (
              <CircleX className="size-4 shrink-0 text-white" aria-hidden="true" />
            ) : (
              <CircleCheck className="size-4 shrink-0 text-white" aria-hidden="true" />
            )}
            <div className="flex min-w-0 items-baseline gap-2">
              {title && <ToastTitle className="shrink-0 whitespace-nowrap">{title}</ToastTitle>}
              {description && <ToastDescription className="truncate">{description}</ToastDescription>}
            </div>
          </div>
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={() => {
                onAction()
                dismiss(id)
              }}
              className="shrink-0 rounded px-2 py-1 text-xs font-semibold underline underline-offset-2 hover:bg-white/15"
            >
              {actionLabel}
            </button>
          )}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
