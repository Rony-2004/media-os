'use client';

import { useRef, useState } from 'react';
import { Check, Clock } from 'lucide-react';
import { FloatingPopover } from '@/components/ui/floating-popover';
import { buildTimeOptions } from '@/lib/calendar';
import { cn } from '@/lib/utils';

const TIME_OPTIONS = buildTimeOptions(5);

export function TimePicker({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [hour = '09', minute = '00'] = value.split(':');

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
        <span>{`${hour}:${minute}`}</span>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </button>

      <FloatingPopover
        anchorRef={anchorRef}
        open={open}
        onClose={() => setOpen(false)}
        estimatedHeight={328}
      >
        <div
          role="dialog"
          aria-label="Choose publishing time"
          className="w-full rounded-xl border border-border bg-card p-3 shadow-pop"
        >
          <div className="mb-3 flex items-center gap-2 border-b border-border/70 pb-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Clock className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-bold">Publishing time</p>
              <p className="font-mono text-[10px] text-muted-foreground">24-hour format</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TimeColumn
              label="Hour"
              options={TIME_OPTIONS.hours}
              value={hour}
              onChange={(nextHour) => onChange(`${nextHour}:${minute}`)}
            />
            <TimeColumn
              label="Minute"
              options={TIME_OPTIONS.minutes}
              value={minute}
              onChange={(nextMinute) => onChange(`${hour}:${nextMinute}`)}
            />
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-3">
            <span className="font-mono text-sm font-bold text-foreground">{hour}:{minute}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:brightness-105"
            >
              <Check className="h-3.5 w-3.5" />
              Done
            </button>
          </div>
        </div>
      </FloatingPopover>
    </div>
  );
}

function TimeColumn({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="scrollbar-none grid max-h-44 grid-cols-3 gap-1 overflow-y-auto rounded-lg border border-border bg-background p-1.5">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              'grid h-8 place-items-center rounded-md font-mono text-xs font-semibold transition-colors',
              option === value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
