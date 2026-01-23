'use client';

import { Shield, Clock, Star, Lock, CheckCircle } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface TrustBadge {
  icon: LucideIcon;
  text: string;
  color: string;
}

const DEFAULT_BADGES: TrustBadge[] = [
  { icon: Shield, text: 'Your essay stays private', color: 'text-green-600' },
  { icon: Clock, text: 'Results in 60 seconds', color: 'text-blue-600' },
  { icon: Star, text: '4.9/5 student rating', color: 'text-yellow-500' },
];

const PARENT_BADGES: TrustBadge[] = [
  { icon: Lock, text: 'Essay never shared or sold', color: 'text-green-600' },
  { icon: CheckCircle, text: 'COPPA compliant', color: 'text-blue-600' },
  { icon: Shield, text: '100% satisfaction guarantee', color: 'text-purple-600' },
];

interface TrustBadgesProps {
  variant?: 'default' | 'parent';
  className?: string;
}

export function TrustBadges({ variant = 'default', className = '' }: TrustBadgesProps) {
  const badges = variant === 'parent' ? PARENT_BADGES : DEFAULT_BADGES;

  return (
    <div className={`flex justify-center gap-8 text-sm text-gray-600 ${className}`}>
      {badges.map((badge, i) => (
        <div key={i} className="flex items-center gap-2">
          <badge.icon className={`w-5 h-5 ${badge.color}`} />
          <span>{badge.text}</span>
        </div>
      ))}
    </div>
  );
}
