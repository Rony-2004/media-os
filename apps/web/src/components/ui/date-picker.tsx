'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { FloatingPopover } from '@/components/ui/floating-popover';
import { buildCalendarMonth, formatDateLabel, parseDateValue } from '@/lib/calendar';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function DatePicker({
  id,
  value,
  min,
  onChange,
}: {
  id: string;
  value: string;
  min?: string;
  onChange: (value: string) => void;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const selected = parseDateValue(value);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => ({
    year: selected.year,
    month: selected.month,
  }));

  useEffect(() => {
    if (!open) return;
    setVisibleMonth({ year: selected.year, month: selected.month });
    // The selected date is the only value that should reset the visible month.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, value]);

  const days = useMemo(
    () => buildCalendarMonth(visibleMonth.year, visibleMonth.month),
    [visibleMonth],
  );
  const monthLabel = new Intl.DateTimeFormat('en', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(visibleMonth.year, visibleMonth.month, 1));

  const moveMonth = (offset: number) => {
    const next = new Date(visibleMonth.year, visibleMonth.month + offset, 1);
    setVisibleMonth({ year: next.getFullYear(), month: next.getMonth() });
  };

  const chooseToday = () => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (!min || today >= min) onChange(today);
    setOpen(false);
  };

  return (
    <div ref={anchorRef}>
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="field flex h-11 items-center justify-between text-left font-medium"
      >
        <span>{formatDateLabel(value)}</span>
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
      </button>

      <FloatingPopover anchorRef={anchorRef} open={open} onClose={() => setOpen(false)}>
        <div
          role="dialog"
          aria-label="Choose publishing date"
          className="w-full rounded-xl border border-border bg-card p-3 shadow-pop"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              aria-label="Previous month"
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold">{monthLabel}</span>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              aria-label="Next month"
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((weekday) => (
              <span
                key={weekday}
                className="grid h-8 place-items-center font-mono text-[10px] font-bold text-muted-foreground"
              >
                {weekday}
              </span>
            ))}
            {days.map((calendarDay) => {
              const disabled = Boolean(min && calendarDay.date < min);
              const active = calendarDay.date === value;
              return (
                <button
                  key={calendarDay.date}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(calendarDay.date);
                    setOpen(false);
                  }}
                  className={cn(
                    'grid h-9 place-items-center rounded-lg text-xs font-semibold transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : calendarDay.inCurrentMonth
                        ? 'text-foreground hover:bg-muted'
                        : 'text-muted-foreground/40 hover:bg-muted/60',
                    disabled && 'cursor-not-allowed opacity-25 hover:bg-transparent',
                  )}
                >
                  {calendarDay.day}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex justify-end border-t border-border/70 pt-2">
            <button
              type="button"
              onClick={chooseToday}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
            >
              Today
            </button>
          </div>
        </div>
      </FloatingPopover>
    </div>
  );
}
