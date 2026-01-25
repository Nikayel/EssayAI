'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MobileNav } from '@/components/layout/mobile-nav';
import {
  PenTool,
  FolderOpen,
  ShoppingBag,
  User,
  LogOut,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface HeaderProps {
  variant?: 'public' | 'dashboard';
  user?: {
    email?: string;
  };
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function Header({ variant = 'public', user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/60 bg-white/80 backdrop-blur-xl dark:bg-neutral-900/80 dark:border-neutral-700/60">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600">
            <PenTool className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">IvyWay</span>
        </Link>

        {/* Navigation */}
        {variant === 'public' ? (
          <PublicNav />
        ) : (
          <DashboardNav user={user} />
        )}
      </div>
    </header>
  );
}

// =============================================================================
// PUBLIC NAV (Landing, Pricing pages)
// =============================================================================

function PublicNav() {
  return (
    <>
      <nav className="hidden md:flex items-center gap-6">
        <Link href="/pricing" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
          Pricing
        </Link>
        <Link href="/ivy" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">
          Ivy League
        </Link>
        <Link href="/login">
          <Button variant="outline">Log In</Button>
        </Link>
        <Link href="/signup">
          <Button>Get Started</Button>
        </Link>
      </nav>
      <MobileNav />
    </>
  );
}

// =============================================================================
// DASHBOARD NAV (Authenticated pages)
// =============================================================================

function DashboardNav({ user }: { user?: { email?: string } }) {
  return (
    <div className="flex gap-2 items-center">
      {user?.email && (
        <span className="text-sm text-neutral-500 dark:text-neutral-400 mr-2 hidden md:block">
          {user.email}
        </span>
      )}
      <Link href="/dashboard/portfolio">
        <Button variant="ghost" size="sm">
          <FolderOpen className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Portfolio</span>
        </Button>
      </Link>
      <Link href="/dashboard/orders">
        <Button variant="ghost" size="sm">
          <ShoppingBag className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Orders</span>
        </Button>
      </Link>
      <Link href="/profile">
        <Button variant="ghost" size="sm">
          <User className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Profile</span>
        </Button>
      </Link>
      <form action="/auth/signout" method="post">
        <Button variant="outline" size="sm" type="submit">
          <LogOut className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}

// =============================================================================
// SKELETON HEADER (For loading states)
// =============================================================================

export function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/60 bg-white/80 backdrop-blur-xl dark:bg-neutral-900/80 dark:border-neutral-700/60">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
          <div className="w-20 h-6 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="w-20 h-9 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
          <div className="w-20 h-9 rounded-lg bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
        </div>
      </div>
    </header>
  );
}
