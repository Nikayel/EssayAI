import * as React from "react"

import { cn } from "@/lib/utils/cn"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          // Base styles
          "flex min-h-[120px] w-full rounded-xl border-2 bg-white px-4 py-3 text-base text-neutral-900 transition-all duration-200 resize-none",
          // Border & shadow
          "border-neutral-200 shadow-sm",
          // Placeholder
          "placeholder:text-neutral-400",
          // Hover state
          "hover:border-neutral-300",
          // Focus state - brand colored ring
          "focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10",
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
Textarea.displayName = "Textarea"

export { Textarea }
