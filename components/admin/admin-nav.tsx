'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Menu,
  X,
  Users,
  UserCheck,
  Settings,
  BarChart3,
  TrendingUp,
  MessageSquare,
  LayoutDashboard,
  ChevronRight,
} from 'lucide-react';

const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/reviewers', label: 'Reviewers', icon: UserCheck },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/conversions', label: 'Conversions', icon: TrendingUp },
  { href: '/admin/qa', label: 'Q&A Sessions', icon: MessageSquare },
  { href: '/admin/config', label: 'Config', icon: Settings },
];

export function AdminMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
        aria-label="Toggle admin menu"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
        ) : (
          <Menu className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu Panel */}
          <div className="absolute top-full right-0 mt-2 w-64 z-50 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden animate-scale-in">
            <nav className="py-2">
              {ADMIN_NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="flex-1">{item.label}</span>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 text-brand-500" />
                    )}
                  </Link>
                );
              })}

              {/* Divider */}
              <div className="my-2 border-t border-neutral-200 dark:border-neutral-700" />

              {/* Back to Dashboard */}
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>My Dashboard</span>
              </Link>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Desktop admin navigation - horizontal links
 */
export function AdminDesktopNav() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex items-center gap-1">
      {ADMIN_NAV_ITEMS.slice(1).map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant={isActive ? 'secondary' : 'ghost'}
              size="sm"
              className={isActive ? 'bg-brand-50 text-brand-700' : ''}
            >
              {item.label}
            </Button>
          </Link>
        );
      })}

      <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-2" />

      <Link href="/dashboard">
        <Button variant="outline" size="sm">
          My Dashboard
        </Button>
      </Link>
    </div>
  );
}
