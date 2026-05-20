import { useState, useMemo } from "react";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const staticClassNames = {
  root: cn("p-2"),
  button_previous: cn("border border-border bg-white hover:bg-gray-100"),
  button_next: cn("border border-border bg-white hover:bg-gray-100"),
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
  range_middle: cn("!bg-gray-200 !text-inherit font-semibold"),
  range_start: cn("bg-primary text-white font-semibold"),
  range_end: cn("bg-primary text-white font-semibold"),
};

function Calendar({ className, classNames, weekStartsOn, ...props }: CalendarProps) {
  const [hoveredDate, setHoveredDate] = useState<Date | undefined>();

  const mergedClassNames = useMemo(
    () => ({ ...staticClassNames, ...classNames }),
    [classNames]
  );

  const allSelected = (props as { selected?: { from: Date } }).selected;
  const rangeSelected: DateRange | undefined =
    allSelected?.from ? (allSelected as DateRange) : undefined;

  const previewModifiers = useMemo(() => {
    if (!rangeSelected?.from || !hoveredDate) return {};
    if (rangeSelected.to && rangeSelected.from.getTime() !== rangeSelected.to.getTime()) return {};

    const fromTime = rangeSelected.from.getTime();
    const hoveredTime = hoveredDate.getTime();

    if (fromTime === hoveredTime) return {};

    const [start, end] = fromTime < hoveredTime
      ? [rangeSelected.from, hoveredDate]
      : [hoveredDate, rangeSelected.from];

    return {
      preview_middle: { after: start, before: end },
      preview_end: hoveredDate,
    };
  }, [rangeSelected, hoveredDate]);

  const mergedModifiers = useMemo(
    () => ({ ...props.modifiers, ...previewModifiers }),
    [props.modifiers, previewModifiers]
  );

  const previewClassNames = useMemo(() => ({
    preview_middle: cn("!bg-gray-200 !text-inherit font-semibold"),
    preview_end: cn("group/preview_end bg-primary text-white font-semibold"),
  }), []);

  const mergedModifiersClassNames = useMemo(
    () => ({ ...props.modifiersClassNames, ...previewClassNames }),
    [props.modifiersClassNames, previewClassNames]
  );

  return (
    <DayPicker
      className={cn("", className)}
      weekStartsOn={weekStartsOn ?? 1}
      classNames={mergedClassNames}
      {...props}
      modifiers={mergedModifiers}
      modifiersClassNames={mergedModifiersClassNames}
      onDayClick={() => setHoveredDate(undefined)}
      onDayMouseEnter={(date: Date) => {
        if (rangeSelected?.from && (!rangeSelected.to || rangeSelected.from.getTime() === rangeSelected.to.getTime())) {
          setHoveredDate(date);
        }
      }}
    />
  );
}

export { Calendar };
