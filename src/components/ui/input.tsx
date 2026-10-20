import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  prefixNode?: React.ReactNode;
  suffixNode?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, prefixNode, suffixNode, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {prefixNode && (
            <div className="absolute left-3 flex items-center pointer-events-none text-neutral-500">
              {prefixNode}
            </div>
          )}
          <input
            type={type}
            className={twMerge(
              clsx(
                "flex h-10 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-sm",
                prefixNode && "pl-9",
                suffixNode && "pr-9",
                error && "border-red-500 focus-visible:ring-red-500",
                className
              )
            )}
            ref={ref}
            {...props}
          />
          {suffixNode && (
            <div className="absolute right-3 flex items-center pointer-events-none text-neutral-500">
              {suffixNode}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
