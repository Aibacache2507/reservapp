import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={twMerge(
          clsx(
            "text-sm font-medium leading-none text-neutral-800 dark:text-neutral-200 select-none",
            className
          )
        )}
        {...props}
      >
        {children}
        {required && <span className="ml-1 text-pink-600">*</span>}
      </label>
    );
  }
);

Label.displayName = "Label";
