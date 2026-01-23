'use client';

import { Shield, Clock, Star, Lock, CheckCircle, Sparkles } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface TrustBadge {
  icon: LucideIcon;
  text: string;
  iconColor: string;
}

const DEFAULT_BADGES: TrustBadge[] = [
  { icon: Shield, text: 'Your essay stays private', iconColor: 'text-success-500' },
  { icon: Clock, text: 'Results in 60 seconds', iconColor: 'text-brand-500' },
  { icon: Star, text: '4.9/5 student rating', iconColor: 'text-amber-500' },
];

const PARENT_BADGES: TrustBadge[] = [
  { icon: Lock, text: 'Essay never shared or sold', iconColor: 'text-success-500' },
  { icon: CheckCircle, text: 'COPPA compliant', iconColor: 'text-brand-500' },
  { icon: Shield, text: '100% satisfaction guarantee', iconColor: 'text-amber-500' },
];

interface TrustBadgesProps {
  variant?: 'default' | 'parent';
  className?: string;
}

export function TrustBadges({ variant = 'default', className = '' }: TrustBadgesProps) {
  const badges = variant === 'parent' ? PARENT_BADGES : DEFAULT_BADGES;

  return (
    <div className={`flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm ${className}`}>
      {badges.map((badge, i) => (
        <div
          key={i}
          className="flex items-center gap-2 text-neutral-600 transition-colors hover:text-neutral-900"
        >
          <badge.icon className={`w-4 h-4 ${badge.iconColor}`} />
          <span className="font-medium">{badge.text}</span>
        </div>
      ))}
    </div>
  );
}
