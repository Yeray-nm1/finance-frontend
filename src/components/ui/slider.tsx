import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

function resolveSliderValues(
  value: number[] | undefined,
  defaultValue: number[] | undefined,
  min: number,
  max: number
): number[] {
  if (Array.isArray(value)) return value
  if (Array.isArray(defaultValue)) return defaultValue
  return [min, max]
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: Readonly<React.ComponentProps<typeof SliderPrimitive.Root>>) {
  const _values = React.useMemo(
    () => resolveSliderValues(value, defaultValue, min, max),
    [value, defaultValue, min, max]
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn(
        "relative flex w-full touch-none items-center select-none",
        className
      )}
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="bg-border relative h-3 w-full grow overflow-hidden rounded-full"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="bg-primary absolute h-full"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          data-slot="slider-thumb"
          className="border-primary-border bg-white ring-primary-border/50 block size-5 rounded-full border-2 shadow-sm transition-all hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
