import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils/cn"

const buttonVariants = cva(
  // Base styles with smooth transitions and micro-interactions
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Primary - Bold brand color with colored shadow
        default:
          "bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-[0_1px_0_0_rgba(255,255,255,0.1)_inset,0_4px_14px_0_rgba(124,58,237,0.25)] hover:from-brand-600 hover:to-brand-700 hover:shadow-[0_1px_0_0_rgba(255,255,255,0.1)_inset,0_8px_20px_0_rgba(124,58,237,0.35)] hover:-translate-y-0.5",

        // Destructive - For dangerous actions
        destructive:
          "bg-gradient-to-b from-error-500 to-error-600 text-white shadow-[0_1px_0_0_rgba(255,255,255,0.1)_inset,0_4px_14px_0_rgba(239,68,68,0.25)] hover:from-error-600 hover:to-red-700 hover:shadow-[0_1px_0_0_rgba(255,255,255,0.1)_inset,0_8px_20px_0_rgba(239,68,68,0.35)] hover:-translate-y-0.5",

        // Outline - Clean border with subtle fill on hover
        outline:
          "border-2 border-neutral-200 bg-white text-neutral-700 shadow-sm hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-900 hover:shadow-md",

        // Secondary - Soft background, perfect for secondary actions
        secondary:
          "bg-neutral-100 text-neutral-700 shadow-sm hover:bg-neutral-200 hover:text-neutral-900 hover:shadow",

        // Ghost - Minimal, for tertiary actions
        ghost:
          "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",

        // Link - Text only with underline
        link:
          "text-brand-600 underline-offset-4 hover:underline hover:text-brand-700",

        // Premium - Gold/amber gradient for upsells
        premium:
          "bg-gradient-to-b from-amber-400 to-amber-500 text-amber-950 shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset,0_4px_14px_0_rgba(245,158,11,0.3)] hover:from-amber-500 hover:to-amber-600 hover:shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset,0_8px_20px_0_rgba(245,158,11,0.4)] hover:-translate-y-0.5",

        // Success - For confirmation actions
        success:
          "bg-gradient-to-b from-success-500 to-success-600 text-white shadow-[0_1px_0_0_rgba(255,255,255,0.1)_inset,0_4px_14px_0_rgba(34,197,94,0.25)] hover:from-success-600 hover:to-green-700 hover:shadow-[0_1px_0_0_rgba(255,255,255,0.1)_inset,0_8px_20px_0_rgba(34,197,94,0.35)] hover:-translate-y-0.5",

        // Soft brand - Softer brand colored button
        "brand-soft":
          "bg-brand-50 text-brand-700 hover:bg-brand-100 hover:text-brand-800",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
