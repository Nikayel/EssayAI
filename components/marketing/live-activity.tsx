'use client';

import { useEffect, useState } from 'react';
import { Activity, Users } from 'lucide-react';

interface LiveActivityIndicatorProps {
  className?: string;
}

// Simulated live activity for social proof
// In production, this could connect to a real-time endpoint
const ACTIVITIES = [
  { school: 'Harvard', time: 'just now' },
  { school: 'Yale', time: '2 min ago' },
  { school: 'Princeton', time: '5 min ago' },
  { school: 'Columbia', time: '8 min ago' },
  { school: 'Stanford', time: '12 min ago' },
  { school: 'MIT', time: '15 min ago' },
  { school: 'Brown', time: '18 min ago' },
  { school: 'UPenn', time: '22 min ago' },
];

export function LiveActivityIndicator({ className = '' }: LiveActivityIndicatorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Rotate through activities every 4 seconds
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % ACTIVITIES.length);
        setIsVisible(true);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const activity = ACTIVITIES[currentIndex];

  return (
    <div
      className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-neutral-200/80 shadow-sm transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
      } ${className}`}
    >
      {/* Pulsing dot */}
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success-500" />
      </span>

      <span className="text-sm text-neutral-600">
        <span className="font-medium text-neutral-800">{activity.school}</span>
        {' '}essay analyzed {activity.time}
      </span>
    </div>
  );
}

// Alternative: Active users count
export function ActiveUsersIndicator({ className = '' }: { className?: string }) {
  const [count, setCount] = useState(12);

  useEffect(() => {
    // Simulate fluctuating active users
    const interval = setInterval(() => {
      setCount((prev) => {
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        return Math.max(5, Math.min(25, prev + change));
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success-50 border border-success-200/60 ${className}`}
    >
      <Users className="w-4 h-4 text-success-600" />
      <span className="text-sm font-medium text-success-700">
        {count} students analyzing right now
      </span>
    </div>
  );
}
