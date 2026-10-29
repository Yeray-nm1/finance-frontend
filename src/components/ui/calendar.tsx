import { useState, useMemo } from "react";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { cn } from "@/lib/utils";
import { calendarClassNames, previewClassNames } from "./variants/calendar.variants";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, weekStartsOn, ...props }: CalendarProps) {
  const [hoveredDate, setHoveredDate] = useState<Date | undefined>();

  const mergedClassNames = useMemo(
    () => ({ ...calendarClassNames, ...classNames }),
    [classNames]
  );

  const allSelected = (props as { selected?: { from: Date } }).selected;
  const rangeSelected: DateRange | undefined =
    allSelected?.from ? allSelected : undefined;

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

  const mergedModifiersClassNames = useMemo(
    () => ({ ...props.modifiersClassNames, ...previewClassNames }),
    [props.modifiersClassNames]
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
