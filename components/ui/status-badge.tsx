'use client';

import { LucideIcon } from 'lucide-react';

interface StatusBadgeProps {
  label: string;
  color: string;
  icon?: LucideIcon;
  animate?: boolean;
  size?: 'sm' | 'md';
}

export function StatusBadge({ label, color, icon: Icon, animate, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${color} ${sizeClasses}`}>
      {Icon && (
        <Icon className={`w-3.5 h-3.5 ${animate ? 'animate-spin' : ''}`} />
      )}
      {label}
    </span>
  );
}
