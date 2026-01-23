import * as React from "react"

import { cn } from "@/lib/utils/cn"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "flex h-11 w-full rounded-xl border-2 bg-white px-4 py-2 text-base text-neutral-900 transition-all duration-200",
          // Border & shadow
          "border-neutral-200 shadow-sm",
          // Placeholder
          "placeholder:text-neutral-400",
          // Hover state
          "hover:border-neutral-300",
          // Focus state - brand colored ring
          "focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10",
          // File input
          "file:border-0 file:bg-brand-50 file:text-brand-700 file:rounded-lg file:px-3 file:py-1 file:mr-3 file:text-sm file:font-medium file:cursor-pointer",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50",
          // Responsive
          "md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
