'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full",
  {
    variants: {
      size: {
        sm: "h-1.5",
        default: "h-2.5",
        lg: "h-4",
      },
      variant: {
        default: "bg-neutral-200",
        brand: "bg-brand-100",
        success: "bg-success-100",
        warning: "bg-warning-100",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
);

const progressBarVariants = cva(
  "h-full transition-all duration-500 ease-out rounded-full",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-brand-500 to-brand-600",
        brand: "bg-gradient-to-r from-brand-500 to-brand-600",
        success: "bg-gradient-to-r from-success-500 to-emerald-500",
        warning: "bg-gradient-to-r from-warning-500 to-amber-500",
        rainbow: "bg-gradient-to-r from-brand-500 via-accent-500 to-success-500",
      },
      animated: {
        true: "animate-gradient bg-[length:200%_100%]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      animated: false,
    },
  }
);

interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value?: number;
  max?: number;
  showLabel?: boolean;
  animated?: boolean;
  barVariant?: VariantProps<typeof progressBarVariants>['variant'];
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({
    className = '',
    value = 0,
    max = 100,
    size,
    variant,
    barVariant,
    showLabel = false,
    animated = false,
    ...props
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div className="w-full">
        {showLabel && (
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-neutral-600 font-medium">Progress</span>
            <span className="text-neutral-900 font-semibold">{Math.round(percentage)}%</span>
          </div>
        )}
        <div
          ref={ref}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={value}
          className={cn(progressVariants({ size, variant }), className)}
          {...props}
        >
          <div
            className={cn(progressBarVariants({ variant: barVariant || variant, animated }))}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress, progressVariants };
