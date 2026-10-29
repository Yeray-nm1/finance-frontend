import { cn } from "@/lib/utils"

export const calendarClassNames = {
  root: cn("p-2"),
  button_previous: cn("border border-border bg-white hover:bg-bg-elevated"),
  button_next: cn("border border-border bg-white hover:bg-bg-elevated"),
  weekday: cn("text-text-muted text-xs font-normal"),
  day_button: cn(
    "size-8 text-sm rounded-md hover:bg-primary-light hover:text-primary",
    "group-hover/selected:!bg-transparent group-hover/selected:!text-inherit",
    "group-hover/preview_end:!bg-transparent group-hover/preview_end:!text-inherit"
  ),
  selected: cn("group/selected bg-primary text-white font-semibold"),
  today: cn("text-primary font-bold"),
  outside: cn("text-text-muted opacity-50"),
  disabled: cn("opacity-40 cursor-not-allowed"),
  range_middle: cn("!bg-bg-elevated !text-inherit font-semibold"),
  range_start: cn("bg-primary text-white font-semibold"),
  range_end: cn("bg-primary text-white font-semibold"),
}

export const previewClassNames = {
  preview_middle: cn("!bg-bg-elevated !text-inherit font-semibold"),
  preview_end: cn("group/preview_end bg-primary text-white font-semibold"),
}
