import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils/cn"

const cardVariants = cva(
  "rounded-2xl transition-all duration-200",
  {
    variants: {
      variant: {
        // Default - Clean white card with soft shadow
        default:
          "bg-white border border-neutral-200/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05),0_4px_16px_-4px_rgba(0,0,0,0.03)]",

        // Elevated - More prominent shadow for emphasis
        elevated:
          "bg-white border border-neutral-200/40 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08),0_8px_32px_-8px_rgba(0,0,0,0.05)]",

        // Glass - Glassmorphism effect
        glass:
          "bg-white/70 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]",

        // Interactive - Hover effects for clickable cards
        interactive:
          "bg-white border border-neutral-200/60 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05),0_4px_16px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.1),0_8px_32px_-8px_rgba(0,0,0,0.08)] hover:border-neutral-300/60 hover:-translate-y-0.5 cursor-pointer",

        // Outline - Minimal with just border
        outline:
          "bg-transparent border-2 border-neutral-200 hover:border-neutral-300",

        // Brand - Subtle brand color background
        brand:
          "bg-gradient-to-br from-brand-50 to-brand-100/50 border border-brand-200/50 shadow-[0_2px_8px_-2px_rgba(124,58,237,0.08)]",

        // Success - For positive states
        success:
          "bg-gradient-to-br from-success-50 to-emerald-50 border border-success-200/50",

        // Warning - For attention states
        warning:
          "bg-gradient-to-br from-warning-50 to-amber-50 border border-warning-200/50",

        // Ghost - No visible background
        ghost:
          "bg-transparent border-none shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-tight tracking-tight text-neutral-900",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-neutral-500 leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
