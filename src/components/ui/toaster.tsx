"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"

function ToastViewport(props: React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>) {
  return <ToastPrimitives.Viewport {...props} />
}
ToastViewport.displayName = "ToastViewport"

export function Toaster() {
  return (
    <ToastPrimitives.Provider>
      <ToastViewport className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]" />
    </ToastPrimitives.Provider>
  )
}
