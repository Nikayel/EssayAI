import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-200',
  {
    variants: {
      variant: {
        // Default - Brand colored
        default:
          'bg-brand-100 text-brand-700 border border-brand-200/50',

        // Secondary - Neutral
        secondary:
          'bg-neutral-100 text-neutral-700 border border-neutral-200/50',

        // Success - Green for positive states
        success:
          'bg-success-50 text-success-700 border border-success-200/50',

        // Warning - Amber for attention
        warning:
          'bg-warning-50 text-warning-700 border border-warning-200/50',

        // Destructive - Red for errors
        destructive:
          'bg-error-50 text-error-600 border border-error-200/50',

        // Outline - Just border
        outline:
          'bg-transparent text-neutral-700 border-2 border-neutral-200',

        // Premium - Gold/amber for premium features
        premium:
          'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border border-amber-200/50',

        // Info - Blue tint
        info:
          'bg-blue-50 text-blue-700 border border-blue-200/50',

        // New - For new features
        new:
          'bg-gradient-to-r from-brand-500 to-brand-600 text-white border-0 shadow-sm',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        default: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

function Badge({ className, variant, size, icon, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
