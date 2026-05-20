import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={cn("", className)}
      classNames={{
        root: cn("text-sm"),
        months: cn("flex"),
        month: cn("space-y-2"),
        month_caption: cn("flex justify-center items-center h-9"),
        nav: cn("flex items-center gap-1"),
        button_previous: cn("size-7 inline-flex items-center justify-center rounded-md border border-border bg-white hover:bg-gray-100"),
        button_next: cn("size-7 inline-flex items-center justify-center rounded-md border border-border bg-white hover:bg-gray-100"),
        month_grid: cn("border-collapse"),
        weekday: cn("text-text-muted text-xs font-normal py-2"),
        day: cn("p-0"),
        day_button: cn(
          "size-9 text-sm rounded-md hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-border"
        ),
        selected: cn("bg-primary text-white hover:bg-primary-hover"),
        today: cn("font-semibold"),
        outside: cn("text-text-muted opacity-50"),
        disabled: cn("opacity-40 cursor-not-allowed"),
        range_middle: cn("bg-primary-light"),
        range_start: cn("bg-primary text-white hover:bg-primary-hover rounded-l-full"),
        range_end: cn("bg-primary text-white hover:bg-primary-hover rounded-r-full"),
        ...classNames,
      }}
      {...props}
    />
  );
}

export { Calendar };
