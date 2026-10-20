import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "success"
    | "warning"
    | "destructive"
    | "outline";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variants = {
    default:
      "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border-transparent",
    secondary:
      "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border-transparent",
    success:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-transparent",
    warning:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-transparent",
    destructive:
      "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border-transparent",
    outline:
      "text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700",
  };

  return (
    <div
      className={twMerge(
        clsx(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
          variants[variant],
          className
        )
      )}
      {...props}
    />
  );
}
