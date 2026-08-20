export interface CalendarDay {
  date: string;
  day: number;
  inCurrentMonth: boolean;
}

interface AnchorBounds {
  top: number;
  bottom: number;
  left: number;
  width: number;
}

interface ViewportBounds {
  width: number;
  height: number;
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function buildCalendarMonth(year: number, month: number): CalendarDay[] {
  const firstWeekday = new Date(year, month, 1).getDay();

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(year, month, index - firstWeekday + 1);
    return {
      date: dateKey(date.getFullYear(), date.getMonth(), date.getDate()),
      day: date.getDate(),
      inCurrentMonth: date.getMonth() === month,
    };
  });
}

export function parseDateValue(value: string): { year: number; month: number; day: number } {
  const [year, month, day] = value.split('-').map(Number);
  const fallback = new Date();
  if (!year || !month || !day) {
    return {
      year: fallback.getFullYear(),
      month: fallback.getMonth(),
      day: fallback.getDate(),
    };
  }
  return { year, month: month - 1, day };
}

export function formatDateLabel(value: string): string {
  const { year, month, day } = parseDateValue(value);
  return `${String(day).padStart(2, '0')}-${String(month + 1).padStart(2, '0')}-${year}`;
}

export function buildTimeOptions(stepMinutes = 5): { hours: string[]; minutes: string[] } {
  return {
    hours: Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0')),
    minutes: Array.from(
      { length: Math.ceil(60 / stepMinutes) },
      (_, index) => String(index * stepMinutes).padStart(2, '0'),
    ).filter((minute) => Number(minute) < 60),
  };
}

export function calculateFloatingPosition(
  anchor: AnchorBounds,
  viewport: ViewportBounds,
  popoverHeight: number,
): { left: number; top: number; width: number; placement: 'top' | 'bottom' } {
  const edge = 16;
  const gap = 8;
  const width = Math.min(Math.max(anchor.width, 288), viewport.width - edge * 2);
  const left = Math.min(Math.max(anchor.left, edge), viewport.width - width - edge);
  const spaceBelow = viewport.height - anchor.bottom - gap;
  const placement = spaceBelow >= popoverHeight || spaceBelow >= anchor.top ? 'bottom' : 'top';
  const top =
    placement === 'bottom'
      ? anchor.bottom + gap
      : Math.max(edge, anchor.top - gap - popoverHeight);

  return { left, top, width, placement };
}
