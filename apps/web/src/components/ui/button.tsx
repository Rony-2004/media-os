'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const buttonVariants = cva('btn', {
  variants: {
    variant: {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      ghost: 'btn-ghost',
      danger: 'btn-danger',
      success:
        'btn text-success-foreground shadow-soft [background-image:linear-gradient(135deg,hsl(var(--success)),hsl(158_70%_38%))] hover:brightness-110',
      outline: 'btn border border-primary/35 bg-primary/5 text-primary hover:bg-primary/[0.12]',
      contrast: 'btn bg-foreground text-background shadow-soft hover:opacity-90',
    },
    size: {
      xs: 'h-7 gap-1.5 px-2.5 text-[11px]',
      sm: 'h-9 px-3.5 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-[15px]',
      icon: 'h-9 w-9 p-0',
      'icon-sm': 'h-8 w-8 p-0',
    },
    block: {
      true: 'w-full',
    },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});

type ButtonBaseProps = VariantProps<typeof buttonVariants> & {
  loading?: boolean;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
};

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'>,
    ButtonBaseProps {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, block, loading, icon, trailingIcon, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : icon}
      {children}
      {!loading ? trailingIcon : null}
    </button>
  );
});

/** Same visual language as Button, rendered as a Next.js link. */
export function ButtonLink({
  href,
  className,
  variant,
  size,
  block,
  icon,
  trailingIcon,
  children,
  ...props
}: { href: string; children?: ReactNode } & ButtonBaseProps &
  Omit<React.ComponentPropsWithoutRef<typeof Link>, 'href' | 'className'> & { className?: string }) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size, block }), className)} {...props}>
      {icon}
      {children}
      {trailingIcon}
    </Link>
  );
}
