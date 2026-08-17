'use client';

import { forwardRef, useId } from 'react';
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

export function Label({
  children,
  className,
  htmlFor,
  hint,
}: {
  children: ReactNode;
  className?: string;
  htmlFor?: string;
  hint?: ReactNode;
}) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className={cn('text-xs font-semibold text-foreground', className)}>
        {children}
      </label>
      {hint ? <span className="font-mono text-[10px] text-muted-foreground">{hint}</span> : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, icon, trailing, ...props },
  ref,
) {
  if (!icon && !trailing) {
    return <input ref={ref} className={cn('field', className)} {...props} />;
  }

  return (
    <div className="relative">
      {icon ? (
        <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-muted-foreground">
          {icon}
        </span>
      ) : null}
      <input
        ref={ref}
        className={cn('field', icon && 'pl-10', trailing && 'pr-11', className)}
        {...props}
      />
      {trailing ? (
        <span className="absolute inset-y-0 right-0 flex w-11 items-center justify-center">{trailing}</span>
      ) : null}
    </div>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn('field resize-y leading-relaxed', className)} {...props} />;
  },
);

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, options, ...props },
  ref,
) {
  return (
    <select ref={ref} className={cn('field', className)} {...props}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
});

/** A labelled field wrapper — label, control, and optional helper text. */
export function Field({
  label,
  hint,
  help,
  children,
  className,
}: {
  label?: string;
  hint?: ReactNode;
  help?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      {label ? <Label hint={hint}>{label}</Label> : null}
      {children}
      {help ? <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">{help}</p> : null}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full border transition-all duration-300 ease-spring disabled:opacity-50',
        checked ? 'border-transparent bg-primary' : 'border-border bg-muted',
      )}
    >
      <span
        className={cn(
          'absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform duration-300 ease-spring',
          checked ? 'translate-x-[23px]' : 'translate-x-[3px]',
        )}
      />
    </button>
  );
}

export function ToggleRow({
  title,
  description,
  checked,
  onChange,
  icon,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  icon?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors duration-200',
        checked ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/30',
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span
            className={cn(
              'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors',
              checked ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
            )}
          >
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="text-xs font-bold text-foreground">{title}</p>
          <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

export function RangeSlider({
  label,
  value,
  min = 1,
  max = 5,
  leftLabel,
  rightLabel,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  leftLabel: string;
  rightLabel: string;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-xs font-bold text-foreground">
          {label}
        </label>
        <span className="chip border-primary/25 bg-primary/10 font-mono text-[10px] text-primary">
          {value} / {max}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(parseInt(event.target.value, 10))}
        style={{ backgroundSize: `${percent}% 100%` }}
      />
      <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

/** Removable pill used for topic and blocked-word lists. */
export function TokenChip({
  children,
  onRemove,
  tone = 'primary',
}: {
  children: ReactNode;
  onRemove: () => void;
  tone?: 'primary' | 'danger';
}) {
  return (
    <span
      className={cn(
        'group chip gap-1 pr-1.5 transition-all duration-200 hover:scale-105',
        tone === 'primary'
          ? 'border-primary/25 bg-primary/10 text-primary'
          : 'border-destructive/25 bg-destructive/10 text-destructive',
      )}
    >
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove"
        className="grid h-4 w-4 place-items-center rounded-full opacity-60 transition-opacity group-hover:opacity-100"
      >
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
      </button>
    </span>
  );
}
